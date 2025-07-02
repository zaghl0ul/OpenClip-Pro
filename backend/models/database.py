from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Boolean, ForeignKey, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import json
import uuid
from typing import Dict, Any, Optional

from config import settings  # type: ignore

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    storage_used = Column(Integer, default=0)  # bytes
    roles = Column(JSON, default=list)  # ["user", "admin", "pro"]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("Setting", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "storage_used": self.storage_used,
            "roles": self.roles,
            "created_at": self.created_at.isoformat() if self.created_at is not None else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at is not None else None
        }

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    type = Column(String, nullable=False)
    status = Column(String, default="created")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    video_data = Column(Text)  # JSON string
    youtube_url = Column(String)
    file_size = Column(Integer)
    thumbnail_url = Column(String)
    clips = Column(Text)  # JSON string
    analysis_prompt = Column(Text)
    analysis_provider = Column(String)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="projects")
    video_files = relationship("VideoFile", back_populates="project", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="project", cascade="all, delete-orphan")
    
    def get_video_data(self) -> Optional[Dict[str, Any]]:
        """Get parsed video data"""
        if self.video_data is not None and isinstance(self.video_data, str):
            return json.loads(self.video_data)
        return None
    
    def set_video_data(self, data: Dict[str, Any]):
        """Set video data as JSON string"""
        self.video_data = json.dumps(data)
    
    def get_clips(self) -> Optional[Dict[str, Any]]:
        """Get parsed clips data"""
        if self.clips is not None and isinstance(self.clips, str):
            return json.loads(self.clips)
        return None
    
    def set_clips(self, data: Dict[str, Any]):
        """Set clips data as JSON string"""
        self.clips = json.dumps(data)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "status": self.status,
            "youtube_url": self.youtube_url,
            "video_data": self.video_data,
            "analysis_prompt": self.analysis_prompt,
            "analysis_provider": self.analysis_provider,
            "file_size": self.file_size,
            "thumbnail_url": self.thumbnail_url,
            "clips": self.clips,
            "created_at": self.created_at.isoformat() if self.created_at is not None else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at is not None else None,
            "video_files_count": len(self.video_files) if self.video_files else 0,
            "analyses_count": len(self.analyses) if self.analyses else 0
        }

class VideoFile(Base):
    __tablename__ = "video_files"
    
    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    upload_time = Column(DateTime, default=func.now())
    video_metadata = Column(Text)  # JSON string
    
    # Relationships
    project = relationship("Project", back_populates="video_files")
    
    def get_metadata(self) -> Optional[Dict[str, Any]]:
        """Get parsed metadata"""
        if self.video_metadata is not None and isinstance(self.video_metadata, str):
            return json.loads(self.video_metadata)
        return None
    
    def set_metadata(self, data: Dict[str, Any]):
        """Set metadata as JSON string"""
        self.video_metadata = json.dumps(data)

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"))
    prompt = Column(Text, nullable=False)
    provider = Column(String, nullable=False)
    status = Column(String, default="pending")
    result = Column(Text)  # JSON string
    error = Column(Text)
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)
    processing_time = Column(Float)
    
    # Relationships
    project = relationship("Project", back_populates="analyses")
    
    def get_result(self) -> Optional[Dict[str, Any]]:
        """Get parsed result"""
        if self.result is not None and isinstance(self.result, str):
            return json.loads(self.result)
        return None
    
    def set_result(self, data: Dict[str, Any]):
        """Set result as JSON string"""
        self.result = json.dumps(data)

class BetaSignup(Base):
    __tablename__ = "beta_signups"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    company = Column(String)
    use_case = Column(Text, nullable=False)
    experience = Column(String)
    interests = Column(Text)  # JSON string
    signup_date = Column(String, nullable=False)
    source = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    def get_interests(self) -> list:
        """Get parsed interests"""
        if self.interests is not None and isinstance(self.interests, str):
            return json.loads(self.interests)
        return []
    
    def set_interests(self, interests: list):
        """Set interests as JSON string"""
        self.interests = json.dumps(interests)

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    message = Column(Text, nullable=False)
    page = Column(String, nullable=False)
    user_agent = Column(String)
    timestamp = Column(String)
    created_at = Column(DateTime, default=func.now())

class Setting(Base):
    __tablename__ = "settings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    category = Column(String, nullable=False)  # api_keys, model_settings, app_settings
    key = Column(String, nullable=False)
    value = Column(Text)  # JSON string or encrypted value
    is_encrypted = Column(Boolean, default=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="settings")
    
    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "key": self.key,
            "value": self.value,
            "is_encrypted": self.is_encrypted,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at is not None and not isinstance(self.created_at, Column) else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at is not None and not isinstance(self.updated_at, Column) else None
        }

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    ip_address = Column(String)
    user_agent = Column(Text)
    request_method = Column(String)
    request_path = Column(String)
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action": self.action,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "request_method": self.request_method,
            "request_path": self.request_path,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp is not None and not isinstance(self.timestamp, Column) else None
        }

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 