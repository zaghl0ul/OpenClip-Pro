from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from models.database import get_db, Setting
from repositories.base import BaseRepository
from api.v1.schemas.settings import APIKeyStorage, SettingsResponse, TestAPIKeyResponse
from services.ai_analyzer import AIAnalyzer
from config import settings

router = APIRouter()

def get_settings_repo():
    return BaseRepository(Setting)

def get_ai_analyzer():
    return AIAnalyzer()

@router.get("/", response_model=SettingsResponse)
async def get_settings(
    db: Session = Depends(get_db),
    settings_repo: BaseRepository = Depends(get_settings_repo)
):
    """Get application settings"""
    try:
        # Get provider status
        providers = {}
        for provider in ['openai', 'gemini', 'anthropic', 'lmstudio']:
            key_setting = settings_repo.get(db, f"{provider}_api_key")
            providers[provider] = key_setting is not None and key_setting.value is not None
        
        # Get LMStudio status
        lmstudio_status = {"available": False, "models": []}
        if providers.get('lmstudio'):
            try:
                ai_analyzer = AIAnalyzer()
                lmstudio_status = await ai_analyzer.check_lmstudio_status()
            except Exception:
                pass
        
        # Get rate limits
        rate_limits = {
            "per_minute": settings.RATE_LIMIT_PER_MINUTE,
            "per_hour": settings.RATE_LIMIT_PER_MINUTE * 60,
            "per_day": settings.RATE_LIMIT_PER_MINUTE * 60 * 24
        }
        
        # Get storage info
        from services.file_service import FileService
        file_service = FileService()
        storage_info = file_service.get_storage_info()
        
        return SettingsResponse(
            providers=providers,
            lmstudio_status=lmstudio_status,
            rate_limits=rate_limits,
            storage_info=storage_info
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving settings: {str(e)}")

@router.post("/api-keys")
async def store_api_key(
    request: APIKeyStorage,
    db: Session = Depends(get_db),
    settings_repo: BaseRepository = Depends(get_settings_repo)
):
    """Store API key for a provider"""
    try:
        # Encrypt API key (in production, use proper encryption)
        encrypted_key = request.api_key  # TODO: Implement encryption
        
        # Store or update key
        existing = settings_repo.get(db, f"{request.provider.value}_api_key")
        if existing:
            settings_repo.update(db, existing.id, value=encrypted_key, encrypted=True)
        else:
            settings_repo.create(
                db,
                key=f"{request.provider.value}_api_key",
                value=encrypted_key,
                encrypted=True
            )
        
        return {"message": f"API key stored successfully for {request.provider.value}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing API key: {str(e)}")

@router.post("/test-api-key", response_model=TestAPIKeyResponse)
async def test_api_key(
    request: APIKeyStorage,
    ai_analyzer: AIAnalyzer = Depends(get_ai_analyzer)
):
    """Test API key for a provider"""
    try:
        success, message = await ai_analyzer.test_api_key(request.provider.value, request.api_key)
        
        return TestAPIKeyResponse(
            success=success,
            message=message,
            provider=request.provider.value
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing API key: {str(e)}")

@router.delete("/api-keys/{provider}")
async def delete_api_key(
    provider: str,
    db: Session = Depends(get_db),
    settings_repo: BaseRepository = Depends(get_settings_repo)
):
    """Delete API key for a provider"""
    try:
        key_setting = settings_repo.get(db, f"{provider}_api_key")
        if key_setting:
            settings_repo.delete(db, key_setting.id)
            return {"message": f"API key deleted successfully for {provider}"}
        else:
            raise HTTPException(status_code=404, detail=f"No API key found for {provider}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting API key: {str(e)}")

@router.get("/providers")
async def get_providers():
    """Get available AI providers"""
    return {
        "providers": [
            {
                "id": "openai",
                "name": "OpenAI",
                "description": "GPT-4 Vision and other OpenAI models",
                "supports_vision": True
            },
            {
                "id": "gemini",
                "name": "Google Gemini",
                "description": "Gemini Pro Vision model",
                "supports_vision": True
            },
            {
                "id": "anthropic",
                "name": "Anthropic Claude",
                "description": "Claude 3 Vision model",
                "supports_vision": True
            },
            {
                "id": "lmstudio",
                "name": "LM Studio",
                "description": "Local models via LM Studio",
                "supports_vision": True
            }
        ]
    }

@router.get("/lmstudio/status")
async def get_lmstudio_status(
    ai_analyzer: AIAnalyzer = Depends(get_ai_analyzer)
):
    """Get LM Studio status"""
    try:
        status = await ai_analyzer.check_lmstudio_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking LM Studio status: {str(e)}") 