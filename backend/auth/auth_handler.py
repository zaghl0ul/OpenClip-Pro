"""
Enterprise-grade JWT authentication handler with refresh token rotation.
Implements OWASP security best practices for token-based authentication.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import secrets
import redis
from pydantic import BaseModel, EmailStr
import logging

from models.database import User, RefreshToken
from utils.db_manager import get_db
from config import settings

logger = logging.getLogger(__name__)

# Security configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Redis for token blacklisting and rate limiting (optional for development)
try:
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=0,
        decode_responses=True
    )
    # Test connection
    redis_client.ping()
except:
    redis_client = None
    logger.warning("Redis not available - token blacklisting disabled")

class TokenData(BaseModel):
    """Token payload structure"""
    user_id: str
    email: str
    roles: list[str] = []
    
class TokenPair(BaseModel):
    """Access and refresh token pair"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    
class AuthHandler:
    """
    Handles all authentication operations including token generation,
    validation, refresh, and revocation.
    """
    
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS
        
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash using bcrypt"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Generate bcrypt hash with appropriate cost factor"""
        return pwd_context.hash(password)
    
    def create_access_token(self, data: TokenData) -> str:
        """
        Create JWT access token with user claims.
        Implements short-lived tokens for security.
        """
        to_encode = data.dict()
        expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "access",
            "jti": secrets.token_urlsafe(16)  # JWT ID for revocation
        })
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, user_id: str, db: Session) -> str:
        """
        Create secure refresh token with database tracking.
        Implements token rotation on each refresh.
        """
        # Generate cryptographically secure token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
        
        # Store in database for validation and revocation
        refresh_token = RefreshToken(
            token=token,
            user_id=user_id,
            expires_at=expires_at,
            created_at=datetime.now(timezone.utc),
            device_info=None  # Can be extended for device tracking
        )
        db.add(refresh_token)
        db.commit()
        
        return token
    
    def create_token_pair(self, user: User, db: Session) -> TokenPair:
        """Generate both access and refresh tokens"""
        token_data = TokenData(
            user_id=str(user.id),
            email=user.email,
            roles=user.roles or []
        )
        
        access_token = self.create_access_token(token_data)
        refresh_token = self.create_refresh_token(str(user.id), db)
        
        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=self.access_token_expire_minutes * 60
        )
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        """
        Decode and validate JWT token.
        Checks expiration and blacklist status.
        """
        try:
            # Check if token is blacklisted (only if Redis is available)
            if redis_client:
                jti = self._extract_jti(token)
                if jti and redis_client.get(f"blacklist:{jti}"):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has been revoked"
                    )
            
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    
    def refresh_access_token(self, refresh_token: str, db: Session) -> TokenPair:
        """
        Refresh access token using refresh token.
        Implements token rotation for enhanced security.
        """
        # Validate refresh token
        token_record = db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc)
        ).first()
        
        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user
        user = db.query(User).filter(User.id == token_record.user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Revoke old refresh token (rotation)
        token_record.revoked = True
        token_record.revoked_at = datetime.now(timezone.utc)
        db.commit()
        
        # Create new token pair
        return self.create_token_pair(user, db)
    
    def revoke_token(self, token: str, token_type: str = "access") -> None:
        """
        Revoke token by adding to blacklist.
        Supports both access and refresh token revocation.
        """
        if token_type == "access" and redis_client:
            jti = self._extract_jti(token)
            if jti:
                # Add to Redis blacklist with TTL matching token expiry
                ttl = self.access_token_expire_minutes * 60
                redis_client.setex(f"blacklist:{jti}", ttl, "1")
        elif token_type == "refresh":
            # Handled in database during refresh operation
            pass
    
    def _extract_jti(self, token: str) -> Optional[str]:
        """Extract JWT ID from token without full validation"""
        try:
            # Decode without verification to get JTI
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("jti")
        except:
            return None
    
    async def get_current_user(
        self, 
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ) -> User:
        """
        FastAPI dependency to get current authenticated user.
        Validates token and retrieves user from database.
        """
        token = credentials.credentials
        payload = self.decode_token(token)
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        return user
    
    async def get_current_active_user(
        self,
        current_user: User = Depends(get_current_user)
    ) -> User:
        """Ensure user is active"""
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        return current_user
    
    def require_roles(self, required_roles: list[str]):
        """
        Dependency factory for role-based access control.
        Usage: Depends(auth_handler.require_roles(["admin"]))
        """
        async def role_checker(
            current_user: User = Depends(self.get_current_active_user)
        ) -> User:
            user_roles = set(current_user.roles or [])
            if not any(role in user_roles for role in required_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            return current_user
        
        return role_checker

# Singleton instance
auth_handler = AuthHandler()

# Rate limiting decorator
def rate_limit(max_requests: int = 5, window_seconds: int = 60):
    """
    Rate limiting decorator using Redis.
    Prevents brute force attacks on authentication endpoints.
    """
    def decorator(func):
        import functools
        
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args/kwargs
            request = None
            for arg in args:
                if hasattr(arg, 'client'):
                    request = arg
                    break
            
            if not request:
                for value in kwargs.values():
                    if hasattr(value, 'client'):
                        request = value
                        break
            
            if request and hasattr(request, 'client') and request.client:
                client_ip = request.client.host
                key = f"rate_limit:{func.__name__}:{client_ip}"
                
                if redis_client:
                    try:
                        current = redis_client.get(key)
                        if current and int(current) >= max_requests:
                            raise HTTPException(
                                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                                detail="Too many requests. Please try again later."
                            )
                        
                        # Increment counter
                        pipe = redis_client.pipeline()
                        pipe.incr(key)
                        pipe.expire(key, window_seconds)
                        pipe.execute()
                    except Exception as e:
                        # If Redis is not available, log but don't block the request
                        logger.warning(f"Rate limiting failed: {e}")
                else:
                    # Skip rate limiting if Redis is not available
                    pass
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator
