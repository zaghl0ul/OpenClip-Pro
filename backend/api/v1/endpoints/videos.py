from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pathlib import Path
import os

from models.database import get_db
from services.file_service import FileService
from services.video_service import VideoService
from config import settings

router = APIRouter()

def get_file_service():
    return FileService()

def get_video_service():
    return VideoService()

@router.get("/{file_id}/stream")
async def stream_video(
    file_id: str,
    request: Request,
    file_service: FileService = Depends(get_file_service)
):
    """Stream video file with range support"""
    try:
        file_path = file_service.get_file_path(file_id)
        if not file_path or not file_path.exists():
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Get file size
        file_size = file_path.stat().st_size
        
        # Handle range requests
        range_header = request.headers.get('range')
        if range_header:
            try:
                range_start, range_end = range_header.replace('bytes=', '').split('-')
                range_start = int(range_start)
                range_end = int(range_end) if range_end else file_size - 1
                
                if range_start >= file_size:
                    raise HTTPException(status_code=416, detail="Range not satisfiable")
                
                content_length = range_end - range_start + 1
                
                def read_file_chunk():
                    with open(file_path, 'rb') as f:
                        f.seek(range_start)
                        remaining = content_length
                        while remaining > 0:
                            chunk_size = min(8192, remaining)
                            chunk = f.read(chunk_size)
                            if not chunk:
                                break
                            yield chunk
                            remaining -= len(chunk)
                
                headers = {
                    'Content-Range': f'bytes {range_start}-{range_end}/{file_size}',
                    'Accept-Ranges': 'bytes',
                    'Content-Length': str(content_length),
                    'Content-Type': 'video/mp4'
                }
                
                return StreamingResponse(
                    read_file_chunk(),
                    headers=headers,
                    status_code=206
                )
                
            except ValueError:
                pass
        
        # Full file response
        return FileResponse(
            path=file_path,
            media_type='video/mp4',
            headers={'Accept-Ranges': 'bytes'}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error streaming video: {str(e)}")

@router.get("/{file_id}/download")
async def download_video(
    file_id: str,
    file_service: FileService = Depends(get_file_service)
):
    """Download video file"""
    try:
        file_path = file_service.get_file_path(file_id)
        if not file_path or not file_path.exists():
            raise HTTPException(status_code=404, detail="Video file not found")
        
        return FileResponse(
            path=file_path,
            media_type='application/octet-stream',
            filename=file_path.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading video: {str(e)}")

@router.post("/{file_id}/thumbnail")
async def create_thumbnail(
    file_id: str,
    time_offset: float = 5.0,
    file_service: FileService = Depends(get_file_service),
    video_service: VideoService = Depends(get_video_service)
):
    """Create thumbnail for video"""
    try:
        file_path = file_service.get_file_path(file_id)
        if not file_path or not file_path.exists():
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Create thumbnail path
        thumb_filename = f"thumb_{file_id}.jpg"
        thumb_path = Path(settings.THUMBNAILS_DIR) / thumb_filename
        
        # Create thumbnail
        success = await video_service.create_thumbnail(file_path, thumb_path, time_offset)
        
        if success:
            return {
                "message": "Thumbnail created successfully",
                "thumbnail_url": f"/uploads/thumbnails/{thumb_filename}"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create thumbnail")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating thumbnail: {str(e)}")

@router.get("/{file_id}/thumbnail")
async def get_thumbnail(
    file_id: str,
    file_service: FileService = Depends(get_file_service)
):
    """Get video thumbnail"""
    try:
        thumb_filename = f"thumb_{file_id}.jpg"
        thumb_path = Path(settings.THUMBNAILS_DIR) / thumb_filename
        
        if not thumb_path.exists():
            raise HTTPException(status_code=404, detail="Thumbnail not found")
        
        return FileResponse(
            path=thumb_path,
            media_type='image/jpeg'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving thumbnail: {str(e)}")

@router.get("/{file_id}/metadata")
async def get_video_metadata(
    file_id: str,
    file_service: FileService = Depends(get_file_service),
    video_service: VideoService = Depends(get_video_service)
):
    """Get video metadata"""
    try:
        file_path = file_service.get_file_path(file_id)
        if not file_path or not file_path.exists():
            raise HTTPException(status_code=404, detail="Video file not found")
        
        metadata = await video_service.get_video_metadata(file_path)
        return metadata
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving metadata: {str(e)}") 