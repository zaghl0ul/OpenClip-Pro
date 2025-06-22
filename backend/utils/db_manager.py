from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session, Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Generator
import os
from contextlib import contextmanager
import logging

from models.database import Base, User
from auth.auth_handler import AuthHandler
from config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Get the DB URL from environment variable or use SQLite as default
DB_URL = os.environ.get("DATABASE_URL", "sqlite:///./openclip.db")

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    pool_pre_ping=True,
    echo=settings.DEBUG
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
SessionScoped = scoped_session(SessionLocal)

# Initialize database tables
def init_db():
    """Initialize the database by creating all tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Create default admin user if it doesn't exist
        if settings.ENVIRONMENT == "development":
            with get_db_session() as db:
                admin = db.query(User).filter(User.email == "admin@openclippro.com").first()
                if not admin:
                    auth_handler = AuthHandler()
                    admin = User(
                        email="admin@openclippro.com",
                        full_name="Admin User",
                        hashed_password=auth_handler.get_password_hash("admin123!"),
                        is_active=True,
                        is_verified=True,
                        roles=["user", "admin"]
                    )
                    db.add(admin)
                    db.commit()
                    logger.info("Created default admin user")
        
    except SQLAlchemyError as e:
        logger.error(f"Database initialization failed: {e}")
        raise

# Dependency to get DB session
def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.
    Used with FastAPI Depends.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Context manager for DB session
@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager to get database session.
    Used for direct database operations.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def reset_db():
    """Reset the database by dropping and recreating all tables"""
    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        logger.info("Database reset successfully")
    except SQLAlchemyError as e:
        logger.error(f"Database reset failed: {e}")
        raise

def check_db_connection() -> bool:
    """Check if database connection is working"""
    try:
        with get_db_session() as db:
            db.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError as e:
        logger.error(f"Database connection check failed: {e}")
        return False 