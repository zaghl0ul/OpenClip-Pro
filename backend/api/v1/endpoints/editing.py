from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import json

from models.database import get_db
from models.project import Project
from repositories.project import ProjectRepository, get_project_repo
from services.video_editor import VideoEditor
from services.ai_analyzer import AIAnalyzer, get_ai_analyzer
from schemas.editing import (
    ClipCreationRequest,
    ClipCreationResponse,
    BatchClipRequest,
    BatchClipResponse,
    SubtitleRequest,
    SubtitleResponse,
    WatermarkRequest,
    WatermarkResponse,
    OptimizationRequest,
    OptimizationResponse
)

router = APIRouter()

def get_video_editor(ai_analyzer: AIAnalyzer = Depends(get_ai_analyzer)) -> VideoEditor:
    """Get video editor service"""
    return VideoEditor(ai_analyzer)

@router.post("/{project_id}/create-clip", response_model=ClipCreationResponse)
async def create_ai_clip(
    project_id: str,
    request: ClipCreationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    project_repo: ProjectRepository = Depends(get_project_repo),
    video_editor: VideoEditor = Depends(get_video_editor)
):
    """Create an AI-powered clip from a video"""
    try:
        # Get project
        project = project_repo.get(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project has video
        video_data = project.get_video_data()
        if not video_data:
            raise HTTPException(status_code=400, detail="Project has no video file")
        
        video_path = video_data.get('file_path')
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=400, detail="Video file not found")
        
        # Create AI clip
        result = await video_editor.create_ai_clip(
            video_path=video_path,
            analysis_prompt=request.prompt,
            preset=request.preset,
            custom_settings=request.custom_settings
        )
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return ClipCreationResponse(
            clip_path=result['clip_path'],
            clip_info=result['clip_info'],
            preset_used=result['preset_used'],
            settings=result['settings'],
            status="completed"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating clip: {str(e)}")

@router.post("/{project_id}/batch-clips", response_model=BatchClipResponse)
async def create_batch_clips(
    project_id: str,
    request: BatchClipRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    project_repo: ProjectRepository = Depends(get_project_repo),
    video_editor: VideoEditor = Depends(get_video_editor)
):
    """Create multiple clips from a video"""
    try:
        # Get project
        project = project_repo.get(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project has video
        video_data = project.get_video_data()
        if not video_data:
            raise HTTPException(status_code=400, detail="Project has no video file")
        
        video_path = video_data.get('file_path')
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=400, detail="Video file not found")
        
        # Create batch clips
        results = await video_editor.batch_create_clips(
            video_path=video_path,
            clip_configs=request.clip_configs
        )
        
        return BatchClipResponse(
            results=results,
            total_clips=len(results),
            successful_clips=len([r for r in results if 'error' not in r]),
            failed_clips=len([r for r in results if 'error' in r])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating batch clips: {str(e)}")

@router.post("/{project_id}/add-subtitles", response_model=SubtitleResponse)
async def add_subtitles(
    project_id: str,
    request: SubtitleRequest,
    db: Session = Depends(get_db),
    project_repo: ProjectRepository = Depends(get_project_repo),
    video_editor: VideoEditor = Depends(get_video_editor)
):
    """Add subtitles to a video"""
    try:
        # Get project
        project = project_repo.get(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project has video
        video_data = project.get_video_data()
        if not video_data:
            raise HTTPException(status_code=400, detail="Project has no video file")
        
        video_path = video_data.get('file_path')
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=400, detail="Video file not found")
        
        # Add subtitles
        output_path = await video_editor.add_subtitles(
            video_path=video_path,
            transcription=request.transcription,
            output_path=request.output_path
        )
        
        return SubtitleResponse(
            output_path=output_path,
            status="completed"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding subtitles: {str(e)}")

@router.post("/{project_id}/add-watermark", response_model=WatermarkResponse)
async def add_watermark(
    project_id: str,
    request: WatermarkRequest,
    db: Session = Depends(get_db),
    project_repo: ProjectRepository = Depends(get_project_repo),
    video_editor: VideoEditor = Depends(get_video_editor)
):
    """Add watermark to a video"""
    try:
        # Get project
        project = project_repo.get(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project has video
        video_data = project.get_video_data()
        if not video_data:
            raise HTTPException(status_code=400, detail="Project has no video file")
        
        video_path = video_data.get('file_path')
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=400, detail="Video file not found")
        
        # Add watermark
        output_path = await video_editor.add_watermark(
            video_path=video_path,
            watermark_text=request.watermark_text,
            output_path=request.output_path
        )
        
        return WatermarkResponse(
            output_path=output_path,
            status="completed"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding watermark: {str(e)}")

@router.post("/{project_id}/optimize", response_model=OptimizationResponse)
async def optimize_for_platform(
    project_id: str,
    request: OptimizationRequest,
    db: Session = Depends(get_db),
    project_repo: ProjectRepository = Depends(get_project_repo),
    video_editor: VideoEditor = Depends(get_video_editor)
):
    """Optimize video for specific platform"""
    try:
        # Get project
        project = project_repo.get(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project has video
        video_data = project.get_video_data()
        if not video_data:
            raise HTTPException(status_code=400, detail="Project has no video file")
        
        video_path = video_data.get('file_path')
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=400, detail="Video file not found")
        
        # Optimize video
        output_path = await video_editor.optimize_for_platform(
            video_path=video_path,
            platform=request.platform
        )
        
        return OptimizationResponse(
            output_path=output_path,
            platform=request.platform,
            status="completed"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error optimizing video: {str(e)}")

@router.get("/{project_id}/editing-presets")
async def get_editing_presets(
    project_id: str,
    db: Session = Depends(get_db),
    project_repo: ProjectRepository = Depends(get_project_repo),
    video_editor: VideoEditor = Depends(get_video_editor)
):
    """Get available editing presets"""
    try:
        # Get project
        project = project_repo.get(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {
            "presets": video_editor.editing_presets,
            "supported_formats": video_editor.supported_output_formats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting presets: {str(e)}")

@router.post("/cleanup-temp-files")
async def cleanup_temp_files(
    max_age_hours: int = 24,
    video_editor: VideoEditor = Depends(get_video_editor)
):
    """Clean up temporary files"""
    try:
        video_editor.cleanup_temp_files(max_age_hours)
        return {"message": "Temp files cleaned up successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cleaning up temp files: {str(e)}") 