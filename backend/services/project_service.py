from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
import uuid
import json
from pathlib import Path

from repositories.project import ProjectRepository, VideoFileRepository
from api.v1.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from services.file_service import FileService
from services.video_service import VideoService
from config import settings
from models.database import User  # Add this import at the top

class ProjectService:
    def __init__(self):
        self.project_repo = ProjectRepository()
        self.video_repo = VideoFileRepository()
        self.file_service = FileService()
        self.video_service = VideoService()
    
    def create_project(self, db: Session, project_data: ProjectCreate) -> ProjectResponse:
        """Create a new project"""
        # DEV ONLY: get the first user as the project owner
        user = db.query(User).first()
        if not user:
            raise HTTPException(status_code=400, detail="No users found in the database.")
        project = self.project_repo.create(
            db,
            name=project_data.name,
            description=project_data.description,
            type=project_data.type.value,
            youtube_url=project_data.youtube_url,
            status="created",
            user_id=user.id  # <-- set user_id here
        )
        return ProjectResponse.from_orm(project)
    
    def get_project(self, db: Session, project_id: str) -> Optional[ProjectResponse]:
        """Get a project by ID"""
        project = self.project_repo.get(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return ProjectResponse.from_orm(project)
    
    def get_projects(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[ProjectResponse]:
        """Get projects with optional filtering"""
        filters = {'status': status} if status else None
        projects = self.project_repo.get_multi(db, skip=skip, limit=limit, filters=filters)
        return [ProjectResponse.from_orm(project) for project in projects]
    
    def update_project(self, db: Session, project_id: str, updates: ProjectUpdate) -> ProjectResponse:
        """Update a project"""
        update_data = updates.dict(exclude_unset=True)
        project = self.project_repo.update(db, project_id, **update_data)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return ProjectResponse.from_orm(project)
    
    def delete_project(self, db: Session, project_id: str) -> bool:
        """Delete a project and its associated files"""
        project = self.project_repo.get(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Delete associated video files
        video_files = self.video_repo.get_by_project(db, project_id)
        for video_file in video_files:
            self.file_service.delete_file(video_file.file_path)
        
        # Delete project
        return self.project_repo.delete(db, project_id)
    
    async def upload_video(self, db: Session, project_id: str, file: UploadFile) -> Dict[str, Any]:
        """Upload video for a project and trigger background processing."""
        # Import the task
        from tasks import process_video

        project = self.project_repo.get(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Validate file
        if not self.file_service.is_valid_video_file(file):
            raise HTTPException(status_code=400, detail="Invalid video file")

        # Save file
        file_id = str(uuid.uuid4())
        file_path = await self.file_service.save_video_file(file, file_id)

        # Create video file record
        self.video_repo.create(
            db,
            project_id=project_id,
            filename=file.filename,
            file_path=str(file_path),
            file_size=file.size
        )

        # Update project status
        self.project_repo.update(db, project_id, status="processing")

        # Dispatch the background task
        task = process_video.delay(str(file_path), "path/to/output.mp4") # Placeholder for output path

        return {
            'file_id': file_id,
            'filename': file.filename,
            'status': 'processing',
            'task_id': task.id
        }
    
    def get_project_stats(self, db: Session) -> Dict[str, Any]:
        """Get project statistics"""
        return self.project_repo.get_stats(db) 