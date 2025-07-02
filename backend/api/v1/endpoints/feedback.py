from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.database import get_db, Feedback
from repositories.base import BaseRepository
from api.v1.schemas.beta import Feedback as FeedbackSchema, FeedbackResponse
from services.email_service import EmailService

router = APIRouter()

def get_feedback_repo():
    return BaseRepository(Feedback)

def get_email_service():
    return EmailService()

@router.post("/", response_model=FeedbackResponse)
async def submit_feedback(
    feedback_data: FeedbackSchema,
    db: Session = Depends(get_db),
    feedback_repo: BaseRepository = Depends(get_feedback_repo),
    email_service: EmailService = Depends(get_email_service)
):
    """Submit feedback"""
    try:
        # Create feedback record
        feedback = feedback_repo.create(
            db,
            type=feedback_data.type,
            rating=feedback_data.rating,
            message=feedback_data.message,
            page=feedback_data.page,
            user_agent=feedback_data.userAgent,
            timestamp=feedback_data.timestamp or ""
        )
        
        # Send notification email
        try:
            await email_service.send_feedback_notification(feedback_data)
        except Exception as e:
            # Log error but don't fail the feedback submission
            print(f"Error sending feedback notification: {e}")
        
        return FeedbackResponse.from_orm(feedback)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting feedback: {str(e)}")

@router.get("/", response_model=List[FeedbackResponse])
async def get_feedback(
    skip: int = 0,
    limit: int = 100,
    feedback_type: str = None,
    db: Session = Depends(get_db),
    feedback_repo: BaseRepository = Depends(get_feedback_repo)
):
    """Get feedback (admin only)"""
    try:
        filters = {"type": feedback_type} if feedback_type else None
        feedback_list = feedback_repo.get_multi(db, skip=skip, limit=limit, filters=filters)
        return [FeedbackResponse.from_orm(feedback) for feedback in feedback_list]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving feedback: {str(e)}")

@router.get("/stats")
async def get_feedback_stats(
    db: Session = Depends(get_db),
    feedback_repo: BaseRepository = Depends(get_feedback_repo)
):
    """Get feedback statistics"""
    try:
        total = feedback_repo.count(db)
        
        # Get feedback by type
        types = {}
        feedback_list = feedback_repo.get_multi(db, limit=1000)  # Get all for stats
        for feedback in feedback_list:
            feedback_type = feedback.type
            types[feedback_type] = types.get(feedback_type, 0) + 1
        
        # Calculate average rating
        total_rating = sum(f.rating for f in feedback_list if f.rating)
        avg_rating = total_rating / len(feedback_list) if feedback_list else 0
        
        # Get rating distribution
        rating_dist = {}
        for feedback in feedback_list:
            rating = feedback.rating
            rating_dist[rating] = rating_dist.get(rating, 0) + 1
        
        return {
            "total_feedback": total,
            "by_type": types,
            "average_rating": round(avg_rating, 2),
            "rating_distribution": rating_dist
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}") 