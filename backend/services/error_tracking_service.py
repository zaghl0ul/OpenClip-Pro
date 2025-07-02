"""
Comprehensive Error Tracking and Monitoring Service
Integrates with Sentry for production error tracking and performance monitoring
"""

import os
import sys
import logging
import traceback
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timezone
from functools import wraps
import asyncio
from contextlib import contextmanager

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.aiohttp import AioHttpIntegration
from sentry_sdk import capture_exception, capture_message, configure_scope, push_scope
from sentry_sdk.utils import event_from_exception
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

from ..config import settings
from ..services.monitoring_service import errors_total

logger = logging.getLogger(__name__)

class ErrorSeverity:
    """Error severity levels"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    FATAL = "fatal"

class ErrorCategory:
    """Error categories for better organization"""
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    VALIDATION = "validation"
    DATABASE = "database"
    EXTERNAL_SERVICE = "external_service"
    FILE_PROCESSING = "file_processing"
    AI_ANALYSIS = "ai_analysis"
    PAYMENT = "payment"
    SYSTEM = "system"
    UNKNOWN = "unknown"

class ErrorTrackingService:
    """
    Advanced error tracking service with Sentry integration
    Provides comprehensive error monitoring, alerting, and analysis
    """
    
    def __init__(self):
        self.enabled = bool(settings.SENTRY_DSN)
        self.environment = settings.ENVIRONMENT
        self.release = settings.APP_VERSION
        self.sample_rate = settings.SENTRY_TRACES_SAMPLE_RATE or 0.1
        self.profiles_sample_rate = settings.SENTRY_PROFILES_SAMPLE_RATE or 0.1
        
        # Error statistics
        self.error_stats = {
            "total_errors": 0,
            "errors_by_category": {},
            "errors_by_severity": {},
            "recent_errors": []
        }
        
        # Initialize Sentry if DSN is provided
        if self.enabled:
            self._initialize_sentry()
            logger.info("Sentry error tracking initialized")
        else:
            logger.warning("Sentry DSN not configured - error tracking disabled")
    
    def _initialize_sentry(self):
        """Initialize Sentry with advanced configuration"""
        
        # Custom before_send hook
        def before_send(event, hint):
            # Filter out sensitive data
            event = self._sanitize_event(event)
            
            # Skip certain errors
            if self._should_skip_error(event, hint):
                return None
            
            # Add custom context
            event = self._add_custom_context(event)
            
            return event
        
        # Custom before_send_transaction hook
        def before_send_transaction(event, hint):
            # Sample transactions based on performance
            if event.get("transaction", "").startswith("/health"):
                return None  # Skip health checks
            
            return event
        
        # Initialize Sentry
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=self.environment,
            release=self.release,
            traces_sample_rate=self.sample_rate,
            profiles_sample_rate=self.profiles_sample_rate,
            attach_stacktrace=True,
            send_default_pii=False,  # Don't send PII by default
            before_send=before_send,
            before_send_transaction=before_send_transaction,
            integrations=[
                FastApiIntegration(
                    transaction_style="endpoint",
                    failed_request_status_codes={400, 401, 403, 404, 429, 500, 502, 503, 504}
                ),
                SqlalchemyIntegration(),
                RedisIntegration(),
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.ERROR
                ),
                AioHttpIntegration()
            ],
            # Performance monitoring
            traces_sampler=self._traces_sampler,
            # Additional options
            max_breadcrumbs=100,
            shutdown_timeout=5,
            in_app_include=["app", "backend"],
            in_app_exclude=["tests", "venv", "node_modules"],
            # Error filtering
            ignore_errors=[
                KeyboardInterrupt,
                SystemExit,
                HTTPException,  # Handle these separately
            ],
            # Tags
            tags={
                "service": "openclip-backend",
                "version": self.release,
                "deployment": settings.DEPLOYMENT_ID or "unknown"
            }
        )
    
    def _traces_sampler(self, sampling_context: Dict[str, Any]) -> float:
        """Dynamic sampling based on transaction type"""
        transaction_name = sampling_context.get("transaction_context", {}).get("name", "")
        
        # Always sample critical endpoints
        if any(endpoint in transaction_name for endpoint in ["/payment", "/auth", "/upload"]):
            return 1.0
        
        # Lower sampling for high-frequency endpoints
        if any(endpoint in transaction_name for endpoint in ["/health", "/metrics"]):
            return 0.01
        
        # Default sampling rate
        return self.sample_rate
    
    def _sanitize_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive data from event"""
        # List of sensitive keys to redact
        sensitive_keys = [
            "password", "token", "secret", "api_key", "credit_card",
            "ssn", "social_security", "bank_account", "private_key"
        ]
        
        def sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
            """Recursively sanitize dictionary"""
            sanitized = {}
            for key, value in data.items():
                if any(sensitive in key.lower() for sensitive in sensitive_keys):
                    sanitized[key] = "[REDACTED]"
                elif isinstance(value, dict):
                    sanitized[key] = sanitize_dict(value)
                elif isinstance(value, list):
                    sanitized[key] = [
                        sanitize_dict(item) if isinstance(item, dict) else item
                        for item in value
                    ]
                else:
                    sanitized[key] = value
            return sanitized
        
        # Sanitize request data
        if "request" in event:
            if "data" in event["request"]:
                event["request"]["data"] = sanitize_dict(event["request"]["data"])
            if "headers" in event["request"]:
                # Redact authorization headers
                headers = event["request"]["headers"]
                if "Authorization" in headers:
                    headers["Authorization"] = "[REDACTED]"
        
        # Sanitize extra context
        if "extra" in event:
            event["extra"] = sanitize_dict(event["extra"])
        
        return event
    
    def _should_skip_error(self, event: Dict[str, Any], hint: Dict[str, Any]) -> bool:
        """Determine if error should be skipped"""
        # Skip client errors that are expected
        if "exc_info" in hint:
            exc_type, exc_value, _ = hint["exc_info"]
            
            # Skip expected HTTP exceptions
            if isinstance(exc_value, HTTPException) and exc_value.status_code < 500:
                return True
            
            # Skip rate limit errors
            if hasattr(exc_value, "status_code") and exc_value.status_code == 429:
                return True
        
        # Skip errors from bots/scanners
        if "request" in event:
            user_agent = event["request"].get("headers", {}).get("User-Agent", "")
            bot_patterns = ["bot", "crawler", "spider", "scraper", "scan"]
            if any(pattern in user_agent.lower() for pattern in bot_patterns):
                return True
        
        return False
    
    def _add_custom_context(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Add custom context to event"""
        # Add deployment information
        event["tags"]["deployment_id"] = settings.DEPLOYMENT_ID or "unknown"
        event["tags"]["cluster"] = settings.CLUSTER_NAME or "default"
        
        # Add performance context
        event["contexts"]["performance"] = {
            "memory_usage_mb": self._get_memory_usage(),
            "cpu_count": os.cpu_count(),
            "python_version": sys.version
        }
        
        return event
    
    def capture_error(
        self,
        error: Exception,
        category: str = ErrorCategory.UNKNOWN,
        severity: str = ErrorSeverity.ERROR,
        context: Optional[Dict[str, Any]] = None,
        user: Optional[Any] = None,
        request: Optional[Request] = None,
        fingerprint: Optional[List[str]] = None
    ):
        """
        Capture and track an error with rich context
        
        Args:
            error: The exception to capture
            category: Error category for grouping
            severity: Error severity level
            context: Additional context data
            user: User object if available
            request: FastAPI request object
            fingerprint: Custom fingerprint for grouping
        """
        # Update statistics
        self._update_error_stats(category, severity)
        
        # Track in Prometheus
        errors_total.labels(
            type=category,
            severity=severity,
            component=context.get("component", "unknown") if context else "unknown"
        ).inc()
        
        # Skip if Sentry is not enabled
        if not self.enabled:
            logger.error(f"[{category}] {str(error)}", exc_info=True)
            return
        
        # Capture with Sentry
        with push_scope() as scope:
            # Set level
            scope.level = severity
            
            # Set category tag
            scope.set_tag("error.category", category)
            
            # Set user context
            if user:
                scope.set_user({
                    "id": str(user.id),
                    "email": user.email,
                    "username": getattr(user, "username", None),
                    "role": getattr(user, "role", None)
                })
            
            # Set request context
            if request:
                scope.set_context("request_details", {
                    "method": request.method,
                    "url": str(request.url),
                    "client_ip": request.client.host,
                    "user_agent": request.headers.get("User-Agent", "")
                })
            
            # Set additional context
            if context:
                for key, value in context.items():
                    scope.set_context(key, value)
            
            # Set fingerprint for grouping
            if fingerprint:
                scope.fingerprint = fingerprint
            else:
                # Auto-generate fingerprint based on error type and category
                scope.fingerprint = [
                    "{{ default }}",
                    category,
                    type(error).__name__
                ]
            
            # Capture the exception
            event_id = capture_exception(error)
            
            logger.error(
                f"Error captured - Category: {category}, "
                f"Severity: {severity}, Event ID: {event_id}"
            )
            
            return event_id
    
    def capture_message_event(
        self,
        message: str,
        severity: str = ErrorSeverity.INFO,
        category: str = ErrorCategory.UNKNOWN,
        context: Optional[Dict[str, Any]] = None,
        user: Optional[Any] = None
    ):
        """Capture a message event (non-exception)"""
        if not self.enabled:
            logger.log(
                logging.getLevelName(severity.upper()),
                f"[{category}] {message}"
            )
            return
        
        with push_scope() as scope:
            scope.level = severity
            scope.set_tag("message.category", category)
            
            if user:
                scope.set_user({
                    "id": str(user.id),
                    "email": user.email
                })
            
            if context:
                for key, value in context.items():
                    scope.set_context(key, value)
            
            return capture_message(message, level=severity)
    
    @contextmanager
    def error_context(
        self,
        operation: str,
        category: str = ErrorCategory.UNKNOWN,
        context: Optional[Dict[str, Any]] = None
    ):
        """Context manager for error tracking"""
        start_time = datetime.now(timezone.utc)
        
        try:
            with push_scope() as scope:
                scope.set_tag("operation", operation)
                scope.set_tag("category", category)
                
                if context:
                    for key, value in context.items():
                        scope.set_context(key, value)
                
                yield
                
        except Exception as e:
            # Calculate duration
            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            
            # Capture with additional context
            self.capture_error(
                e,
                category=category,
                context={
                    "operation": operation,
                    "duration_seconds": duration,
                    **(context or {})
                }
            )
            raise
    
    def track_performance(
        self,
        transaction_name: str,
        operation: str,
        tags: Optional[Dict[str, str]] = None
    ):
        """Decorator for performance tracking"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                if not self.enabled:
                    return await func(*args, **kwargs)
                
                with sentry_sdk.start_transaction(
                    name=transaction_name,
                    op=operation
                ) as transaction:
                    if tags:
                        for key, value in tags.items():
                            transaction.set_tag(key, value)
                    
                    try:
                        result = await func(*args, **kwargs)
                        transaction.set_status("ok")
                        return result
                    except Exception as e:
                        transaction.set_status("internal_error")
                        raise
            
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                if not self.enabled:
                    return func(*args, **kwargs)
                
                with sentry_sdk.start_transaction(
                    name=transaction_name,
                    op=operation
                ) as transaction:
                    if tags:
                        for key, value in tags.items():
                            transaction.set_tag(key, value)
                    
                    try:
                        result = func(*args, **kwargs)
                        transaction.set_status("ok")
                        return result
                    except Exception as e:
                        transaction.set_status("internal_error")
                        raise
            
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            else:
                return sync_wrapper
        
        return decorator
    
    def _update_error_stats(self, category: str, severity: str):
        """Update internal error statistics"""
        self.error_stats["total_errors"] += 1
        
        # Update by category
        if category not in self.error_stats["errors_by_category"]:
            self.error_stats["errors_by_category"][category] = 0
        self.error_stats["errors_by_category"][category] += 1
        
        # Update by severity
        if severity not in self.error_stats["errors_by_severity"]:
            self.error_stats["errors_by_severity"][severity] = 0
        self.error_stats["errors_by_severity"][severity] += 1
        
        # Keep recent errors (last 100)
        self.error_stats["recent_errors"].append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "category": category,
            "severity": severity
        })
        
        if len(self.error_stats["recent_errors"]) > 100:
            self.error_stats["recent_errors"] = self.error_stats["recent_errors"][-100:]
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        try:
            import psutil
            process = psutil.Process(os.getpid())
            return process.memory_info().rss / 1024 / 1024
        except:
            return 0.0
    
    def get_error_stats(self) -> Dict[str, Any]:
        """Get error statistics"""
        return {
            **self.error_stats,
            "sentry_enabled": self.enabled,
            "environment": self.environment,
            "release": self.release
        }
    
    def create_error_response(
        self,
        request: Request,
        error: Exception,
        status_code: int = 500
    ) -> JSONResponse:
        """Create standardized error response"""
        # Capture error if it's a server error
        error_id = None
        if status_code >= 500:
            error_id = self.capture_error(
                error,
                request=request,
                category=ErrorCategory.SYSTEM
            )
        
        # Prepare error response
        error_response = {
            "error": {
                "type": type(error).__name__,
                "message": str(error) if settings.DEBUG else "An error occurred",
                "status_code": status_code
            }
        }
        
        # Add error ID for tracking
        if error_id:
            error_response["error"]["id"] = error_id
            error_response["error"]["tracking_id"] = error_id
        
        # Add debug information in development
        if settings.DEBUG:
            error_response["error"]["traceback"] = traceback.format_exc()
        
        return JSONResponse(
            status_code=status_code,
            content=error_response
        )

# Global error tracking instance
error_tracker = ErrorTrackingService()

# FastAPI exception handler
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for FastAPI"""
    # Determine status code
    status_code = getattr(exc, "status_code", 500)
    
    # Skip client errors
    if isinstance(exc, HTTPException) and exc.status_code < 500:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    
    # Track server errors
    return error_tracker.create_error_response(request, exc, status_code)

def setup_error_tracking(app):
    """Set up error tracking for FastAPI app"""
    # Add exception handler
    app.add_exception_handler(Exception, global_exception_handler)
    
    # Add middleware for request tracking
    @app.middleware("http")
    async def error_tracking_middleware(request: Request, call_next):
        # Add request ID for tracking
        request_id = request.headers.get("X-Request-ID", "")
        
        with configure_scope() as scope:
            scope.set_tag("request_id", request_id)
        
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            # Let the exception handler deal with it
            raise
