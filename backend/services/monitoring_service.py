"""
Comprehensive Monitoring Service with Prometheus and Custom Metrics
Implements application metrics, performance tracking, and alerting
"""

import os
import time
import psutil
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Callable
from functools import wraps
import logging
from dataclasses import dataclass, field
from enum import Enum

from prometheus_client import (
    Counter, Gauge, Histogram, Summary, Info,
    CollectorRegistry, generate_latest, push_to_gateway,
    CONTENT_TYPE_LATEST
)
from prometheus_client.multiprocess import MultiProcessCollector
import aiohttp
from fastapi import FastAPI, Request, Response
from fastapi.responses import PlainTextResponse
import redis
import json

from ..config import settings

logger = logging.getLogger(__name__)

# Create custom registry
registry = CollectorRegistry()

# Application Info
app_info = Info(
    'openclip_app',
    'OpenClip application information',
    registry=registry
)

# HTTP Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status'],
    registry=registry
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint'],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
    registry=registry
)

http_request_size_bytes = Summary(
    'http_request_size_bytes',
    'HTTP request size',
    ['method', 'endpoint'],
    registry=registry
)

http_response_size_bytes = Summary(
    'http_response_size_bytes',
    'HTTP response size',
    ['method', 'endpoint'],
    registry=registry
)

# Business Metrics
video_uploads_total = Counter(
    'video_uploads_total',
    'Total video uploads',
    ['status', 'source'],
    registry=registry
)

video_processing_duration_seconds = Histogram(
    'video_processing_duration_seconds',
    'Video processing duration',
    ['operation', 'status'],
    buckets=(1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600),
    registry=registry
)

clips_generated_total = Counter(
    'clips_generated_total',
    'Total clips generated',
    ['clip_type', 'status'],
    registry=registry
)

ai_analysis_requests_total = Counter(
    'ai_analysis_requests_total',
    'Total AI analysis requests',
    ['provider', 'model', 'status'],
    registry=registry
)

ai_analysis_duration_seconds = Histogram(
    'ai_analysis_duration_seconds',
    'AI analysis duration',
    ['provider', 'model'],
    buckets=(0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0),
    registry=registry
)

ai_tokens_used_total = Counter(
    'ai_tokens_used_total',
    'Total AI tokens used',
    ['provider', 'model', 'type'],
    registry=registry
)

# User Metrics
active_users = Gauge(
    'active_users',
    'Number of active users',
    ['period'],
    registry=registry
)

user_registrations_total = Counter(
    'user_registrations_total',
    'Total user registrations',
    ['source'],
    registry=registry
)

user_sessions_active = Gauge(
    'user_sessions_active',
    'Active user sessions',
    registry=registry
)

# System Metrics
system_cpu_usage_percent = Gauge(
    'system_cpu_usage_percent',
    'System CPU usage percentage',
    ['core'],
    registry=registry
)

system_memory_usage_bytes = Gauge(
    'system_memory_usage_bytes',
    'System memory usage',
    ['type'],
    registry=registry
)

system_disk_usage_bytes = Gauge(
    'system_disk_usage_bytes',
    'System disk usage',
    ['path', 'type'],
    registry=registry
)

system_network_bytes_total = Counter(
    'system_network_bytes_total',
    'Network bytes transferred',
    ['direction', 'interface'],
    registry=registry
)

# Storage Metrics
storage_operations_total = Counter(
    'storage_operations_total',
    'Storage operations',
    ['provider', 'operation', 'status'],
    registry=registry
)

storage_bandwidth_bytes = Counter(
    'storage_bandwidth_bytes',
    'Storage bandwidth used',
    ['provider', 'direction'],
    registry=registry
)

storage_latency_seconds = Histogram(
    'storage_latency_seconds',
    'Storage operation latency',
    ['provider', 'operation'],
    buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0),
    registry=registry
)

# Cache Metrics
cache_operations_total = Counter(
    'cache_operations_total',
    'Cache operations',
    ['operation', 'status'],
    registry=registry
)

cache_hit_rate = Gauge(
    'cache_hit_rate',
    'Cache hit rate',
    registry=registry
)

# Error Metrics
errors_total = Counter(
    'errors_total',
    'Total errors',
    ['type', 'severity', 'component'],
    registry=registry
)

# Custom Metrics Registry
custom_metrics: Dict[str, Any] = {}

class MetricType(str, Enum):
    """Types of metrics"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"

@dataclass
class AlertRule:
    """Alert rule configuration"""
    name: str
    expression: str
    duration: timedelta
    severity: str = "warning"
    labels: Dict[str, str] = field(default_factory=dict)
    annotations: Dict[str, str] = field(default_factory=dict)
    
    def to_prometheus_rule(self) -> Dict[str, Any]:
        """Convert to Prometheus rule format"""
        return {
            "alert": self.name,
            "expr": self.expression,
            "for": f"{int(self.duration.total_seconds())}s",
            "labels": {
                "severity": self.severity,
                **self.labels
            },
            "annotations": self.annotations
        }

class MonitoringService:
    """
    Comprehensive monitoring service with Prometheus integration
    Handles metrics collection, aggregation, and alerting
    """
    
    def __init__(self):
        self.registry = registry
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.alert_rules: List[AlertRule] = []
        self._collection_task: Optional[asyncio.Task] = None
        self._initialized = False
        
        # Set application info
        app_info.info({
            'version': settings.APP_VERSION,
            'environment': settings.ENVIRONMENT,
            'commit': settings.GIT_COMMIT_SHA or 'unknown'
        })
        
        logger.info("MonitoringService initialized")
    
    async def initialize(self):
        """Initialize monitoring service"""
        if self._initialized:
            return
        
        # Load alert rules
        self._load_alert_rules()
        
        # Start metrics collection
        self._collection_task = asyncio.create_task(self._collect_system_metrics())
        
        # Initialize custom metrics
        self._initialize_custom_metrics()
        
        self._initialized = True
        logger.info("Monitoring service initialized with system metrics collection")
    
    def _load_alert_rules(self):
        """Load alert rules for Prometheus"""
        self.alert_rules = [
            # High error rate
            AlertRule(
                name="HighErrorRate",
                expression='rate(errors_total[5m]) > 0.05',
                duration=timedelta(minutes=5),
                severity="critical",
                annotations={
                    "summary": "High error rate detected",
                    "description": "Error rate is above 5% for the last 5 minutes"
                }
            ),
            
            # High memory usage
            AlertRule(
                name="HighMemoryUsage",
                expression='system_memory_usage_bytes{type="used"} / system_memory_usage_bytes{type="total"} > 0.9',
                duration=timedelta(minutes=10),
                severity="warning",
                annotations={
                    "summary": "High memory usage",
                    "description": "Memory usage is above 90%"
                }
            ),
            
            # High CPU usage
            AlertRule(
                name="HighCPUUsage",
                expression='avg(system_cpu_usage_percent) > 80',
                duration=timedelta(minutes=5),
                severity="warning",
                annotations={
                    "summary": "High CPU usage",
                    "description": "Average CPU usage is above 80%"
                }
            ),
            
            # Slow response times
            AlertRule(
                name="SlowResponseTime",
                expression='histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2',
                duration=timedelta(minutes=5),
                severity="warning",
                annotations={
                    "summary": "Slow response times",
                    "description": "95th percentile response time is above 2 seconds"
                }
            ),
            
            # Database connection pool exhaustion
            AlertRule(
                name="DatabasePoolExhaustion",
                expression='db_active_connections / db_connection_pool_size > 0.9',
                duration=timedelta(minutes=5),
                severity="critical",
                annotations={
                    "summary": "Database connection pool near exhaustion",
                    "description": "Database connection pool usage is above 90%"
                }
            ),
            
            # Storage failures
            AlertRule(
                name="StorageFailures",
                expression='rate(storage_operations_total{status="failure"}[5m]) > 0.1',
                duration=timedelta(minutes=5),
                severity="critical",
                annotations={
                    "summary": "High storage failure rate",
                    "description": "Storage operation failure rate is above 10%"
                }
            ),
            
            # AI provider failures
            AlertRule(
                name="AIProviderFailures",
                expression='rate(ai_analysis_requests_total{status="failure"}[5m]) > 0.2',
                duration=timedelta(minutes=5),
                severity="warning",
                annotations={
                    "summary": "AI provider failure rate high",
                    "description": "AI analysis failure rate is above 20%"
                }
            )
        ]
    
    def _initialize_custom_metrics(self):
        """Initialize custom business metrics"""
        # Revenue metrics
        self.register_metric(
            "revenue_total",
            MetricType.COUNTER,
            "Total revenue",
            labels=['currency', 'plan']
        )
        
        # Subscription metrics
        self.register_metric(
            "active_subscriptions",
            MetricType.GAUGE,
            "Active subscriptions",
            labels=['plan', 'status']
        )
        
        # Feature usage metrics
        self.register_metric(
            "feature_usage_total",
            MetricType.COUNTER,
            "Feature usage count",
            labels=['feature', 'plan']
        )
    
    async def _collect_system_metrics(self):
        """Continuously collect system metrics"""
        while True:
            try:
                # CPU metrics
                cpu_percent = psutil.cpu_percent(interval=1, percpu=True)
                for i, percent in enumerate(cpu_percent):
                    system_cpu_usage_percent.labels(core=str(i)).set(percent)
                
                # Memory metrics
                memory = psutil.virtual_memory()
                system_memory_usage_bytes.labels(type='total').set(memory.total)
                system_memory_usage_bytes.labels(type='used').set(memory.used)
                system_memory_usage_bytes.labels(type='available').set(memory.available)
                
                # Disk metrics
                for partition in psutil.disk_partitions():
                    try:
                        usage = psutil.disk_usage(partition.mountpoint)
                        system_disk_usage_bytes.labels(
                            path=partition.mountpoint,
                            type='total'
                        ).set(usage.total)
                        system_disk_usage_bytes.labels(
                            path=partition.mountpoint,
                            type='used'
                        ).set(usage.used)
                        system_disk_usage_bytes.labels(
                            path=partition.mountpoint,
                            type='free'
                        ).set(usage.free)
                    except Exception:
                        pass
                
                # Network metrics
                net_io = psutil.net_io_counters(pernic=True)
                for interface, counters in net_io.items():
                    system_network_bytes_total.labels(
                        direction='sent',
                        interface=interface
                    )._value.set(counters.bytes_sent)
                    system_network_bytes_total.labels(
                        direction='received',
                        interface=interface
                    )._value.set(counters.bytes_recv)
                
                # Update cache metrics
                await self._update_cache_metrics()
                
                # Update user metrics
                await self._update_user_metrics()
                
                await asyncio.sleep(30)  # Collect every 30 seconds
                
            except Exception as e:
                logger.error(f"Error collecting system metrics: {str(e)}")
                await asyncio.sleep(60)
    
    async def _update_cache_metrics(self):
        """Update cache-related metrics"""
        try:
            info = self.redis_client.info()
            
            # Calculate hit rate
            hits = info.get('keyspace_hits', 0)
            misses = info.get('keyspace_misses', 0)
            total = hits + misses
            
            if total > 0:
                hit_rate = hits / total
                cache_hit_rate.set(hit_rate)
        except Exception as e:
            logger.warning(f"Failed to update cache metrics: {str(e)}")
    
    async def _update_user_metrics(self):
        """Update user-related metrics"""
        try:
            # Get active users from Redis
            # This would be implemented based on your session management
            daily_active = self.redis_client.scard("active_users:daily")
            weekly_active = self.redis_client.scard("active_users:weekly")
            monthly_active = self.redis_client.scard("active_users:monthly")
            
            active_users.labels(period='daily').set(daily_active or 0)
            active_users.labels(period='weekly').set(weekly_active or 0)
            active_users.labels(period='monthly').set(monthly_active or 0)
            
        except Exception as e:
            logger.warning(f"Failed to update user metrics: {str(e)}")
    
    def register_metric(
        self,
        name: str,
        metric_type: MetricType,
        description: str,
        labels: Optional[List[str]] = None,
        buckets: Optional[List[float]] = None
    ):
        """Register a custom metric"""
        labels = labels or []
        
        if metric_type == MetricType.COUNTER:
            metric = Counter(name, description, labels, registry=self.registry)
        elif metric_type == MetricType.GAUGE:
            metric = Gauge(name, description, labels, registry=self.registry)
        elif metric_type == MetricType.HISTOGRAM:
            metric = Histogram(
                name, 
                description, 
                labels, 
                buckets=buckets or Histogram.DEFAULT_BUCKETS,
                registry=self.registry
            )
        elif metric_type == MetricType.SUMMARY:
            metric = Summary(name, description, labels, registry=self.registry)
        else:
            raise ValueError(f"Unknown metric type: {metric_type}")
        
        custom_metrics[name] = metric
        return metric
    
    def track_metric(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None,
        operation: str = "inc"
    ):
        """Track a custom metric value"""
        metric = custom_metrics.get(name)
        if not metric:
            logger.warning(f"Metric {name} not found")
            return
        
        labels = labels or {}
        
        try:
            if operation == "inc":
                if labels:
                    metric.labels(**labels).inc(value)
                else:
                    metric.inc(value)
            elif operation == "set":
                if labels:
                    metric.labels(**labels).set(value)
                else:
                    metric.set(value)
            elif operation == "observe":
                if labels:
                    metric.labels(**labels).observe(value)
                else:
                    metric.observe(value)
        except Exception as e:
            logger.error(f"Error tracking metric {name}: {str(e)}")
    
    def time_operation(self, metric_name: str, labels: Optional[Dict[str, str]] = None):
        """Decorator to time operations"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    duration = time.time() - start_time
                    
                    if metric_name in custom_metrics:
                        metric = custom_metrics[metric_name]
                        if labels:
                            metric.labels(**labels).observe(duration)
                        else:
                            metric.observe(duration)
                    
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    
                    if metric_name in custom_metrics:
                        metric = custom_metrics[metric_name]
                        error_labels = {**(labels or {}), 'status': 'error'}
                        metric.labels(**error_labels).observe(duration)
                    
                    raise
            
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    duration = time.time() - start_time
                    
                    if metric_name in custom_metrics:
                        metric = custom_metrics[metric_name]
                        if labels:
                            metric.labels(**labels).observe(duration)
                        else:
                            metric.observe(duration)
                    
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    
                    if metric_name in custom_metrics:
                        metric = custom_metrics[metric_name]
                        error_labels = {**(labels or {}), 'status': 'error'}
                        metric.labels(**error_labels).observe(duration)
                    
                    raise
            
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            else:
                return sync_wrapper
        
        return decorator
    
    async def export_metrics(self) -> bytes:
        """Export metrics in Prometheus format"""
        # Collect from all registries if using multiprocess mode
        if settings.PROMETHEUS_MULTIPROC_DIR:
            registry = CollectorRegistry()
            MultiProcessCollector(registry)
            return generate_latest(registry)
        else:
            return generate_latest(self.registry)
    
    def export_alert_rules(self) -> Dict[str, Any]:
        """Export alert rules for Prometheus configuration"""
        return {
            "groups": [
                {
                    "name": "openclip_alerts",
                    "interval": "30s",
                    "rules": [rule.to_prometheus_rule() for rule in self.alert_rules]
                }
            ]
        }
    
    async def push_metrics(self, job: str = "openclip"):
        """Push metrics to Prometheus Pushgateway"""
        if not settings.PROMETHEUS_PUSHGATEWAY_URL:
            return
        
        try:
            push_to_gateway(
                settings.PROMETHEUS_PUSHGATEWAY_URL,
                job=job,
                registry=self.registry
            )
        except Exception as e:
            logger.error(f"Failed to push metrics to Pushgateway: {str(e)}")
    
    def create_grafana_dashboard(self) -> Dict[str, Any]:
        """Create Grafana dashboard configuration"""
        return {
            "dashboard": {
                "title": "OpenClip Pro Monitoring",
                "tags": ["openclip", "production"],
                "timezone": "UTC",
                "panels": [
                    # Request rate panel
                    {
                        "id": 1,
                        "title": "Request Rate",
                        "type": "graph",
                        "targets": [
                            {
                                "expr": 'rate(http_requests_total[5m])',
                                "legendFormat": "{{method}} {{endpoint}}"
                            }
                        ],
                        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
                    },
                    
                    # Response time panel
                    {
                        "id": 2,
                        "title": "Response Time (95th percentile)",
                        "type": "graph",
                        "targets": [
                            {
                                "expr": 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
                                "legendFormat": "{{method}} {{endpoint}}"
                            }
                        ],
                        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
                    },
                    
                    # Error rate panel
                    {
                        "id": 3,
                        "title": "Error Rate",
                        "type": "graph",
                        "targets": [
                            {
                                "expr": 'rate(errors_total[5m])',
                                "legendFormat": "{{type}} {{severity}}"
                            }
                        ],
                        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
                    },
                    
                    # System resources panel
                    {
                        "id": 4,
                        "title": "System Resources",
                        "type": "graph",
                        "targets": [
                            {
                                "expr": 'avg(system_cpu_usage_percent)',
                                "legendFormat": "CPU %"
                            },
                            {
                                "expr": '(system_memory_usage_bytes{type="used"} / system_memory_usage_bytes{type="total"}) * 100',
                                "legendFormat": "Memory %"
                            }
                        ],
                        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
                    },
                    
                    # Video processing panel
                    {
                        "id": 5,
                        "title": "Video Processing",
                        "type": "graph",
                        "targets": [
                            {
                                "expr": 'rate(video_uploads_total[5m])',
                                "legendFormat": "Uploads {{source}}"
                            },
                            {
                                "expr": 'rate(clips_generated_total[5m])',
                                "legendFormat": "Clips {{clip_type}}"
                            }
                        ],
                        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16}
                    },
                    
                    # AI usage panel
                    {
                        "id": 6,
                        "title": "AI Provider Usage",
                        "type": "graph",
                        "targets": [
                            {
                                "expr": 'rate(ai_analysis_requests_total[5m])',
                                "legendFormat": "{{provider}} {{model}}"
                            }
                        ],
                        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16}
                    }
                ]
            }
        }
    
    async def cleanup(self):
        """Clean up monitoring resources"""
        if self._collection_task:
            self._collection_task.cancel()
            await asyncio.gather(self._collection_task, return_exceptions=True)

# Global monitoring instance
monitoring = MonitoringService()

# FastAPI middleware for HTTP metrics
async def monitoring_middleware(request: Request, call_next):
    """Middleware to track HTTP metrics"""
    start_time = time.time()
    
    # Track request size
    content_length = request.headers.get('content-length')
    if content_length:
        http_request_size_bytes.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(int(content_length))
    
    # Process request
    response = await call_next(request)
    
    # Track response metrics
    duration = time.time() - start_time
    
    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    # Track response size
    if 'content-length' in response.headers:
        http_response_size_bytes.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(int(response.headers['content-length']))
    
    return response

# Prometheus metrics endpoint
async def metrics_endpoint(request: Request) -> Response:
    """Endpoint to expose Prometheus metrics"""
    metrics_data = await monitoring.export_metrics()
    return Response(
        content=metrics_data,
        media_type=CONTENT_TYPE_LATEST,
        headers={"Content-Type": CONTENT_TYPE_LATEST}
    )

def setup_monitoring(app: FastAPI):
    """Set up monitoring for FastAPI app"""
    # Add middleware
    app.middleware("http")(monitoring_middleware)
    
    # Add metrics endpoint
    app.get("/metrics", include_in_schema=False)(metrics_endpoint)
    
    # Initialize monitoring on startup
    @app.on_event("startup")
    async def startup_monitoring():
        await monitoring.initialize()
    
    # Cleanup on shutdown
    @app.on_event("shutdown")
    async def shutdown_monitoring():
        await monitoring.cleanup()
