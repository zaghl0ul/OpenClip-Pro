from fastapi import APIRouter

from api.v1.endpoints import projects, videos, analysis, settings, auth, beta, feedback

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(videos.router, prefix="/videos", tags=["videos"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(beta.router, prefix="/beta", tags=["beta"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"]) 