"""
Advanced API Rate Limiting Middleware
Implements tiered rate limiting with user-based quotas and intelligent throttling
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import time
import asyncio
from typing import Dict, Optional, Callable, Any
from datetime import datetime, timedelta
import json
import hashlib
from functools import wraps

from ..utils.rate_limiter import RateLimiter, RateLimitConfig, RateLimitStrategy
from ..services.monitoring_service import http_requests_total, errors_total
from ..models.user import UserRole
from ..config import settings

# Initialize rate limiter
rate_limiter = RateLimiter()

# Define rate limit tiers
RATE_LIMIT_TIERS = {
    UserRole.TRIAL: {
        "requests_per_minute": 20,
        "requests_per_hour": 500,
        "requests_per_day": 5000,
        "burst_size": 10,
        "video_uploads_per_day": 5,
        "ai_analyses_per_day": 10,
        "storage_gb": 5
    },
    UserRole.STANDARD: {
        "requests_per_minute": 60,
        "requests_per_hour": 2000,
        "requests_per_day": 20000,
        "burst_size": 30,
        "video_uploads_per_day": 20,
        "ai_analyses_per_day": 50,
        "storage_gb": 50
    },
    UserRole.PRO: {
        "requests_per_minute": 200,
        "requests_per_hour": 10000,
        "requests_per_day": 100000,
        "burst_size": 100,
        "video_uploads_per_day": 100,
        "ai_analyses_per_day": 500,
        "storage_gb": 500
    },
    UserRole.ADMIN: {
        "requests_per_minute": 1000,
        "requests_per_hour": 50000,
        "requests_per_day": 500000,
        "burst_size": 500,
        "video_uploads_per_day": -1,  # Unlimited
        "ai_analyses_per_day": -1,  # Unlimited
        "storage_gb": -1  # Unlimited
    }
}

# Endpoint-specific rate limits
ENDPOINT_LIMITS = {
    "/api/v1/upload": {
        "requests_per_minute": 2,
        "requests_per_hour": 20,
        "strategy": RateLimitStrategy.TOKEN_BUCKET
    },
    "/api/v1/analyze": {
        "requests_per_minute": 5,
        "requests_per_hour": 30,
        "strategy": RateLimitStrategy.SLIDING_WINDOW
    },
    "/auth/login": {
        "requests_per_minute": 5,
        "requests_per_hour": 20,
        "strategy": RateLimitStrategy.FIXED_WINDOW
    },
    "/auth/register": {
        "requests_per_minute": 2,
        "requests_per_hour": 5,
        "strategy": RateLimitStrategy.FIXED_WINDOW
    }
}

class RateLimitMiddleware:
    """
    Advanced rate limiting middleware with multiple strategies
    Supports user-based quotas, endpoint limits, and intelligent throttling
    """
    
    def __init__(self, app):
        self.app = app
        self.rate_limiter = rate_limiter
        self._setup_custom_limits()
    
    def _setup_custom_limits(self):
        """Set up custom rate limit configurations"""
        # Configure endpoint-specific limits
        for endpoint, config in ENDPOINT_LIMITS.items():
            self.rate_limiter.set_custom_limit(
                endpoint,
                RateLimitConfig(
                    requests_per_window=config["requests_per_minute"],
                    window_seconds=60,
                    burst_size=config.get("burst_size", 5),
                    strategy=config["strategy"]
                )
            )
    
    async def __call__(self, request: Request, call_next):
        """Process request with rate limiting"""
        # Skip rate limiting for health checks and metrics
        if request.url.path in ["/health", "/metrics", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Get client identifier
        client_id = self._get_client_identifier(request)
        
        # Get user if authenticated
        user = getattr(request.state, "user", None)
        
        # Apply rate limiting
        try:
            # Check global rate limit
            allowed, metadata = await self._check_global_limit(client_id, user)
            
            if not allowed:
                return self._create_rate_limit_response(metadata)
            
            # Check endpoint-specific rate limit
            endpoint_allowed, endpoint_metadata = await self._check_endpoint_limit(
                client_id, 
                request.url.path,
                user
            )
            
            if not endpoint_allowed:
                return self._create_rate_limit_response(endpoint_metadata)
            
            # Check resource-specific limits (uploads, analyses, etc.)
            resource_allowed, resource_metadata = await self._check_resource_limits(
                request,
                user
            )
            
            if not resource_allowed:
                return self._create_rate_limit_response(resource_metadata, status_code=429)
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(metadata.get("limit", 0))
            response.headers["X-RateLimit-Remaining"] = str(metadata.get("remaining", 0))
            response.headers["X-RateLimit-Reset"] = str(metadata.get("reset", 0))
            
            # Add endpoint-specific headers if different
            if endpoint_metadata and endpoint_metadata["limit"] != metadata["limit"]:
                response.headers["X-RateLimit-Endpoint-Limit"] = str(endpoint_metadata["limit"])
                response.headers["X-RateLimit-Endpoint-Remaining"] = str(endpoint_metadata["remaining"])
            
            return response
            
        except Exception as e:
            # Log error but don't block request
            errors_total.labels(
                type='rate_limiting',
                severity='warning',
                component='middleware'
            ).inc()
            
            # Continue processing even if rate limiting fails
            return await call_next(request)
    
    def _get_client_identifier(self, request: Request) -> str:
        """Get unique client identifier"""
        # Priority: User ID > API Key > IP Address
        user = getattr(request.state, "user", None)
        
        if user:
            return f"user:{user.id}"
        
        # Check for API key
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            # Hash token for privacy
            return f"token:{hashlib.sha256(token.encode()).hexdigest()[:16]}"
        
        # Fall back to IP address
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Get first IP in chain
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host
        
        return f"ip:{client_ip}"
    
    async def _check_global_limit(
        self,
        client_id: str,
        user: Optional[Any]
    ) -> tuple[bool, Dict[str, Any]]:
        """Check global rate limit based on user tier"""
        # Get tier limits
        if user:
            tier_limits = RATE_LIMIT_TIERS.get(
                UserRole(user.role),
                RATE_LIMIT_TIERS[UserRole.TRIAL]
            )
        else:
            # Anonymous users get trial tier limits
            tier_limits = RATE_LIMIT_TIERS[UserRole.TRIAL]
        
        # Check minute limit
        allowed, metadata = self.rate_limiter.check_rate_limit(
            client_id,
            "global_minute",
            limit=tier_limits["requests_per_minute"],
            window=60,
            strategy=RateLimitStrategy.SLIDING_WINDOW
        )
        
        if not allowed:
            return False, metadata
        
        # Check hour limit
        allowed, metadata = self.rate_limiter.check_rate_limit(
            client_id,
            "global_hour",
            limit=tier_limits["requests_per_hour"],
            window=3600,
            strategy=RateLimitStrategy.SLIDING_WINDOW
        )
        
        if not allowed:
            return False, metadata
        
        # Check day limit
        allowed, metadata = self.rate_limiter.check_rate_limit(
            client_id,
            "global_day",
            limit=tier_limits["requests_per_day"],
            window=86400,
            strategy=RateLimitStrategy.SLIDING_WINDOW
        )
        
        return allowed, metadata
    
    async def _check_endpoint_limit(
        self,
        client_id: str,
        path: str,
        user: Optional[Any]
    ) -> tuple[bool, Dict[str, Any]]:
        """Check endpoint-specific rate limit"""
        # Find matching endpoint configuration
        endpoint_config = None
        for endpoint_pattern, config in ENDPOINT_LIMITS.items():
            if path.startswith(endpoint_pattern):
                endpoint_config = config
                break
        
        if not endpoint_config:
            # No specific limit for this endpoint
            return True, {}
        
        # Apply endpoint limit
        allowed, metadata = self.rate_limiter.check_rate_limit(
            client_id,
            f"endpoint:{path}",
            limit=endpoint_config["requests_per_minute"],
            window=60,
            strategy=endpoint_config.get("strategy", RateLimitStrategy.SLIDING_WINDOW)
        )
        
        return allowed, metadata
    
    async def _check_resource_limits(
        self,
        request: Request,
        user: Optional[Any]
    ) -> tuple[bool, Dict[str, Any]]:
        """Check resource-specific limits (uploads, analyses, etc.)"""
        if not user:
            return True, {}
        
        path = request.url.path
        tier_limits = RATE_LIMIT_TIERS.get(
            UserRole(user.role),
            RATE_LIMIT_TIERS[UserRole.TRIAL]
        )
        
        # Check video upload limits
        if path.startswith("/api/v1/upload"):
            daily_limit = tier_limits["video_uploads_per_day"]
            if daily_limit == -1:  # Unlimited
                return True, {}
            
            allowed, metadata = self.rate_limiter.check_rate_limit(
                f"user:{user.id}",
                "video_uploads_daily",
                limit=daily_limit,
                window=86400,
                strategy=RateLimitStrategy.FIXED_WINDOW
            )
            
            if not allowed:
                metadata["resource_type"] = "video_uploads"
                metadata["limit_type"] = "daily"
                return False, metadata
        
        # Check AI analysis limits
        elif path.startswith("/api/v1/analyze"):
            daily_limit = tier_limits["ai_analyses_per_day"]
            if daily_limit == -1:  # Unlimited
                return True, {}
            
            allowed, metadata = self.rate_limiter.check_rate_limit(
                f"user:{user.id}",
                "ai_analyses_daily",
                limit=daily_limit,
                window=86400,
                strategy=RateLimitStrategy.FIXED_WINDOW
            )
            
            if not allowed:
                metadata["resource_type"] = "ai_analyses"
                metadata["limit_type"] = "daily"
                return False, metadata
        
        return True, {}
    
    def _create_rate_limit_response(
        self,
        metadata: Dict[str, Any],
        status_code: int = 429
    ) -> JSONResponse:
        """Create rate limit exceeded response"""
        # Track rate limit hit
        http_requests_total.labels(
            method="ANY",
            endpoint="rate_limited",
            status=status_code
        ).inc()
        
        # Prepare error response
        retry_after = metadata.get("retry_after", 60)
        
        response_data = {
            "error": "rate_limit_exceeded",
            "message": self._get_rate_limit_message(metadata),
            "retry_after": retry_after,
            "limit": metadata.get("limit", 0),
            "remaining": metadata.get("remaining", 0),
            "reset": metadata.get("reset", 0)
        }
        
        # Add resource-specific information
        if "resource_type" in metadata:
            response_data["resource_type"] = metadata["resource_type"]
            response_data["limit_type"] = metadata.get("limit_type", "unknown")
        
        return JSONResponse(
            status_code=status_code,
            content=response_data,
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(metadata.get("limit", 0)),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(metadata.get("reset", 0))
            }
        )
    
    def _get_rate_limit_message(self, metadata: Dict[str, Any]) -> str:
        """Generate user-friendly rate limit message"""
        if "resource_type" in metadata:
            resource = metadata["resource_type"].replace("_", " ")
            limit_type = metadata.get("limit_type", "").replace("_", " ")
            return f"You have exceeded your {limit_type} {resource} limit. Please upgrade your plan for higher limits."
        
        retry_after = metadata.get("retry_after", 60)
        
        if retry_after < 60:
            return f"Too many requests. Please try again in {retry_after} seconds."
        elif retry_after < 3600:
            minutes = retry_after // 60
            return f"Too many requests. Please try again in {minutes} minutes."
        else:
            hours = retry_after // 3600
            return f"Too many requests. Please try again in {hours} hours."

def rate_limit(
    requests_per_minute: int = 60,
    requests_per_hour: Optional[int] = None,
    strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW,
    key_func: Optional[Callable] = None
):
    """
    Decorator for custom rate limiting on specific endpoints
    
    Usage:
        @router.get("/api/heavy-endpoint")
        @rate_limit(requests_per_minute=10, strategy=RateLimitStrategy.TOKEN_BUCKET)
        async def heavy_endpoint():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(request: Request, *args, **kwargs):
            # Get client identifier
            if key_func:
                client_id = key_func(request)
            else:
                client_id = request.client.host
            
            # Check rate limit
            allowed, metadata = rate_limiter.check_rate_limit(
                client_id,
                f"custom:{func.__name__}",
                limit=requests_per_minute,
                window=60,
                strategy=strategy
            )
            
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "rate_limit_exceeded",
                        "retry_after": metadata.get("retry_after", 60),
                        "limit": metadata.get("limit", 0),
                        "remaining": 0
                    },
                    headers={
                        "Retry-After": str(metadata.get("retry_after", 60))
                    }
                )
            
            # Check hourly limit if specified
            if requests_per_hour:
                allowed, metadata = rate_limiter.check_rate_limit(
                    client_id,
                    f"custom_hour:{func.__name__}",
                    limit=requests_per_hour,
                    window=3600,
                    strategy=strategy
                )
                
                if not allowed:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail={
                            "error": "hourly_rate_limit_exceeded",
                            "retry_after": metadata.get("retry_after", 3600),
                            "limit": metadata.get("limit", 0),
                            "remaining": 0
                        }
                    )
            
            # Execute function
            return await func(request, *args, **kwargs)
        
        return async_wrapper
    
    return decorator

# Export for use in FastAPI app
def setup_rate_limiting(app):
    """Set up rate limiting middleware"""
    app.add_middleware(RateLimitMiddleware)
