"""
Monitoring and metrics middleware for OpenClip Pro
Collects performance metrics, logs requests, and provides health checks.
"""

import time
import json
import logging
import sys
from typing import Dict, Any, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
import os

try:
    from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
except ImportError:
    # Mock prometheus_client if not available
    class MockMetric:
        def labels(self, **kwargs): return self
        def inc(self): pass
        def observe(self, value): pass
        def set(self, value): pass
    
    Counter = lambda *args, **kwargs: MockMetric()
    Histogram = lambda *args, **kwargs: MockMetric()
    Gauge = lambda *args, **kwargs: MockMetric()
    generate_latest = lambda: "# No metrics available"
    CONTENT_TYPE_LATEST = "text/plain"

try:
    import structlog
    logger = structlog.get_logger()
except ImportError:
    logger = logging.getLogger(__name__)

try:
    import psutil
except ImportError:
    psutil = None

# Configure structured logging
logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=logging.INFO,
)

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

REQUEST_SIZE = Histogram(
    'http_request_size_bytes',
    'HTTP request size in bytes',
    ['method', 'endpoint']
)

RESPONSE_SIZE = Histogram(
    'http_response_size_bytes',
    'HTTP response size in bytes',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Gauge(
    'http_active_connections',
    'Number of active HTTP connections'
)

SYSTEM_CPU_USAGE = Gauge(
    'system_cpu_usage_percent',
    'System CPU usage percentage'
)

SYSTEM_MEMORY_USAGE = Gauge(
    'system_memory_usage_bytes',
    'System memory usage in bytes'
)

SYSTEM_DISK_USAGE = Gauge(
    'system_disk_usage_bytes',
    'System disk usage in bytes'
)

APPLICATION_INFO = Gauge(
    'application_info',
    'Application information',
    ['version', 'environment']
)

VIDEO_PROCESSING_TIME = Histogram(
    'video_processing_duration_seconds',
    'Video processing duration in seconds',
    ['operation']
)

AI_ANALYSIS_TIME = Histogram(
    'ai_analysis_duration_seconds',
    'AI analysis duration in seconds',
    ['provider', 'model']
)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all HTTP requests with structured logging"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Increment active connections
        ACTIVE_CONNECTIONS.inc()
        
        # Get request details
        method = request.method
        url = str(request.url)
        client_ip = self.get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # Get request size
        content_length = request.headers.get("content-length")
        request_size = int(content_length) if content_length else 0
        
        response = None
        exception = None
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            exception = e
            status_code = 500
            # Create error response
            from fastapi.responses import JSONResponse
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Decrement active connections
        ACTIVE_CONNECTIONS.dec()
        
        # Get response size
        response_size = 0
        if hasattr(response, 'body'):
            response_size = len(response.body)
        
        # Extract endpoint pattern
        endpoint = self.extract_endpoint(url)
        
        # Update Prometheus metrics
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status_code=status_code
        ).inc()
        
        REQUEST_DURATION.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
        
        if request_size > 0:
            REQUEST_SIZE.labels(
                method=method,
                endpoint=endpoint
            ).observe(request_size)
        
        if response_size > 0:
            RESPONSE_SIZE.labels(
                method=method,
                endpoint=endpoint
            ).observe(response_size)
        
        # Structured logging
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "method": method,
            "url": url,
            "endpoint": endpoint,
            "status_code": status_code,
            "duration_ms": round(duration * 1000, 2),
            "request_size": request_size,
            "response_size": response_size,
            "client_ip": client_ip,
            "user_agent": user_agent,
        }
        
        if exception:
            log_data["exception"] = str(exception)
            logger.error("Request failed", **log_data)
        else:
            if status_code >= 400:
                logger.warning("Request completed with error", **log_data)
            else:
                logger.info("Request completed", **log_data)
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def extract_endpoint(self, url: str) -> str:
        """Extract endpoint pattern from URL for metrics"""
        from urllib.parse import urlparse
        
        path = urlparse(url).path
        
        # Replace UUIDs and IDs with placeholders
        import re
        
        # UUID pattern
        path = re.sub(
            r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '/{id}',
            path,
            flags=re.IGNORECASE
        )
        
        # Numeric IDs
        path = re.sub(r'/\d+', '/{id}', path)
        
        return path

class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Monitor system performance and update metrics"""
    
    def __init__(self, app):
        super().__init__(app)
        self.last_update = 0
        self.update_interval = 10  # Update every 10 seconds
    
    async def dispatch(self, request: Request, call_next):
        # Update system metrics periodically
        current_time = time.time()
        if current_time - self.last_update > self.update_interval:
            self.update_system_metrics()
            self.last_update = current_time
        
        return await call_next(request)
    
    def update_system_metrics(self):
        """Update system performance metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=None)
            SYSTEM_CPU_USAGE.set(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            SYSTEM_MEMORY_USAGE.set(memory.used)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            SYSTEM_DISK_USAGE.set(disk.used)
            
        except Exception as e:
            logger.error("Failed to update system metrics", error=str(e))

class HealthCheckMiddleware(BaseHTTPMiddleware):
    """Provide health check endpoints"""
    
    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/health":
            return await self.health_check(request)
        elif request.url.path == "/health/ready":
            return await self.readiness_check(request)
        elif request.url.path == "/health/live":
            return await self.liveness_check(request)
        elif request.url.path == "/metrics":
            return await self.metrics_endpoint(request)
        
        return await call_next(request)
    
    async def health_check(self, request: Request) -> Response:
        """Simple health check"""
        return Response(
            content="OK",
            status_code=200,
            media_type="text/plain"
        )
    
    async def readiness_check(self, request: Request) -> Response:
        """Readiness check - check if app is ready to serve traffic"""
        checks = {}
        overall_status = "healthy"
        
        # Check database connection
        try:
            # This would be implemented based on your database setup
            checks["database"] = {"status": "healthy"}
        except Exception as e:
            checks["database"] = {"status": "unhealthy", "error": str(e)}
            overall_status = "unhealthy"
        
                 # Check Redis connection
         try:
             import redis
             from ..config import settings
             redis_client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT)
             redis_client.ping()
             checks["redis"] = {"status": "healthy"}
         except Exception as e:
             checks["redis"] = {"status": "unhealthy", "error": str(e)}
            overall_status = "unhealthy"
        
        # Check disk space
        try:
            disk = psutil.disk_usage('/')
            free_percent = (disk.free / disk.total) * 100
            if free_percent < 10:
                checks["disk"] = {"status": "warning", "free_percent": free_percent}
                overall_status = "warning" if overall_status == "healthy" else overall_status
            else:
                checks["disk"] = {"status": "healthy", "free_percent": free_percent}
        except Exception as e:
            checks["disk"] = {"status": "unhealthy", "error": str(e)}
            overall_status = "unhealthy"
        
        status_code = 200 if overall_status == "healthy" else 503
        
        return Response(
            content=json.dumps({
                "status": overall_status,
                "timestamp": datetime.utcnow().isoformat(),
                "checks": checks
            }),
            status_code=status_code,
            media_type="application/json"
        )
    
    async def liveness_check(self, request: Request) -> Response:
        """Liveness check - check if app is alive"""
                 start_time = getattr(self, 'start_time', time.time())
         uptime = time.time() - start_time if start_time else 0
         
         return Response(
             content=json.dumps({
                 "status": "alive",
                 "timestamp": datetime.utcnow().isoformat(),
                 "uptime": uptime
             }),
             status_code=200,
             media_type="application/json"
         )
    
    async def metrics_endpoint(self, request: Request) -> Response:
        """Prometheus metrics endpoint"""
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )

# Utility functions for custom metrics
def track_video_processing_time(operation: str):
    """Context manager to track video processing time"""
    class VideoProcessingTimer:
        def __init__(self, operation: str):
            self.operation = operation
            self.start_time = None
        
        def __enter__(self):
            self.start_time = time.time()
            return self
        
        def __exit__(self, exc_type, exc_val, exc_tb):
            duration = time.time() - self.start_time
            VIDEO_PROCESSING_TIME.labels(operation=self.operation).observe(duration)
    
    return VideoProcessingTimer(operation)

def track_ai_analysis_time(provider: str, model: str):
    """Context manager to track AI analysis time"""
    class AIAnalysisTimer:
        def __init__(self, provider: str, model: str):
            self.provider = provider
            self.model = model
            self.start_time = None
        
        def __enter__(self):
            self.start_time = time.time()
            return self
        
        def __exit__(self, exc_type, exc_val, exc_tb):
            duration = time.time() - self.start_time
            AI_ANALYSIS_TIME.labels(
                provider=self.provider,
                model=self.model
            ).observe(duration)
    
    return AIAnalysisTimer(provider, model)

# Initialize application info metric
def initialize_metrics(version: str, environment: str):
    """Initialize application metrics"""
    APPLICATION_INFO.labels(version=version, environment=environment).set(1) 