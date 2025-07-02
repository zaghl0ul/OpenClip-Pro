from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class BetaSignup(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    company: Optional[str] = Field(None, max_length=100, description="Company name")
    useCase: str = Field(..., min_length=1, max_length=500, description="Use case description")
    experience: Optional[str] = Field(None, max_length=200, description="Experience level")
    interests: Optional[List[str]] = Field(default_factory=list, description="Areas of interest")
    signupDate: str = Field(..., description="Signup date")
    source: str = Field(..., description="How they found us")

class BetaSignupResponse(BaseModel):
    id: str
    name: str
    email: str
    company: Optional[str] = None
    useCase: str
    experience: Optional[str] = None
    interests: List[str]
    signupDate: str
    source: str
    created_at: datetime

    class Config:
        from_attributes = True

class Feedback(BaseModel):
    type: str = Field(..., description="Feedback type")
    rating: int = Field(..., ge=1, le=5, description="Rating 1-5")
    message: str = Field(..., min_length=1, max_length=1000, description="Feedback message")
    page: str = Field(..., description="Page where feedback was given")
    userAgent: Optional[str] = Field(None, description="User agent string")
    timestamp: Optional[str] = Field(None, description="Timestamp")

class FeedbackResponse(BaseModel):
    id: str
    type: str
    rating: int
    message: str
    page: str
    userAgent: Optional[str] = None
    timestamp: str
    created_at: datetime

    class Config:
        from_attributes = True 