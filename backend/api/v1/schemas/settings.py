from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from enum import Enum

class ProviderType(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"
    LMSTUDIO = "lmstudio"

class APIKeyStorage(BaseModel):
    provider: ProviderType = Field(..., description="AI provider")
    api_key: str = Field(..., min_length=1, description="API key for the provider")

class SettingsResponse(BaseModel):
    providers: Dict[str, bool]
    lmstudio_status: Dict[str, Any]
    rate_limits: Dict[str, Any]
    storage_info: Dict[str, Any]

class TestAPIKeyResponse(BaseModel):
    success: bool
    message: str
    provider: str 