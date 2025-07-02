from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import json

class ProjectType(str, Enum):
    VIDEO_UPLOAD = "video_upload"
    YOUTUBE_URL = "youtube_url"

class ProjectStatus(str, Enum):
    CREATED = "created"
    UPLOADING = "uploading"
    PROCESSING = "processing"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Project name")
    description: Optional[str] = Field(None, max_length=500, description="Project description")
    type: ProjectType = Field(..., description="Project type")
    youtube_url: Optional[str] = Field(None, description="YouTube URL for youtube_url type projects")

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[ProjectStatus] = None

class VideoData(BaseModel):
    file_id: str
    filename: str
    file_size: int
    duration: Optional[float] = None
    resolution: Optional[str] = None
    format: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    type: ProjectType
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    video_data: Optional[VideoData] = None
    youtube_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    clips: Optional[List[Dict[str, Any]]] = None
    analysis_prompt: Optional[str] = None
    analysis_provider: Optional[str] = None

    @field_validator('video_data', mode='before')
    @classmethod
    def parse_video_data(cls, v):
        if isinstance(v, str):
            try:
                data = json.loads(v)
                return VideoData(**data)
            except (json.JSONDecodeError, ValueError):
                return None
        return v

    class Config:
        from_attributes = True

class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
    page: int
    per_page: int 