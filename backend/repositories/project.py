from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from repositories.base import BaseRepository
from models.database import Project, VideoFile, Analysis

class ProjectRepository(BaseRepository[Project]):
    def __init__(self):
        super().__init__(Project)
    
    def get_by_status(self, db: Session, status: str) -> List[Project]:
        """Get projects by status"""
        return db.query(Project).filter(Project.status == status).all()
    
    def get_recent(self, db: Session, limit: int = 10) -> List[Project]:
        """Get recent projects"""
        return db.query(Project).order_by(desc(Project.created_at)).limit(limit).all()
    
    def get_with_video_files(self, db: Session, project_id: str) -> Optional[Project]:
        """Get project with video files"""
        return db.query(Project).filter(Project.id == project_id).first()
    
    def get_with_analyses(self, db: Session, project_id: str) -> Optional[Project]:
        """Get project with analyses"""
        return db.query(Project).filter(Project.id == project_id).first()
    
    def update_status(self, db: Session, project_id: str, status: str) -> Optional[Project]:
        """Update project status"""
        return self.update(db, project_id, status=status)
    
    def get_stats(self, db: Session) -> Dict[str, Any]:
        """Get project statistics"""
        total = self.count(db)
        by_status = {}
        for status in ['created', 'uploading', 'processing', 'analyzing', 'completed', 'failed']:
            by_status[status] = self.count(db, {'status': status})
        
        return {
            'total': total,
            'by_status': by_status
        }

class VideoFileRepository(BaseRepository[VideoFile]):
    def __init__(self):
        super().__init__(VideoFile)
    
    def get_by_project(self, db: Session, project_id: str) -> List[VideoFile]:
        """Get video files by project"""
        return db.query(VideoFile).filter(VideoFile.project_id == project_id).all()
    
    def get_by_filename(self, db: Session, filename: str) -> Optional[VideoFile]:
        """Get video file by filename"""
        return db.query(VideoFile).filter(VideoFile.filename == filename).first()

class AnalysisRepository(BaseRepository[Analysis]):
    def __init__(self):
        super().__init__(Analysis)
    
    def get_by_project(self, db: Session, project_id: str) -> List[Analysis]:
        """Get analyses by project"""
        return db.query(Analysis).filter(Analysis.project_id == project_id).all()
    
    def get_by_status(self, db: Session, status: str) -> List[Analysis]:
        """Get analyses by status"""
        return db.query(Analysis).filter(Analysis.status == status).all()
    
    def update_status(self, db: Session, analysis_id: str, status: str) -> Optional[Analysis]:
        """Update analysis status"""
        return self.update(db, analysis_id, status=status) 