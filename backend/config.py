"""
Application configuration with security-first defaults.
Uses environment variables with sensible fallbacks.
"""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import field_validator
from pathlib import Path

class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Application
    PROJECT_NAME: str = "OpenClip Pro API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-powered video analysis and processing API"
    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # API
    API_V1_STR: str = "/api/v1"
    
    # Database
    # The DATABASE_URL to connect to.
    # By default, this is a local SQLite database.
    # To use PostgreSQL, set this in your .env file:
    # DATABASE_URL="postgresql://user:password@host:port/dbname"
    DATABASE_URL: str = "sqlite:///./app.db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_PASSWORD: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "CHANGE-THIS-IN-PRODUCTION-DO-NOT-USE-THIS-SECRET-KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Password Policy
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_NUMBERS: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = True
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # CORS
    ALLOWED_HOSTS: List[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    VIDEOS_DIR: str = "uploads/videos"
    THUMBNAILS_DIR: str = "uploads/thumbnails"
    MAX_FILE_SIZE: int = 500 * 1024 * 1024  # 500MB
    ALLOWED_VIDEO_EXTENSIONS: List[str] = [".mp4", ".avi", ".mov", ".mkv", ".webm"]
    
    # AI Providers
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-vision-preview"
    OPENAI_MAX_TOKENS: int = 4096
    
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-opus-20240229"
    
    LMSTUDIO_BASE_URL: str = "http://localhost:1234"
    LMSTUDIO_MODEL: str = "local-model"
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@openclippro.com"
    SMTP_FROM_NAME: str = "OpenClip Pro"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    # Feature Flags
    ENABLE_REGISTRATION: bool = True
    ENABLE_SOCIAL_AUTH: bool = False
    ENABLE_TWO_FACTOR: bool = True
    ENABLE_API_KEYS: bool = True
    ENABLE_TEAMS: bool = True
    
    # Limits
    FREE_TIER_STORAGE_GB: int = 5
    FREE_TIER_PROJECTS: int = 10
    FREE_TIER_API_CALLS: int = 1000
    
    @field_validator("UPLOAD_DIR", "VIDEOS_DIR", "THUMBNAILS_DIR")
    @classmethod
    def create_directories(cls, v):
        """Ensure directories exist"""
        path = Path(v)
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    
    
    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v, info):
        """Ensure secret key is set in production"""
        if info.data.get("ENVIRONMENT") == "production" and "CHANGE-THIS" in v:
            raise ValueError("SECRET_KEY must be set in production")
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Global settings instance
settings = Settings()

# Export commonly used settings
SECRET_KEY = settings.SECRET_KEY
DATABASE_URL = settings.DATABASE_URL
REDIS_URL = settings.REDIS_URL
if settings.REDIS_PASSWORD:
    REDIS_URL = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_URL.split('@')[1]}"

# Ensure log directory exists
log_dir = Path(settings.LOG_FILE).parent
log_dir.mkdir(exist_ok=True)
