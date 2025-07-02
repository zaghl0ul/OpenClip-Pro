"""
Load Testing and Performance Optimization Framework
Implements automated load testing, performance profiling, and optimization strategies
"""

import asyncio
import time
import statistics
import json
import csv
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Callable, Tuple
from dataclasses import dataclass, field
from enum import Enum
import aiohttp
import numpy as np
from locust import HttpUser, task, between, events
import cProfile
import pstats
import io
import memory_profiler
import line_profiler
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import psutil
import gc

from ..config import settings
from ..services.monitoring_service import monitoring

# Performance thresholds
PERFORMANCE_THRESHOLDS = {
    "response_time_p95": 1000,  # 1 second
    "response_time_p99": 2000,  # 2 seconds
    "error_rate": 0.01,  # 1%
    "requests_per_second": 100,
    "cpu_usage": 80,  # 80%
    "memory_usage": 85,  # 85%
}

class TestScenario(str, Enum):
    """Load test scenarios"""
    BASIC = "basic"
    SPIKE = "spike"
    STRESS = "stress"
    SOAK = "soak"
    BREAKPOINT = "breakpoint"

@dataclass
class LoadTestConfig:
    """Load test configuration"""
    scenario: TestScenario
    base_url: str
    duration: int  # seconds
    users: int
    spawn_rate: int
    auth_token: Optional[str] = None
    endpoints: List[Dict[str, Any]] = field(default_factory=list)
    thresholds: Dict[str, float] = field(default_factory=dict)

@dataclass
class TestResult:
    """Load test results"""
    scenario: TestScenario
    start_time: datetime
    end_time: datetime
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time: float
    median_response_time: float
    p95_response_time: float
    p99_response_time: float
    requests_per_second: float
    error_rate: float
    response_times: List[float] = field(default_factory=list)
    errors: List[Dict[str, Any]] = field(default_factory=list)
    resource_usage: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "scenario": self.scenario.value,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "duration": (self.end_time - self.start_time).total_seconds(),
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "average_response_time": self.average_response_time,
            "median_response_time": self.median_response_time,
            "p95_response_time": self.p95_response_time,
            "p99_response_time": self.p99_response_time,
            "requests_per_second": self.requests_per_second,
            "error_rate": self.error_rate,
            "resource_usage": self.resource_usage
        }
    
    def meets_thresholds(self, thresholds: Dict[str, float]) -> Tuple[bool, List[str]]:
        """Check if results meet performance thresholds"""
        violations = []
        
        if self.p95_response_time > thresholds.get("response_time_p95", float('inf')):
            violations.append(f"P95 response time ({self.p95_response_time}ms) exceeds threshold")
        
        if self.p99_response_time > thresholds.get("response_time_p99", float('inf')):
            violations.append(f"P99 response time ({self.p99_response_time}ms) exceeds threshold")
        
        if self.error_rate > thresholds.get("error_rate", 1.0):
            violations.append(f"Error rate ({self.error_rate:.2%}) exceeds threshold")
        
        if self.requests_per_second < thresholds.get("requests_per_second", 0):
            violations.append(f"RPS ({self.requests_per_second}) below threshold")
        
        return len(violations) == 0, violations

class LoadTestRunner:
    """
    Advanced load testing runner with multiple scenarios
    Supports various load patterns and performance analysis
    """
    
    def __init__(self):
        self.results: List[TestResult] = []
        self.is_running = False
        self.current_test: Optional[LoadTestConfig] = None
        
    async def run_test(self, config: LoadTestConfig) -> TestResult:
        """Run load test with specified configuration"""
        self.current_test = config
        self.is_running = True
        
        print(f"Starting {config.scenario.value} load test...")
        print(f"Target: {config.base_url}")
        print(f"Duration: {config.duration}s")
        print(f"Users: {config.users}")
        print(f"Spawn rate: {config.spawn_rate}/s")
        
        start_time = datetime.now()
        
        # Initialize result tracking
        response_times = []
        errors = []
        total_requests = 0
        successful_requests = 0
        
        # Start resource monitoring
        resource_monitor = ResourceMonitor()
        resource_monitor.start()
        
        try:
            # Run scenario-specific test
            if config.scenario == TestScenario.BASIC:
                results = await self._run_basic_test(config)
            elif config.scenario == TestScenario.SPIKE:
                results = await self._run_spike_test(config)
            elif config.scenario == TestScenario.STRESS:
                results = await self._run_stress_test(config)
            elif config.scenario == TestScenario.SOAK:
                results = await self._run_soak_test(config)
            else:  # BREAKPOINT
                results = await self._run_breakpoint_test(config)
            
            # Aggregate results
            for result in results:
                total_requests += 1
                if result["success"]:
                    successful_requests += 1
                    response_times.append(result["response_time"])
                else:
                    errors.append(result["error"])
            
        finally:
            self.is_running = False
            resource_usage = resource_monitor.stop()
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Calculate metrics
        test_result = TestResult(
            scenario=config.scenario,
            start_time=start_time,
            end_time=end_time,
            total_requests=total_requests,
            successful_requests=successful_requests,
            failed_requests=total_requests - successful_requests,
            average_response_time=statistics.mean(response_times) if response_times else 0,
            median_response_time=statistics.median(response_times) if response_times else 0,
            p95_response_time=np.percentile(response_times, 95) if response_times else 0,
            p99_response_time=np.percentile(response_times, 99) if response_times else 0,
            requests_per_second=total_requests / duration if duration > 0 else 0,
            error_rate=(total_requests - successful_requests) / total_requests if total_requests > 0 else 0,
            response_times=response_times,
            errors=errors,
            resource_usage=resource_usage
        )
        
        self.results.append(test_result)
        
        # Check thresholds
        passed, violations = test_result.meets_thresholds(
            config.thresholds or PERFORMANCE_THRESHOLDS
        )
        
        if not passed:
            print("\n⚠️  Performance threshold violations:")
            for violation in violations:
                print(f"  - {violation}")
        
        return test_result
    
    async def _run_basic_test(self, config: LoadTestConfig) -> List[Dict[str, Any]]:
        """Run basic constant load test"""
        results = []
        
        async with aiohttp.ClientSession() as session:
            # Spawn users gradually
            active_users = []
            spawn_interval = 1.0 / config.spawn_rate
            
            for i in range(config.users):
                user = asyncio.create_task(
                    self._simulate_user(session, config, results)
                )
                active_users.append(user)
                await asyncio.sleep(spawn_interval)
            
            # Run for specified duration
            await asyncio.sleep(config.duration)
            
            # Stop all users
            for user in active_users:
                user.cancel()
            
            await asyncio.gather(*active_users, return_exceptions=True)
        
        return results
    
    async def _run_spike_test(self, config: LoadTestConfig) -> List[Dict[str, Any]]:
        """Run spike test with sudden load increase"""
        results = []
        
        async with aiohttp.ClientSession() as session:
            # Normal load phase (25% of duration)
            normal_users = int(config.users * 0.3)
            spike_users = config.users
            
            phase1_duration = config.duration * 0.25
            phase2_duration = config.duration * 0.5
            phase3_duration = config.duration * 0.25
            
            # Phase 1: Normal load
            active_users = []
            for i in range(normal_users):
                user = asyncio.create_task(
                    self._simulate_user(session, config, results)
                )
                active_users.append(user)
            
            await asyncio.sleep(phase1_duration)
            
            # Phase 2: Spike
            for i in range(spike_users - normal_users):
                user = asyncio.create_task(
                    self._simulate_user(session, config, results)
                )
                active_users.append(user)
            
            await asyncio.sleep(phase2_duration)
            
            # Phase 3: Return to normal
            users_to_stop = active_users[normal_users:]
            for user in users_to_stop:
                user.cancel()
            
            await asyncio.sleep(phase3_duration)
            
            # Stop remaining users
            for user in active_users[:normal_users]:
                user.cancel()
            
            await asyncio.gather(*active_users, return_exceptions=True)
        
        return results
    
    async def _simulate_user(
        self,
        session: aiohttp.ClientSession,
        config: LoadTestConfig,
        results: List[Dict[str, Any]]
    ):
        """Simulate a single user making requests"""
        headers = {}
        if config.auth_token:
            headers["Authorization"] = f"Bearer {config.auth_token}"
        
        while True:
            try:
                # Select random endpoint
                endpoint = self._select_endpoint(config.endpoints)
                url = f"{config.base_url}{endpoint['path']}"
                method = endpoint.get("method", "GET")
                
                # Make request
                start_time = time.time()
                
                async with session.request(
                    method,
                    url,
                    headers=headers,
                    json=endpoint.get("body"),
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    await response.read()
                    response_time = (time.time() - start_time) * 1000  # ms
                    
                    results.append({
                        "success": response.status < 400,
                        "status_code": response.status,
                        "response_time": response_time,
                        "endpoint": endpoint['path'],
                        "method": method,
                        "timestamp": datetime.now()
                    })
                    
                    if response.status >= 400:
                        results[-1]["error"] = {
                            "status_code": response.status,
                            "message": await response.text()
                        }
                
                # Think time between requests
                await asyncio.sleep(endpoint.get("think_time", 1))
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                results.append({
                    "success": False,
                    "response_time": 0,
                    "endpoint": endpoint['path'] if 'endpoint' in locals() else "unknown",
                    "error": {
                        "type": type(e).__name__,
                        "message": str(e)
                    },
                    "timestamp": datetime.now()
                })
    
    def _select_endpoint(self, endpoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Select endpoint based on weights"""
        if not endpoints:
            return {"path": "/health", "method": "GET", "weight": 1}
        
        # Simple weighted random selection
        total_weight = sum(e.get("weight", 1) for e in endpoints)
        rand_weight = np.random.uniform(0, total_weight)
        
        cumulative_weight = 0
        for endpoint in endpoints:
            cumulative_weight += endpoint.get("weight", 1)
            if rand_weight <= cumulative_weight:
                return endpoint
        
        return endpoints[0]
    
    def generate_report(self, result: TestResult, output_format: str = "html") -> str:
        """Generate load test report"""
        if output_format == "html":
            return self._generate_html_report(result)
        elif output_format == "json":
            return json.dumps(result.to_dict(), indent=2)
        else:  # CSV
            return self._generate_csv_report(result)
    
    def _generate_html_report(self, result: TestResult) -> str:
        """Generate HTML report with charts"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Load Test Report - {result.scenario.value}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .metric {{ display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; }}
        .chart-container {{ width: 600px; height: 400px; margin: 20px 0; }}
        .pass {{ color: green; }}
        .fail {{ color: red; }}
    </style>
</head>
<body>
    <h1>Load Test Report: {result.scenario.value}</h1>
    <p>Test Duration: {(result.end_time - result.start_time).total_seconds():.1f} seconds</p>
    
    <h2>Summary</h2>
    <div class="metrics">
        <div class="metric">
            <h3>Total Requests</h3>
            <p>{result.total_requests:,}</p>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <p class="{'pass' if result.error_rate < 0.01 else 'fail'}">{(1 - result.error_rate):.1%}</p>
        </div>
        <div class="metric">
            <h3>Avg Response Time</h3>
            <p>{result.average_response_time:.0f} ms</p>
        </div>
        <div class="metric">
            <h3>P95 Response Time</h3>
            <p class="{'pass' if result.p95_response_time < 1000 else 'fail'}">{result.p95_response_time:.0f} ms</p>
        </div>
        <div class="metric">
            <h3>Requests/Second</h3>
            <p>{result.requests_per_second:.1f}</p>
        </div>
    </div>
    
    <h2>Response Time Distribution</h2>
    <canvas id="responseTimeChart"></canvas>
    
    <h2>Resource Usage</h2>
    <canvas id="resourceChart"></canvas>
    
    <script>
        // Response time histogram
        const rtCtx = document.getElementById('responseTimeChart').getContext('2d');
        const responseTimeChart = new Chart(rtCtx, {{
            type: 'bar',
            data: {{
                labels: ['0-100ms', '100-500ms', '500-1000ms', '1000-2000ms', '>2000ms'],
                datasets: [{{
                    label: 'Request Count',
                    data: {self._calculate_histogram(result.response_times)},
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }}]
            }}
        }});
        
        // Resource usage chart
        const resourceCtx = document.getElementById('resourceChart').getContext('2d');
        const resourceChart = new Chart(resourceCtx, {{
            type: 'line',
            data: {{
                labels: {list(range(len(result.resource_usage.get('cpu_usage', []))))},
                datasets: [
                    {{
                        label: 'CPU Usage (%)',
                        data: {result.resource_usage.get('cpu_usage', [])},
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    }},
                    {{
                        label: 'Memory Usage (%)',
                        data: {result.resource_usage.get('memory_usage', [])},
                        borderColor: 'rgb(54, 162, 235)',
                        tension: 0.1
                    }}
                ]
            }}
        }});
    </script>
</body>
</html>
"""
        return html
    
    def _calculate_histogram(self, response_times: List[float]) -> List[int]:
        """Calculate response time histogram"""
        bins = [0, 100, 500, 1000, 2000, float('inf')]
        counts = [0] * (len(bins) - 1)
        
        for rt in response_times:
            for i in range(len(bins) - 1):
                if bins[i] <= rt < bins[i + 1]:
                    counts[i] += 1
                    break
        
        return counts

class ResourceMonitor:
    """Monitor system resources during load test"""
    
    def __init__(self):
        self.monitoring = True
        self.cpu_usage = []
        self.memory_usage = []
        self.network_io = []
        self.disk_io = []
        self._monitor_task = None
    
    def start(self):
        """Start monitoring resources"""
        self.monitoring = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())
    
    def stop(self) -> Dict[str, Any]:
        """Stop monitoring and return results"""
        self.monitoring = False
        if self._monitor_task:
            self._monitor_task.cancel()
        
        return {
            "cpu_usage": self.cpu_usage,
            "memory_usage": self.memory_usage,
            "network_io": self.network_io,
            "disk_io": self.disk_io,
            "avg_cpu": statistics.mean(self.cpu_usage) if self.cpu_usage else 0,
            "max_cpu": max(self.cpu_usage) if self.cpu_usage else 0,
            "avg_memory": statistics.mean(self.memory_usage) if self.memory_usage else 0,
            "max_memory": max(self.memory_usage) if self.memory_usage else 0
        }
    
    async def _monitor_loop(self):
        """Monitor system resources continuously"""
        while self.monitoring:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                self.cpu_usage.append(cpu_percent)
                
                # Memory usage
                memory = psutil.virtual_memory()
                self.memory_usage.append(memory.percent)
                
                # Network I/O
                net_io = psutil.net_io_counters()
                self.network_io.append({
                    "bytes_sent": net_io.bytes_sent,
                    "bytes_recv": net_io.bytes_recv,
                    "timestamp": time.time()
                })
                
                # Disk I/O
                disk_io = psutil.disk_io_counters()
                self.disk_io.append({
                    "read_bytes": disk_io.read_bytes,
                    "write_bytes": disk_io.write_bytes,
                    "timestamp": time.time()
                })
                
                await asyncio.sleep(1)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Resource monitoring error: {e}")

class PerformanceOptimizer:
    """
    Performance optimization utilities
    Provides profiling, analysis, and optimization recommendations
    """
    
    def __init__(self):
        self.profiler = cProfile.Profile()
        self.line_profiler = line_profiler.LineProfiler()
    
    def profile_function(self, func: Callable, *args, **kwargs) -> Tuple[Any, str]:
        """Profile function execution"""
        self.profiler.enable()
        
        try:
            result = func(*args, **kwargs)
        finally:
            self.profiler.disable()
        
        # Generate profile report
        s = io.StringIO()
        ps = pstats.Stats(self.profiler, stream=s)
        ps.strip_dirs()
        ps.sort_stats('cumulative')
        ps.print_stats(20)  # Top 20 functions
        
        return result, s.getvalue()
    
    @memory_profiler.profile
    def profile_memory(self, func: Callable, *args, **kwargs) -> Any:
        """Profile memory usage of function"""
        return func(*args, **kwargs)
    
    def analyze_query_performance(self, query: str, connection) -> Dict[str, Any]:
        """Analyze database query performance"""
        # Run EXPLAIN ANALYZE
        explain_result = connection.execute(f"EXPLAIN ANALYZE {query}")
        
        analysis = {
            "query": query,
            "execution_plan": [],
            "total_time": 0,
            "recommendations": []
        }
        
        for row in explain_result:
            analysis["execution_plan"].append(row[0])
            
            # Parse execution time
            if "Execution Time:" in row[0]:
                time_str = row[0].split("Execution Time:")[1].strip()
                analysis["total_time"] = float(time_str.split(" ")[0])
        
        # Generate recommendations
        if "Seq Scan" in str(analysis["execution_plan"]):
            analysis["recommendations"].append(
                "Consider adding an index to avoid sequential scan"
            )
        
        if analysis["total_time"] > 1000:  # > 1 second
            analysis["recommendations"].append(
                "Query is slow - consider optimization"
            )
        
        return analysis
    
    def optimize_database_queries(self, slow_queries: List[str]) -> List[Dict[str, Any]]:
        """Generate optimization recommendations for slow queries"""
        optimizations = []
        
        for query in slow_queries:
            optimization = {
                "original_query": query,
                "recommendations": [],
                "optimized_query": None
            }
            
            # Check for missing indexes
            if "WHERE" in query.upper() and "INDEX" not in query.upper():
                optimization["recommendations"].append(
                    "Add index on WHERE clause columns"
                )
            
            # Check for SELECT *
            if "SELECT *" in query.upper():
                optimization["recommendations"].append(
                    "Avoid SELECT *, specify only required columns"
                )
            
            # Check for JOINs without indexes
            if "JOIN" in query.upper():
                optimization["recommendations"].append(
                    "Ensure JOIN columns are indexed"
                )
            
            # Check for subqueries
            if "SELECT" in query.upper() and query.upper().count("SELECT") > 1:
                optimization["recommendations"].append(
                    "Consider using JOINs instead of subqueries"
                )
            
            optimizations.append(optimization)
        
        return optimizations
    
    def generate_optimization_report(self) -> Dict[str, Any]:
        """Generate comprehensive optimization report"""
        return {
            "database_optimizations": {
                "connection_pool_size": {
                    "current": 20,
                    "recommended": 50,
                    "reason": "High concurrent connection demand"
                },
                "query_cache": {
                    "current": "disabled",
                    "recommended": "enabled",
                    "config": {
                        "size": "256MB",
                        "ttl": 300
                    }
                },
                "indexes_needed": [
                    "CREATE INDEX idx_projects_user_created ON projects(user_id, created_at)",
                    "CREATE INDEX idx_clips_project_type ON clips(project_id, clip_type)"
                ]
            },
            "application_optimizations": {
                "caching": {
                    "recommendation": "Implement Redis caching for frequently accessed data",
                    "potential_improvement": "50-70% reduction in database load"
                },
                "async_processing": {
                    "recommendation": "Move heavy operations to background tasks",
                    "tasks": ["video_processing", "ai_analysis", "thumbnail_generation"]
                },
                "api_pagination": {
                    "recommendation": "Implement cursor-based pagination",
                    "reason": "Better performance for large datasets"
                }
            },
            "infrastructure_optimizations": {
                "cdn": {
                    "recommendation": "Use CDN for static assets",
                    "providers": ["CloudFront", "Fastly", "Cloudflare"]
                },
                "load_balancing": {
                    "recommendation": "Implement application load balancer",
                    "configuration": {
                        "algorithm": "least_connections",
                        "health_check_interval": 30
                    }
                },
                "auto_scaling": {
                    "recommendation": "Configure auto-scaling groups",
                    "metrics": {
                        "cpu_threshold": 70,
                        "memory_threshold": 80,
                        "request_rate_threshold": 1000
                    }
                }
            }
        }

# Locust user for distributed load testing
class OpenClipUser(HttpUser):
    """Locust user for load testing OpenClip API"""
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login and get authentication token"""
        response = self.client.post("/auth/login", json={
            "email": "loadtest@example.com",
            "password": "LoadTest123!"
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.client.headers.update({"Authorization": f"Bearer {self.token}"})
    
    @task(3)
    def view_projects(self):
        """View projects list"""
        self.client.get("/api/v1/projects")
    
    @task(2)
    def view_project_detail(self):
        """View individual project"""
        # Assume we have some project IDs
        project_id = "test-project-1"
        self.client.get(f"/api/v1/projects/{project_id}")
    
    @task(1)
    def create_project(self):
        """Create new project"""
        self.client.post("/api/v1/projects", json={
            "name": f"Load Test Project {time.time()}",
            "description": "Created during load testing"
        })
    
    @task(2)
    def analyze_video(self):
        """Trigger video analysis"""
        project_id = "test-project-1"
        self.client.post(f"/api/v1/projects/{project_id}/analyze", json={
            "prompt": "Find highlights",
            "provider": "openai"
        })

# CLI for load testing
async def run_load_test_cli():
    """Command-line interface for load testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description="OpenClip Load Testing")
    parser.add_argument("--scenario", choices=["basic", "spike", "stress", "soak", "breakpoint"],
                       default="basic", help="Test scenario")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL")
    parser.add_argument("--duration", type=int, default=60, help="Test duration (seconds)")
    parser.add_argument("--users", type=int, default=10, help="Number of users")
    parser.add_argument("--spawn-rate", type=int, default=1, help="Users per second")
    parser.add_argument("--output", default="report.html", help="Output file")
    
    args = parser.parse_args()
    
    # Configure test
    config = LoadTestConfig(
        scenario=TestScenario(args.scenario),
        base_url=args.url,
        duration=args.duration,
        users=args.users,
        spawn_rate=args.spawn_rate,
        endpoints=[
            {"path": "/api/v1/projects", "method": "GET", "weight": 3},
            {"path": "/api/v1/projects", "method": "POST", "weight": 1,
             "body": {"name": "Test Project", "description": "Load test"}},
            {"path": "/health", "method": "GET", "weight": 1}
        ]
    )
    
    # Run test
    runner = LoadTestRunner()
    result = await runner.run_test(config)
    
    # Generate report
    output_format = "html" if args.output.endswith(".html") else "json"
    report = runner.generate_report(result, output_format)
    
    with open(args.output, "w") as f:
        f.write(report)
    
    print(f"\nLoad test complete! Report saved to {args.output}")
    print(f"Total requests: {result.total_requests}")
    print(f"Success rate: {(1 - result.error_rate):.1%}")
    print(f"Average response time: {result.average_response_time:.0f}ms")
    print(f"P95 response time: {result.p95_response_time:.0f}ms")

if __name__ == "__main__":
    asyncio.run(run_load_test_cli())
