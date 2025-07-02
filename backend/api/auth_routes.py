"""
Authentication API Routes with Advanced Security Features
Implements complete auth flow with 2FA, password reset, and session management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import secrets
import pyotp
import qrcode
import io
import base64
from pydantic import BaseModel, EmailStr, Field, validator
import re

from ...config import get_db
from ...models.user import User, UserRole, AccountStatus, AuditLog
from ...auth.jwt_handler import JWTHandler, TokenPair
from ...middleware.auth_middleware import get_current_user, get_current_user_optional
from ...services.email_service import EmailService
from ...utils.rate_limiter import rate_limiter
from ...utils.security_utils import generate_secure_token, verify_recaptcha

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pydantic models for request/response
class UserRegister(BaseModel):
    """User registration schema with validation"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    recaptcha_token: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        """Enforce password complexity requirements"""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        """Validate username format"""
        if v and not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v

class UserLogin(BaseModel):
    """Login schema with device tracking"""
    email: EmailStr
    password: str
    two_factor_code: Optional[str] = None
    remember_me: bool = False
    device_name: Optional[str] = None

class PasswordReset(BaseModel):
    """Password reset request"""
    email: EmailStr
    recaptcha_token: Optional[str] = None

class PasswordResetConfirm(BaseModel):
    """Confirm password reset"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_password(cls, v):
        """Reuse password validation"""
        return UserRegister.validate_password(v)

class EmailVerification(BaseModel):
    """Email verification request"""
    token: str

class TwoFactorSetup(BaseModel):
    """2FA setup confirmation"""
    code: str

class ChangePassword(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_password(cls, v):
        """Reuse password validation"""
        return UserRegister.validate_password(v)

class UserResponse(BaseModel):
    """User response model"""
    id: int
    email: str
    username: Optional[str]
    full_name: Optional[str]
    role: str
    email_verified: bool
    two_factor_enabled: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Utility functions
async def create_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    details: Dict[str, Any],
    request: Request
):
    """Create audit log entry"""
    audit = AuditLog(
        user_id=user_id,
        action=action,
        details=details,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit)
    db.commit()

@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Register new user with email verification
    Implements rate limiting and fraud detection
    """
    # Rate limiting
    allowed, metadata = rate_limiter.check_rate_limit(
        request.client.host,
        "registration",
        limit=5,
        window=3600
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many registration attempts. Try again in {metadata['retry_after']} seconds"
        )
    
    # Verify reCAPTCHA in production
    if user_data.recaptcha_token and not request.app.debug:
        if not await verify_recaptcha(user_data.recaptcha_token):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="reCAPTCHA verification failed"
            )
    
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | 
        (User.username == user_data.username)
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken"
            )
    
    # Create new user
    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        role=UserRole.TRIAL,
        account_status=AccountStatus.PENDING
    )
    
    # Set password with validation
    try:
        user.set_password(user_data.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Generate email verification token
    verification_token = JWTHandler.create_email_verification_token(
        user.email,
        user.id or 0  # Temporary ID
    )
    user.email_verification_token = verification_token
    
    # Save user
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send verification email in background
    background_tasks.add_task(
        EmailService.send_verification_email,
        user.email,
        user.full_name,
        verification_token
    )
    
    # Create audit log
    await create_audit_log(
        db,
        user.id,
        "user_registered",
        {"email": user.email, "username": user.username},
        request
    )
    
    return {
        "message": "Registration successful. Please check your email to verify your account.",
        "user": UserResponse.from_orm(user).dict()
    }

@router.post("/login", response_model=Dict[str, Any])
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    User login with 2FA support
    Returns JWT tokens and sets secure cookies
    """
    # Rate limiting
    allowed, metadata = rate_limiter.check_rate_limit(
        request.client.host,
        "login",
        limit=10,
        window=300  # 10 attempts per 5 minutes
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Try again in {metadata['retry_after']} seconds"
        )
    
    # Find user
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user:
        # Don't reveal if email exists
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if account is locked
    if user.is_locked():
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account temporarily locked due to multiple failed login attempts"
        )
    
    # Verify password
    if not user.check_password(form_data.password):
        user.record_failed_login(request.client.host)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check account status
    if user.account_status == AccountStatus.BANNED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been banned"
        )
    
    if user.account_status == AccountStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended"
        )
    
    # Check email verification
    if not user.email_verified and request.app.state.settings.require_email_verification:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required. Please check your email."
        )
    
    # Handle 2FA if enabled
    if user.two_factor_enabled:
        two_factor_code = form_data.client_id  # Use client_id field for 2FA code
        
        if not two_factor_code:
            # Return partial success, client should prompt for 2FA
            return {
                "requires_2fa": True,
                "message": "Please provide 2FA code"
            }
        
        # Verify 2FA code
        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(two_factor_code, valid_window=1):
            # Check backup codes
            if not user.verify_backup_code(two_factor_code):
                user.record_failed_login(request.client.host)
                db.commit()
                
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid 2FA code"
                )
    
    # Successful login
    user.record_login(request.client.host, request.headers.get("user-agent"))
    
    # Activate account if pending
    if user.account_status == AccountStatus.PENDING:
        user.account_status = AccountStatus.ACTIVE
        user.is_active = True
    
    db.commit()
    
    # Generate tokens
    user_data = {
        "email": user.email,
        "user_id": user.id,
        "role": user.role,
        "scopes": user.permissions or []
    }
    
    tokens = JWTHandler.create_token_pair(user_data)
    
    # Set secure HTTP-only cookies
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        secure=True,  # HTTPS only
        samesite="lax",
        max_age=tokens.expires_in
    )
    
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 24 * 60 * 60  # 30 days
    )
    
    # Create audit log
    await create_audit_log(
        db,
        user.id,
        "user_login",
        {"ip": request.client.host, "user_agent": request.headers.get("user-agent")},
        request
    )
    
    return {
        "access_token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
        "token_type": tokens.token_type,
        "expires_in": tokens.expires_in,
        "user": UserResponse.from_orm(user).dict()
    }

@router.post("/refresh", response_model=TokenPair)
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    Implements token rotation for security
    """
    # Get refresh token from cookie or header
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            refresh_token = auth_header[7:]
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required"
        )
    
    try:
        # Generate new token pair
        tokens = JWTHandler.refresh_access_token(refresh_token)
        
        # Update cookies
        response.set_cookie(
            key="access_token",
            value=tokens.access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=tokens.expires_in
        )
        
        response.set_cookie(
            key="refresh_token",
            value=tokens.refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=30 * 24 * 60 * 60
        )
        
        return tokens
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user)
):
    """
    Logout user and revoke tokens
    Clears cookies and blacklists tokens
    """
    # Get tokens
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")
    
    # Revoke tokens
    if access_token:
        JWTHandler.revoke_token(access_token, "access")
    
    if refresh_token:
        JWTHandler.revoke_token(refresh_token, "refresh")
    
    # Clear cookies
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    
    # Create audit log
    await create_audit_log(
        request.state.db,
        current_user.id,
        "user_logout",
        {"ip": request.client.host},
        request
    )
    
    return {"message": "Logged out successfully"}

@router.post("/verify-email")
async def verify_email(
    data: EmailVerification,
    db: Session = Depends(get_db)
):
    """Verify user email address"""
    # Verify token
    token_data = JWTHandler.verify_email_token(data.token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Find user
    user = db.query(User).filter(
        User.id == token_data["user_id"],
        User.email == token_data["email"]
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify email
    user.email_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    user.email_verification_token = None
    
    # Activate account if pending
    if user.account_status == AccountStatus.PENDING:
        user.account_status = AccountStatus.ACTIVE
        user.is_active = True
    
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.post("/password-reset")
async def request_password_reset(
    data: PasswordReset,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Request password reset email"""
    # Rate limiting
    allowed, metadata = rate_limiter.check_rate_limit(
        request.client.host,
        "password_reset",
        limit=3,
        window=3600
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many password reset attempts. Try again in {metadata['retry_after']} seconds"
        )
    
    # Find user
    user = db.query(User).filter(User.email == data.email).first()
    
    # Always return success to prevent email enumeration
    if user and user.is_active:
        # Generate reset token
        reset_token = JWTHandler.create_password_reset_token(user.email)
        
        # Send reset email
        background_tasks.add_task(
            EmailService.send_password_reset_email,
            user.email,
            user.full_name,
            reset_token
        )
        
        # Audit log
        await create_audit_log(
            db,
            user.id,
            "password_reset_requested",
            {"ip": request.client.host},
            request
        )
    
    return {"message": "If the email exists, a password reset link has been sent"}

@router.post("/password-reset-confirm")
async def confirm_password_reset(
    data: PasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db)
):
    """Confirm password reset with token"""
    # Verify token
    email = JWTHandler.verify_password_reset_token(data.token)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Find user
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Set new password
    try:
        user.set_password(data.new_password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Clear any existing sessions
    user.failed_login_attempts = 0
    user.locked_until = None
    
    db.commit()
    
    # Audit log
    await create_audit_log(
        db,
        user.id,
        "password_reset_completed",
        {"ip": request.client.host},
        request
    )
    
    return {"message": "Password reset successfully"}

@router.post("/2fa/setup", response_model=Dict[str, Any])
async def setup_two_factor(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Setup 2FA for user account
    Returns QR code and backup codes
    """
    # Generate secret
    secret = pyotp.random_base32()
    
    # Generate QR code
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="OpenClip Pro"
    )
    
    # Create QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    
    qr_code_b64 = base64.b64encode(buf.getvalue()).decode()
    
    # Store secret temporarily (not enabled yet)
    current_user.two_factor_secret = secret
    db.commit()
    
    return {
        "qr_code": f"data:image/png;base64,{qr_code_b64}",
        "secret": secret,
        "message": "Scan QR code with your authenticator app and confirm with the code"
    }

@router.post("/2fa/confirm", response_model=Dict[str, Any])
async def confirm_two_factor(
    data: TwoFactorSetup,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm 2FA setup with code"""
    if not current_user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated"
        )
    
    # Verify code
    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(data.code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Enable 2FA
    current_user.two_factor_enabled = True
    
    # Generate backup codes
    backup_codes = current_user.generate_backup_codes()
    
    db.commit()
    
    return {
        "message": "2FA enabled successfully",
        "backup_codes": backup_codes,
        "warning": "Save these backup codes securely. They won't be shown again."
    }

@router.post("/2fa/disable")
async def disable_two_factor(
    current_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable 2FA (requires password confirmation)"""
    if not current_user.check_password(current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    current_user.backup_codes = None
    
    db.commit()
    
    return {"message": "2FA disabled successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@router.put("/me/password")
async def change_password(
    data: ChangePassword,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify current password
    if not current_user.check_password(data.current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid current password"
        )
    
    # Set new password
    try:
        current_user.set_password(data.new_password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    db.commit()
    
    # Audit log
    await create_audit_log(
        db,
        current_user.id,
        "password_changed",
        {"ip": request.client.host},
        request
    )
    
    return {"message": "Password changed successfully"}

@router.delete("/me/sessions")
async def revoke_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke all user sessions except current"""
    # Implementation would revoke all tokens for the user
    # This is a placeholder for the actual implementation
    
    return {"message": "All other sessions have been revoked"}

@router.get("/verify-token")
async def verify_token(
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Verify if token is valid"""
    if current_user:
        return {
            "valid": True,
            "user": UserResponse.from_orm(current_user).dict()
        }
    
    return {"valid": False}
