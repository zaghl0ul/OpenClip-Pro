import aiofiles
import os
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
from config import settings

class FileService:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.videos_dir = Path(settings.VIDEOS_DIR)
        self.thumbnails_dir = Path(settings.THUMBNAILS_DIR)
        
        # Ensure directories exist
        for directory in [self.upload_dir, self.videos_dir, self.thumbnails_dir]:
            directory.mkdir(parents=True, exist_ok=True)
    
    def is_valid_video_file(self, file: UploadFile) -> bool:
        """Validate if file is a valid video file"""
        if not file.filename:
            return False
        
        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in settings.ALLOWED_VIDEO_EXTENSIONS:
            return False
        
        # Check file size
        if file.size and file.size > settings.MAX_FILE_SIZE:
            return False
        
        return True
    
    async def save_video_file(self, file: UploadFile, file_id: str) -> Path:
        """Save uploaded video file"""
        if not self.is_valid_video_file(file):
            raise HTTPException(status_code=400, detail="Invalid video file")
        
        # Generate filename
        file_ext = Path(file.filename).suffix.lower()
        filename = f"{file_id}{file_ext}"
        file_path = self.videos_dir / filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return file_path
    
    def get_file_path(self, file_id: str) -> Optional[Path]:
        """Get file path by file ID"""
        for ext in settings.ALLOWED_VIDEO_EXTENSIONS:
            file_path = self.videos_dir / f"{file_id}{ext}"
            if file_path.exists():
                return file_path
        return None
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a file"""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                return True
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
        return False
    
    def get_file_size(self, file_path: str) -> Optional[int]:
        """Get file size"""
        try:
            path = Path(file_path)
            if path.exists():
                return path.stat().st_size
        except Exception:
            pass
        return None
    
    def file_exists(self, file_path: str) -> bool:
        """Check if file exists"""
        return Path(file_path).exists()
    
    def get_storage_info(self) -> dict:
        """Get storage information"""
        total_size = 0
        file_count = 0
        
        for file_path in self.videos_dir.rglob("*"):
            if file_path.is_file():
                total_size += file_path.stat().st_size
                file_count += 1
        
        return {
            "total_size": total_size,
            "file_count": file_count,
            "upload_dir": str(self.upload_dir),
            "videos_dir": str(self.videos_dir),
            "thumbnails_dir": str(self.thumbnails_dir)
        } 