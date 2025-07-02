"""
Simplified monitoring middleware for OpenClip Pro
"""

import time
import json
import logging
from typing import Dict, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all HTTP requests"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Get request details
        method = request.method
        url = str(request.url)
        client_ip = self.get_client_ip(request)
        
        response = None
        exception = None
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            exception = e
            status_code = 500
            from fastapi.responses import JSONResponse
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log request
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "method": method,
            "url": url,
            "status_code": status_code,
            "duration_ms": round(duration * 1000, 2),
            "client_ip": client_ip,
        }
        
        if exception:
            log_data["exception"] = str(exception)
            logger.error("Request failed", extra=log_data)
        else:
            if status_code >= 400:
                logger.warning("Request completed with error", extra=log_data)
            else:
                logger.info("Request completed", extra=log_data)
        
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

class HealthCheckMiddleware(BaseHTTPMiddleware):
    """Provide health check endpoints"""
    
    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/health":
            return await self.health_check(request)
        
        return await call_next(request)
    
    async def health_check(self, request: Request) -> Response:
        """Simple health check"""
        return Response(
            content=json.dumps({
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat()
            }),
            status_code=200,
            media_type="application/json"
        )

def add_monitoring_middleware(app):
    """Add monitoring middleware to FastAPI app"""
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(HealthCheckMiddleware) 