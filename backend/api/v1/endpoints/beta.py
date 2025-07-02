from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.database import get_db, BetaSignup
from repositories.base import BaseRepository
from api.v1.schemas.beta import BetaSignup as BetaSignupSchema, BetaSignupResponse
from services.email_service import EmailService

router = APIRouter()

def get_beta_repo():
    return BaseRepository(BetaSignup)

def get_email_service():
    return EmailService()

@router.post("/signup", response_model=BetaSignupResponse)
async def beta_signup(
    signup_data: BetaSignupSchema,
    db: Session = Depends(get_db),
    beta_repo: BaseRepository = Depends(get_beta_repo),
    email_service: EmailService = Depends(get_email_service)
):
    """Submit beta signup"""
    try:
        # Check if email already exists
        existing = beta_repo.get_multi(db, filters={"email": signup_data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create signup record
        signup = beta_repo.create(
            db,
            name=signup_data.name,
            email=signup_data.email,
            company=signup_data.company,
            use_case=signup_data.useCase,
            experience=signup_data.experience,
            interests=signup_data.interests,
            signup_date=signup_data.signupDate,
            source=signup_data.source
        )
        
        # Send welcome email
        try:
            await email_service.send_beta_welcome_email(signup_data.email, signup_data.name)
        except Exception as e:
            # Log error but don't fail the signup
            print(f"Error sending welcome email: {e}")
        
        return BetaSignupResponse.from_orm(signup)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting signup: {str(e)}")

@router.get("/signups", response_model=List[BetaSignupResponse])
async def get_beta_signups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    beta_repo: BaseRepository = Depends(get_beta_repo)
):
    """Get beta signups (admin only)"""
    try:
        signups = beta_repo.get_multi(db, skip=skip, limit=limit)
        return [BetaSignupResponse.from_orm(signup) for signup in signups]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving signups: {str(e)}")

@router.get("/stats")
async def get_beta_stats(
    db: Session = Depends(get_db),
    beta_repo: BaseRepository = Depends(get_beta_repo)
):
    """Get beta signup statistics"""
    try:
        total = beta_repo.count(db)
        
        # Get signups by source
        sources = {}
        signups = beta_repo.get_multi(db, limit=1000)  # Get all for stats
        for signup in signups:
            source = signup.source
            sources[source] = sources.get(source, 0) + 1
        
        return {
            "total_signups": total,
            "by_source": sources,
            "recent_signups": len([s for s in signups if s.created_at])  # TODO: Add date filtering
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}") 