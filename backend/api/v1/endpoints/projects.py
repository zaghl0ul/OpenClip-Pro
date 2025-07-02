from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from celery.result import AsyncResult
from celery_app import celery_app

from models.database import get_db
from services.project_service import ProjectService
from api.v1.schemas.project import (
    ProjectCreate, 
    ProjectUpdate, 
    ProjectResponse, 
    ProjectListResponse
)

router = APIRouter()

def get_project_service():
    return ProjectService()

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get all projects with optional filtering"""
    try:
        projects = project_service.get_projects(db, skip=skip, limit=limit, status=status)
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving projects: {str(e)}")

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    project_service: ProjectService = Depends(get_project_service)
):
    """Create a new project"""
    try:
        project = project_service.create_project(db, project_data)
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get a specific project by ID"""
    try:
        project = project_service.get_project(db, project_id)
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving project: {str(e)}")

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    updates: ProjectUpdate,
    db: Session = Depends(get_db),
    project_service: ProjectService = Depends(get_project_service)
):
    """Update a project"""
    try:
        project = project_service.update_project(db, project_id, updates)
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating project: {str(e)}")

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    project_service: ProjectService = Depends(get_project_service)
):
    """Delete a project"""
    try:
        success = project_service.delete_project(db, project_id)
        if success:
            return {"message": "Project deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Project not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting project: {str(e)}")

@router.post("/{project_id}/upload")
async def upload_video(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    project_service: ProjectService = Depends(get_project_service)
):
    """Upload video for a project"""
    try:
        result = await project_service.upload_video(db, project_id, file)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading video: {str(e)}")

@router.get("/stats/summary")
async def get_project_stats(
    db: Session = Depends(get_db),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get project statistics"""
    try:
        stats = project_service.get_project_stats(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}") @router.get("/{project_id}/task/{task_id}")
async def get_task_status(project_id: str, task_id: str):
    """Get the status of a background task."""
    task_result = AsyncResult(task_id, app=celery_app)
    result = {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result,
    }
    return result