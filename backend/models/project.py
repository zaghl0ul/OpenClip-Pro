from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    type: str = Field(..., pattern="^(upload|youtube)$")
    youtube_url: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None
    analysis_prompt: Optional[str] = None

class Project(ProjectBase):
    id: str
    status: str
    video_data: Optional[Dict[str, Any]] = None
    analysis_prompt: Optional[str] = None
    analysis_results: Optional[Dict[str, Any]] = None
    file_size: int
    user_id: str
    created_at: datetime
    updated_at: datetime
    clips_count: int = 0
    
    class Config:
        orm_mode = True

class ClipBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    start_time: float = Field(..., ge=0)
    end_time: float = Field(..., gt=0)
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    tags: Optional[List[str]] = []

class ClipCreate(ClipBase):
    project_id: str

class ClipUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    start_time: Optional[float] = Field(None, ge=0)
    end_time: Optional[float] = Field(None, gt=0)
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    tags: Optional[List[str]] = None

class Clip(ClipBase):
    id: str
    duration: float
    export_settings: Optional[Dict[str, Any]] = None
    project_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class AnalysisRequest(BaseModel):
    project_id: str
    prompt: str = Field(..., min_length=1, max_length=2000)
    provider: Optional[str] = Field(default=None, pattern="^(openai|gemini|lmstudio|anthropic)$")
    model: Optional[str] = None

class VideoData(BaseModel):
    file_id: str
    file_path: str
    filename: str
    size: int
    duration: Optional[float] = None
    resolution: Optional[str] = None
    fps: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None
    thumbnails: Optional[List[Dict[str, Any]]] = []
    processing_status: str = "uploaded"
    upload_time: Optional[str] = None
    processed_at: Optional[str] = None 