from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from .database import User, Project, Clip, Setting, AuditLog

class UserRepository:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def create_user(db: Session, user_data: Dict[str, Any]) -> User:
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_user(db: Session, user_id: str, updates: Dict[str, Any]) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            for key, value in updates.items():
                setattr(user, key, value)
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def update_storage_used(db: Session, user_id: str, delta: int) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.storage_used += delta
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
        return user

class ProjectRepository:
    @staticmethod
    def get_project(db: Session, project_id: str) -> Optional[Project]:
        return db.query(Project).filter(Project.id == project_id).first()
    
    @staticmethod
    def get_user_projects(db: Session, user_id: str) -> List[Project]:
        return db.query(Project).filter(
            Project.user_id == user_id
        ).order_by(desc(Project.created_at)).all()
    
    @staticmethod
    def create_project(db: Session, project_data: Dict[str, Any]) -> Project:
        project = Project(**project_data)
        db.add(project)
        db.commit()
        db.refresh(project)
        return project
    
    @staticmethod
    def update_project(db: Session, project_id: str, updates: Dict[str, Any]) -> Optional[Project]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            for key, value in updates.items():
                setattr(project, key, value)
            project.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(project)
        return project
    
    @staticmethod
    def delete_project(db: Session, project_id: str) -> bool:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            db.delete(project)
            db.commit()
            return True
        return False
    
    @staticmethod
    def search_projects(db: Session, user_id: str, query: str) -> List[Project]:
        return db.query(Project).filter(
            and_(
                Project.user_id == user_id,
                or_(
                    Project.name.contains(query),
                    Project.description.contains(query)
                )
            )
        ).order_by(desc(Project.created_at)).all()

class ClipRepository:
    @staticmethod
    def get_clip(db: Session, clip_id: str) -> Optional[Clip]:
        return db.query(Clip).filter(Clip.id == clip_id).first()
    
    @staticmethod
    def get_project_clips(db: Session, project_id: str) -> List[Clip]:
        return db.query(Clip).filter(
            Clip.project_id == project_id
        ).order_by(Clip.start_time).all()
    
    @staticmethod
    def create_clip(db: Session, clip_data: Dict[str, Any]) -> Clip:
        clip = Clip(**clip_data)
        db.add(clip)
        db.commit()
        db.refresh(clip)
        return clip
    
    @staticmethod
    def update_clip(db: Session, clip_id: str, updates: Dict[str, Any]) -> Optional[Clip]:
        clip = db.query(Clip).filter(Clip.id == clip_id).first()
        if clip:
            for key, value in updates.items():
                setattr(clip, key, value)
            clip.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(clip)
        return clip
    
    @staticmethod
    def delete_clip(db: Session, clip_id: str) -> bool:
        clip = db.query(Clip).filter(Clip.id == clip_id).first()
        if clip:
            db.delete(clip)
            db.commit()
            return True
        return False

class SettingsRepository:
    @staticmethod
    def get_setting(db: Session, category: str, key: str, user_id: str = None) -> Optional[Setting]:
        query = db.query(Setting).filter(
            Setting.category == category,
            Setting.key == key
        )
        if user_id:
            query = query.filter(Setting.user_id == user_id)
        return query.first()
    
    @staticmethod
    def get_user_settings(db: Session, user_id: str) -> List[Setting]:
        return db.query(Setting).filter(Setting.user_id == user_id).all()
    
    @staticmethod
    def create_or_update_setting(db: Session, category: str, key: str, value: Any, user_id: str, is_encrypted: bool = False) -> Setting:
        setting = db.query(Setting).filter(
            Setting.category == category,
            Setting.key == key,
            Setting.user_id == user_id
        ).first()
        
        if setting:
            setting.value = json.dumps(value) if not isinstance(value, str) else value
            setting.is_encrypted = is_encrypted
            setting.updated_at = datetime.utcnow()
        else:
            setting = Setting(
                category=category,
                key=key,
                value=json.dumps(value) if not isinstance(value, str) else value,
                is_encrypted=is_encrypted,
                user_id=user_id
            )
            db.add(setting)
        
        db.commit()
        db.refresh(setting)
        return setting
    
    @staticmethod
    def delete_setting(db: Session, category: str, key: str, user_id: str) -> bool:
        setting = db.query(Setting).filter(
            Setting.category == category,
            Setting.key == key,
            Setting.user_id == user_id
        ).first()
        if setting:
            db.delete(setting)
            db.commit()
            return True
        return False

class AuditLogRepository:
    @staticmethod
    def create_log(db: Session, log_data: Dict[str, Any]) -> AuditLog:
        audit_log = AuditLog(**log_data)
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log
    
    @staticmethod
    def get_user_logs(db: Session, user_id: str, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).filter(
            AuditLog.user_id == user_id
        ).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    
    @staticmethod
    def get_recent_logs(db: Session, limit: int = 1000) -> List[AuditLog]:
        return db.query(AuditLog).order_by(
            desc(AuditLog.timestamp)
        ).limit(limit).all() 