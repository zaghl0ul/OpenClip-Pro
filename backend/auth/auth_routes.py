"""
Authentication API endpoints with comprehensive security measures.
Implements OWASP authentication best practices.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re
import logging

from auth.auth_handler import auth_handler, rate_limit
from models.database import User
from models.repositories import UserRepository
from utils.db_manager import get_db
from utils.email_service import send_verification_email, send_password_reset_email
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Request/Response Models
class UserRegister(BaseModel):
    """User registration request with validation"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Enforce password complexity requirements"""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str

class TokenRefresh(BaseModel):
    """Token refresh request"""
    refresh_token: str

class PasswordReset(BaseModel):
    """Password reset request"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

class UserResponse(BaseModel):
    """User response model"""
    id: str
    email: str
    full_name: str
    is_active: bool
    roles: list[str]
    created_at: datetime

class PasswordChange(BaseModel):
    """Password change request"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        """Enforce password complexity requirements"""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

@router.post("/register", response_model=UserResponse)
# @rate_limit(max_requests=5, window_seconds=300)  # Temporarily disabled
async def register(
    request: Request,
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    Implements email verification workflow.
    """
    # Check if user exists
    existing_user = UserRepository.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create user
    hashed_password = auth_handler.get_password_hash(user_data.password)
    user = UserRepository.create_user(db, {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hashed_password,
        "is_active": False,  # Require email verification
        "roles": ["user"]
    })
    
    # Send verification email
    try:
        await send_verification_email(user.email, user.id)
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        # Don't fail registration, but log the error
    
    logger.info(f"New user registered: {user.email}")
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        roles=user.roles,
        created_at=user.created_at
    )

@router.post("/login")
# @rate_limit(max_requests=10, window_seconds=60)  # Temporarily disabled
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return token pair.
    Sets secure HTTP-only cookie for refresh token.
    """
    # Validate credentials
    user = UserRepository.get_user_by_email(db, form_data.username)  # OAuth2 uses 'username'
    if not user or not auth_handler.verify_password(form_data.password, user.hashed_password):
        # Log failed attempt
        logger.warning(f"Failed login attempt for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not activated. Please check your email."
        )
    
    # Generate tokens
    token_pair = auth_handler.create_token_pair(user, db)
    
    # Set refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=token_pair.refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",  # HTTPS only in production
        samesite="lax",
        path="/api/auth/refresh"
    )
    
    # Update last login
    UserRepository.update_last_login(db, user.id)
    
    logger.info(f"User logged in: {user.email}")
    
    return {
        "access_token": token_pair.access_token,
        "token_type": token_pair.token_type,
        "expires_in": token_pair.expires_in,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "roles": user.roles
        }
    }

@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token from cookie.
    Implements token rotation for security.
    """
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    
    try:
        # Get new token pair
        token_pair = auth_handler.refresh_access_token(refresh_token, db)
        
        # Update refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value=token_pair.refresh_token,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            httponly=True,
            secure=settings.ENVIRONMENT == "production",
            samesite="lax",
            path="/api/auth/refresh"
        )
        
        return {
            "access_token": token_pair.access_token,
            "token_type": token_pair.token_type,
            "expires_in": token_pair.expires_in
        }
        
    except HTTPException:
        # Clear invalid cookie
        response.delete_cookie("refresh_token", path="/api/auth/refresh")
        raise

@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(auth_handler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout user by revoking tokens and clearing cookies.
    """
    # Clear refresh token cookie
    response.delete_cookie("refresh_token", path="/api/auth/refresh")
    
    # Revoke all user's refresh tokens in database
    UserRepository.revoke_all_refresh_tokens(db, current_user.id)
    
    logger.info(f"User logged out: {current_user.email}")
    
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: User = Depends(auth_handler.get_current_user)
):
    """Get current authenticated user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        roles=current_user.roles,
        created_at=current_user.created_at
    )

@router.post("/verify-email/{token}")
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify user email address"""
    # Decode verification token
    try:
        payload = auth_handler.decode_token(token)
        user_id = payload.get("user_id")
        if not user_id or payload.get("type") != "email_verification":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Activate user
    user = UserRepository.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_active:
        return {"message": "Email already verified"}
    
    UserRepository.activate_user(db, user_id)
    logger.info(f"Email verified for user: {user.email}")
    
    return {"message": "Email successfully verified"}

@router.post("/request-password-reset")
# @rate_limit(max_requests=3, window_seconds=300)  # Temporarily disabled
async def request_password_reset(
    request: Request,
    email: EmailStr,
    db: Session = Depends(get_db)
):
    """Request password reset email"""
    user = UserRepository.get_user_by_email(db, email)
    
    # Don't reveal if user exists
    if user:
        try:
            await send_password_reset_email(user.email, user.id)
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
    
    return {"message": "If the email exists, a password reset link has been sent"}

@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """Reset user password with token"""
    try:
        payload = auth_handler.decode_token(reset_data.token)
        user_id = payload.get("user_id")
        if not user_id or payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password
    hashed_password = auth_handler.get_password_hash(reset_data.new_password)
    UserRepository.update_password(db, user_id, hashed_password)
    
    # Revoke all refresh tokens for security
    UserRepository.revoke_all_refresh_tokens(db, user_id)
    
    logger.info(f"Password reset for user ID: {user_id}")
    
    return {"message": "Password successfully reset"}

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(auth_handler.get_current_user),
    db: Session = Depends(get_db)
):
    """Change password for authenticated user"""
    # Verify current password
    if not auth_handler.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    hashed_password = auth_handler.get_password_hash(password_data.new_password)
    UserRepository.update_password(db, current_user.id, hashed_password)
    
    logger.info(f"Password changed for user: {current_user.email}")
    
    return {"message": "Password successfully changed"}

# Admin endpoints
@router.get("/users", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(auth_handler.require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    """List all users (admin only)"""
    users = UserRepository.get_users(db, skip=skip, limit=limit)
    return [
        UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            roles=user.roles,
            created_at=user.created_at
        )
        for user in users
    ]

@router.put("/users/{user_id}/roles")
async def update_user_roles(
    user_id: str,
    roles: list[str],
    current_user: User = Depends(auth_handler.require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    """Update user roles (admin only)"""
    user = UserRepository.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    UserRepository.update_roles(db, user_id, roles)
    logger.info(f"Roles updated for user {user.email} by admin {current_user.email}")
    
    return {"message": "Roles updated successfully"}
