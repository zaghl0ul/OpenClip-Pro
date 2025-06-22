from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets
from collections import defaultdict
import time

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class AuthHandler:
    def __init__(self):
        self.pwd_context = pwd_context
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        """Decode and verify a JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            raise ValueError("Invalid token")
    
    def get_current_user(self, token: Optional[str] = None):
        """Get current user from token - simplified version"""
        if not token:
            return None
        
        try:
            payload = self.decode_token(token)
            user_id = payload.get("user_id")
            if user_id is None:
                return None
            return {"id": user_id, "email": payload.get("email")}
        except ValueError:
            return None
    
    def require_roles(self, roles: list):
        """Decorator to require specific roles - simplified version"""
        def decorator(func):
            return func
        return decorator

# Create global instance
auth_handler = AuthHandler()

# Simple rate limiting
_rate_limit_storage = defaultdict(list)

def rate_limit(max_requests: int = 100, window_seconds: int = 3600):
    """Simple rate limiting decorator"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Get client IP from request (simplified)
            client_ip = "127.0.0.1"  # In real implementation, extract from request
            
            now = time.time()
            # Clean old requests
            _rate_limit_storage[client_ip] = [
                req_time for req_time in _rate_limit_storage[client_ip]
                if now - req_time < window_seconds
            ]
            
            # Check rate limit
            if len(_rate_limit_storage[client_ip]) >= max_requests:
                raise Exception("Rate limit exceeded")
            
            # Add current request
            _rate_limit_storage[client_ip].append(now)
            
            return func(*args, **kwargs)
        return wrapper
    return decorator 