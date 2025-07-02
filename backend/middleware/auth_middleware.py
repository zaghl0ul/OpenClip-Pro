"""
FastAPI Authentication Middleware with Advanced Security Features
Implements request authentication, rate limiting, and security headers
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List, Annotated
import time
from datetime import datetime, timezone
from jose import JWTError
import logging

from ..auth.jwt_handler import JWTHandler, TokenBlacklist
from ..models.user import User
from ..config import get_db
from ..utils.rate_limiter import RateLimiter

# Configure logging
logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)

# Rate limiter instance
rate_limiter = RateLimiter()

class PermissionChecker:
    """Check user permissions for specific resources"""
    
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions
    
    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        """Verify user has required permissions"""
        user_permissions = set(current_user.permissions)
        required = set(self.required_permissions)
        
        if not required.issubset(user_permissions):
            missing = required - user_permissions
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permissions: {', '.join(missing)}"
            )
        
        return current_user

class RoleChecker:
    """Check user roles for access control"""
    
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        """Verify user has allowed role"""
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' not authorized for this resource"
            )
        
        return current_user

async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    if not credentials:
        return None
    
    try:
        # Extract token
        token = credentials.credentials
        
        # Check if token is blacklisted
        if TokenBlacklist.is_blacklisted(token):
            return None
        
        # Decode token
        payload = JWTHandler.decode_token(token, token_type="access")
        
        # Get user from database
        user_id = payload.get("user_id")
        if not user_id:
            return None
        
        user = db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()
        
        if not user:
            return None
        
        # Update last activity
        user.last_activity = datetime.now(timezone.utc)
        db.commit()
        
        # Store user in request state for logging
        request.state.user = user
        
        return user
        
    except JWTError:
        return None
    except Exception as e:
        logger.error(f"Error in get_current_user_optional: {str(e)}")
        return None

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user or raise exception"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Rate limiting check
    client_id = request.client.host
    if not rate_limiter.check_rate_limit(client_id, "auth", limit=100, window=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts"
        )
    
    try:
        # Extract and validate token
        token = credentials.credentials
        
        # Check blacklist
        if TokenBlacklist.is_blacklisted(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Decode token
        payload = JWTHandler.decode_token(token, token_type="access")
        
        # Get user from database
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is banned
        if user.is_banned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is banned"
            )
        
        # Check if email is verified (if required)
        if not user.email_verified and request.app.state.settings.require_email_verification:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email verification required"
            )
        
        # Update last activity
        user.last_activity = datetime.now(timezone.utc)
        db.commit()
        
        # Store user in request state
        request.state.user = user
        
        return user
        
    except HTTPException:
        raise
    except JWTError as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )

async def get_current_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """Verify current user is a superuser"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser access required"
        )
    
    return current_user

async def verify_api_key(
    request: Request,
    api_key: str = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Verify API key for programmatic access"""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    # Rate limiting for API key usage
    if not rate_limiter.check_rate_limit(api_key, "api", limit=1000, window=3600):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="API rate limit exceeded"
        )
    
    from ..auth.jwt_handler import validate_api_key
    
    key_data = validate_api_key(api_key.credentials)
    if not key_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    user = db.query(User).filter(
        User.id == key_data["user_id"],
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key associated with inactive user"
        )
    
    # Log API key usage
    logger.info(f"API key '{key_data.get('key_name')}' used by user {user.email}")
    
    return user

class AuthMiddleware:
    """Middleware for authentication and security headers"""
    
    async def __call__(self, request: Request, call_next):
        # Start timing
        start_time = time.time()
        
        # Add security headers
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Add CSP header for production
        if not request.app.debug:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://api.openclip.pro wss://api.openclip.pro"
            )
        
        # Log request duration
        duration = time.time() - start_time
        if duration > 1.0:  # Log slow requests
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {duration:.2f}s"
            )
        
        return response

# Dependency injection shortcuts
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentUserOptional = Annotated[Optional[User], Depends(get_current_user_optional)]
CurrentSuperuser = Annotated[User, Depends(get_current_superuser)]

# Permission dependencies
require_admin = RoleChecker(["admin", "superuser"])
require_moderator = RoleChecker(["moderator", "admin", "superuser"])
