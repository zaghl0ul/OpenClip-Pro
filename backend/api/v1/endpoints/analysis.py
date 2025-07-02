from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from models.database import get_db
from services.ai_analyzer import AIAnalyzer
from repositories.project import ProjectRepository, AnalysisRepository
from api.v1.schemas.analysis import AnalysisRequest, AnalysisResponse, AnalysisResult

router = APIRouter()

def get_ai_analyzer():
    return AIAnalyzer()

def get_project_repo():
    return ProjectRepository()

def get_analysis_repo():
    return AnalysisRepository()

@router.post("/{project_id}/analyze", response_model=AnalysisResponse)
async def analyze_video(
    project_id: str,
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    project_repo: ProjectRepository = Depends(get_project_repo),
    analysis_repo: AnalysisRepository = Depends(get_analysis_repo),
    ai_analyzer: AIAnalyzer = Depends(get_ai_analyzer)
):
    """Start video analysis"""
    try:
        # Get project
        project = project_repo.get(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project has video
        video_data = project.get_video_data()
        if not video_data:
            raise HTTPException(status_code=400, detail="Project has no video file")
        
        # Create analysis record
        analysis = analysis_repo.create(
            db,
            project_id=project_id,
            prompt=request.prompt,
            provider=request.provider.value,
            status="pending"
        )
        
        # Start background analysis
        background_tasks.add_task(
            ai_analyzer.analyze_video,
            video_data['file_id'],
            [request.provider.value],
            {'prompt': request.prompt}
        )
        
        return AnalysisResponse(
            analysis_id=str(analysis.id),
            status="pending",
            message="Analysis started successfully",
            estimated_time=30  # Rough estimate
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting analysis: {str(e)}")

@router.get("/{project_id}/results", response_model=List[AnalysisResult])
async def get_analysis_results(
    project_id: str,
    db: Session = Depends(get_db),
    analysis_repo: AnalysisRepository = Depends(get_analysis_repo)
):
    """Get analysis results for a project"""
    try:
        analyses = analysis_repo.get_by_project(db, project_id)
        return [AnalysisResult.from_orm(analysis) for analysis in analyses]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analysis results: {str(e)}")

@router.get("/results/{analysis_id}", response_model=AnalysisResult)
async def get_analysis_result(
    analysis_id: str,
    db: Session = Depends(get_db),
    analysis_repo: AnalysisRepository = Depends(get_analysis_repo)
):
    """Get specific analysis result"""
    try:
        analysis = analysis_repo.get(db, analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return AnalysisResult.from_orm(analysis)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analysis: {str(e)}")

@router.delete("/results/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    analysis_repo: AnalysisRepository = Depends(get_analysis_repo)
):
    """Delete analysis result"""
    try:
        success = analysis_repo.delete(db, analysis_id)
        if success:
            return {"message": "Analysis deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Analysis not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting analysis: {str(e)}") 