"""
Advanced JWT Token Handler with Refresh Token Support
Implements secure token generation, validation, and refresh mechanisms
"""

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import redis
from sqlalchemy.orm import Session
import hashlib
import base64

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30
PASSWORD_RESET_TOKEN_EXPIRE_HOURS = 24

# Redis connection for token blacklisting
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class TokenData(BaseModel):
    """Token payload structure"""
    email: Optional[str] = None
    user_id: Optional[int] = None
    scopes: list[str] = []
    
class TokenPair(BaseModel):
    """Access and refresh token pair"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60

class TokenBlacklist:
    """Manages token blacklisting for logout and revocation"""
    
    @staticmethod
    def add_to_blacklist(token: str, expiry_time: int):
        """Add token to blacklist with TTL"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        redis_client.setex(
            f"blacklist:{token_hash}",
            expiry_time,
            "1"
        )
    
    @staticmethod
    def is_blacklisted(token: str) -> bool:
        """Check if token is blacklisted"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        return redis_client.exists(f"blacklist:{token_hash}") > 0

class JWTHandler:
    """Advanced JWT handling with security best practices"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generate password hash with salt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token with custom claims"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "access",
            "jti": secrets.token_urlsafe(16)  # JWT ID for tracking
        })
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "refresh",
            "jti": secrets.token_urlsafe(16)
        })
        
        encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_token_pair(user_data: Dict[str, Any]) -> TokenPair:
        """Create access and refresh token pair"""
        access_token = JWTHandler.create_access_token(data=user_data)
        refresh_token = JWTHandler.create_refresh_token(data=user_data)
        
        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    @staticmethod
    def decode_token(token: str, token_type: str = "access") -> Dict[str, Any]:
        """Decode and validate JWT token"""
        try:
            # Check blacklist first
            if TokenBlacklist.is_blacklisted(token):
                raise JWTError("Token has been revoked")
            
            # Use appropriate secret based on token type
            secret = SECRET_KEY if token_type == "access" else REFRESH_SECRET_KEY
            
            payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
            
            # Validate token type
            if payload.get("type") != token_type:
                raise JWTError("Invalid token type")
            
            return payload
            
        except JWTError as e:
            raise JWTError(f"Token validation failed: {str(e)}")
    
    @staticmethod
    def refresh_access_token(refresh_token: str) -> TokenPair:
        """Generate new token pair from refresh token"""
        try:
            payload = JWTHandler.decode_token(refresh_token, token_type="refresh")
            
            # Extract user data
            user_data = {
                "email": payload.get("email"),
                "user_id": payload.get("user_id"),
                "scopes": payload.get("scopes", [])
            }
            
            # Create new token pair
            new_tokens = JWTHandler.create_token_pair(user_data)
            
            # Optionally blacklist old refresh token
            remaining_time = payload["exp"] - datetime.now(timezone.utc).timestamp()
            if remaining_time > 0:
                TokenBlacklist.add_to_blacklist(refresh_token, int(remaining_time))
            
            return new_tokens
            
        except JWTError as e:
            raise JWTError(f"Refresh token invalid: {str(e)}")
    
    @staticmethod
    def create_password_reset_token(email: str) -> str:
        """Create secure password reset token"""
        data = {
            "email": email,
            "purpose": "password_reset",
            "nonce": secrets.token_urlsafe(16)
        }
        
        expires = timedelta(hours=PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        return JWTHandler.create_access_token(data=data, expires_delta=expires)
    
    @staticmethod
    def verify_password_reset_token(token: str) -> Optional[str]:
        """Verify password reset token and return email"""
        try:
            payload = JWTHandler.decode_token(token, token_type="access")
            
            if payload.get("purpose") != "password_reset":
                return None
                
            return payload.get("email")
            
        except JWTError:
            return None
    
    @staticmethod
    def revoke_token(token: str, token_type: str = "access"):
        """Revoke a token by adding to blacklist"""
        try:
            payload = JWTHandler.decode_token(token, token_type=token_type)
            remaining_time = payload["exp"] - datetime.now(timezone.utc).timestamp()
            
            if remaining_time > 0:
                TokenBlacklist.add_to_blacklist(token, int(remaining_time))
                
        except JWTError:
            pass  # Token already invalid
    
    @staticmethod
    def create_email_verification_token(email: str, user_id: int) -> str:
        """Create email verification token"""
        data = {
            "email": email,
            "user_id": user_id,
            "purpose": "email_verification",
            "nonce": secrets.token_urlsafe(16)
        }
        
        expires = timedelta(hours=48)  # 48 hour expiry
        return JWTHandler.create_access_token(data=data, expires_delta=expires)
    
    @staticmethod
    def verify_email_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify email verification token"""
        try:
            payload = JWTHandler.decode_token(token, token_type="access")
            
            if payload.get("purpose") != "email_verification":
                return None
                
            return {
                "email": payload.get("email"),
                "user_id": payload.get("user_id")
            }
            
        except JWTError:
            return None

# Utility functions for common operations
def generate_secure_random_token(length: int = 32) -> str:
    """Generate cryptographically secure random token"""
    return secrets.token_urlsafe(length)

def create_api_key(user_id: int, name: str = "default") -> str:
    """Create API key for programmatic access"""
    data = {
        "user_id": user_id,
        "key_name": name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "type": "api_key"
    }
    
    # API keys don't expire by default
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def validate_api_key(api_key: str) -> Optional[Dict[str, Any]]:
    """Validate API key and return associated data"""
    try:
        payload = jwt.decode(api_key, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "api_key":
            return None
            
        return payload
        
    except JWTError:
        return None
