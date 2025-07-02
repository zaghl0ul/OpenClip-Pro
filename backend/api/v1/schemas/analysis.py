from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class AnalysisProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"
    LMSTUDIO = "lmstudio"

class AnalysisRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000, description="Analysis prompt")
    provider: AnalysisProvider = Field(AnalysisProvider.OPENAI, description="AI provider to use")
    max_frames: int = Field(10, ge=1, le=50, description="Maximum number of frames to analyze")

class AnalysisResult(BaseModel):
    id: str
    project_id: str
    prompt: str
    provider: AnalysisProvider
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    processing_time: Optional[float] = None

    class Config:
        from_attributes = True

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    message: str
    estimated_time: Optional[int] = None 