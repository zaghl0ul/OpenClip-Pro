"""
Enhanced User Model with Advanced Security and Audit Features
Implements comprehensive user management with role-based access control
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, Float, Index
from sqlalchemy.orm import relationship, validates
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime, timezone
import re
import secrets
from typing import List, Dict, Optional
from enum import Enum

from ..config import Base
from ..auth.jwt_handler import pwd_context

class UserRole(str, Enum):
    """User role enumeration with hierarchical permissions"""
    SUPERUSER = "superuser"
    ADMIN = "admin"
    MODERATOR = "moderator"
    PRO = "pro"
    STANDARD = "standard"
    TRIAL = "trial"
    
    @property
    def hierarchy_level(self) -> int:
        """Get hierarchical level for role comparison"""
        levels = {
            self.SUPERUSER: 100,
            self.ADMIN: 90,
            self.MODERATOR: 80,
            self.PRO: 50,
            self.STANDARD: 30,
            self.TRIAL: 10
        }
        return levels.get(self.value, 0)
    
    def has_permission(self, required_role: 'UserRole') -> bool:
        """Check if this role has permission for required role"""
        return self.hierarchy_level >= required_role.hierarchy_level

class AccountStatus(str, Enum):
    """Account status enumeration"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"
    PENDING = "pending"
    DELETED = "deleted"

class User(Base):
    """
    Enhanced User model with comprehensive security features
    Includes audit trail, rate limiting, and advanced authentication
    """
    __tablename__ = "users"
    
    # Primary identification
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=True)
    
    # Authentication
    hashed_password = Column(String(255), nullable=False)
    password_history = Column(JSON, default=list)  # Store last N password hashes
    password_changed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    force_password_change = Column(Boolean, default=False)
    
    # Email verification
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(255), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Two-factor authentication
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    backup_codes = Column(JSON, nullable=True)  # Encrypted backup codes
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_banned = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    account_status = Column(String(20), default=AccountStatus.PENDING)
    status_reason = Column(Text, nullable=True)
    
    # Role and permissions
    role = Column(String(20), default=UserRole.TRIAL)
    permissions = Column(JSON, default=list)  # Fine-grained permissions
    
    # Profile information
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(100), nullable=True)
    timezone = Column(String(50), default="UTC")
    language = Column(String(10), default="en")
    
    # Subscription and usage
    subscription_tier = Column(String(50), default="free")
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    api_quota_used = Column(Integer, default=0)
    api_quota_limit = Column(Integer, default=1000)
    storage_used_mb = Column(Float, default=0.0)
    storage_limit_mb = Column(Float, default=1000.0)
    
    # Security tracking
    failed_login_attempts = Column(Integer, default=0)
    last_failed_login = Column(DateTime(timezone=True), nullable=True)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # Activity tracking
    last_login = Column(DateTime(timezone=True), nullable=True)
    last_activity = Column(DateTime(timezone=True), nullable=True)
    last_ip_address = Column(String(45), nullable=True)  # Support IPv6
    login_history = Column(JSON, default=list)  # Store last N logins
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_by = Column(Integer, nullable=True)  # User ID who created this account
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # Soft delete
    
    # API keys
    api_keys = Column(JSON, default=list)  # Store API key metadata
    
    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
        Index('idx_user_role_status', 'role', 'account_status'),
        Index('idx_user_created_at', 'created_at'),
    )
    
    @validates('email')
    def validate_email(self, key, email):
        """Validate email format and normalize"""
        if not email:
            raise ValueError("Email is required")
        
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValueError("Invalid email format")
        
        # Normalize email
        return email.lower().strip()
    
    @validates('username')
    def validate_username(self, key, username):
        """Validate username format"""
        if username:
            # Username requirements: 3-50 chars, alphanumeric + underscore
            if not re.match(r'^[a-zA-Z0-9_]{3,50}$', username):
                raise ValueError("Username must be 3-50 characters, alphanumeric and underscore only")
        
        return username
    
    @hybrid_property
    def is_premium(self) -> bool:
        """Check if user has premium features"""
        return self.role in [UserRole.PRO, UserRole.ADMIN, UserRole.SUPERUSER]
    
    @hybrid_property
    def is_staff(self) -> bool:
        """Check if user is staff member"""
        return self.role in [UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPERUSER]
    
    def set_password(self, password: str):
        """Set password with security checks and history"""
        # Password strength validation
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        if not any(c.isupper() for c in password):
            raise ValueError("Password must contain at least one uppercase letter")
        
        if not any(c.islower() for c in password):
            raise ValueError("Password must contain at least one lowercase letter")
        
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must contain at least one digit")
        
        # Check password history
        for old_hash in self.password_history or []:
            if pwd_context.verify(password, old_hash):
                raise ValueError("Password has been used recently")
        
        # Hash password
        self.hashed_password = pwd_context.hash(password)
        
        # Update password history (keep last 5)
        if not self.password_history:
            self.password_history = []
        
        self.password_history.append(self.hashed_password)
        self.password_history = self.password_history[-5:]
        
        self.password_changed_at = datetime.now(timezone.utc)
        self.force_password_change = False
    
    def check_password(self, password: str) -> bool:
        """Verify password"""
        return pwd_context.verify(password, self.hashed_password)
    
    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """Generate backup codes for 2FA"""
        codes = []
        hashed_codes = []
        
        for _ in range(count):
            code = f"{secrets.randbelow(1000000):06d}"
            codes.append(code)
            hashed_codes.append(pwd_context.hash(code))
        
        self.backup_codes = hashed_codes
        return codes
    
    def verify_backup_code(self, code: str) -> bool:
        """Verify and consume backup code"""
        if not self.backup_codes:
            return False
        
        for i, hashed_code in enumerate(self.backup_codes):
            if pwd_context.verify(code, hashed_code):
                # Remove used code
                self.backup_codes.pop(i)
                return True
        
        return False
    
    def record_login(self, ip_address: str, user_agent: str = None):
        """Record successful login"""
        self.last_login = datetime.now(timezone.utc)
        self.last_ip_address = ip_address
        self.failed_login_attempts = 0
        
        # Update login history
        if not self.login_history:
            self.login_history = []
        
        self.login_history.append({
            "timestamp": self.last_login.isoformat(),
            "ip_address": ip_address,
            "user_agent": user_agent
        })
        
        # Keep last 20 logins
        self.login_history = self.login_history[-20:]
    
    def record_failed_login(self, ip_address: str):
        """Record failed login attempt"""
        self.failed_login_attempts += 1
        self.last_failed_login = datetime.now(timezone.utc)
        
        # Lock account after 5 failed attempts
        if self.failed_login_attempts >= 5:
            self.locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
    
    def is_locked(self) -> bool:
        """Check if account is locked"""
        if self.locked_until and self.locked_until > datetime.now(timezone.utc):
            return True
        return False
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission"""
        if self.is_superuser:
            return True
        
        # Check role-based permissions
        role_permissions = {
            UserRole.ADMIN: ["manage_users", "manage_content", "view_analytics"],
            UserRole.MODERATOR: ["manage_content", "view_reports"],
            UserRole.PRO: ["advanced_features", "priority_support"],
        }
        
        if self.role in role_permissions and permission in role_permissions[self.role]:
            return True
        
        # Check individual permissions
        return permission in (self.permissions or [])
    
    def to_dict(self, include_sensitive: bool = False) -> Dict:
        """Convert user to dictionary representation"""
        data = {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "email_verified": self.email_verified,
            "two_factor_enabled": self.two_factor_enabled,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "location": self.location,
            "timezone": self.timezone,
            "language": self.language,
            "subscription_tier": self.subscription_tier,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
        
        if include_sensitive:
            data.update({
                "permissions": self.permissions,
                "api_quota_used": self.api_quota_used,
                "api_quota_limit": self.api_quota_limit,
                "storage_used_mb": self.storage_used_mb,
                "storage_limit_mb": self.storage_limit_mb,
                "failed_login_attempts": self.failed_login_attempts,
            })
        
        return data
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

class UserSession(Base):
    """Track active user sessions for security"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    session_token = Column(String(255), unique=True, index=True)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True))
    last_activity = Column(DateTime(timezone=True))
    
    user = relationship("User", back_populates="sessions")

class AuditLog(Base):
    """Comprehensive audit logging for security and compliance"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    
    user = relationship("User", back_populates="audit_logs")
    
    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
    )
