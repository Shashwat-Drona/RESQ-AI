"""Health check endpoint."""

from fastapi import APIRouter
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Backend health status")
async def get_health() -> HealthResponse:
    """Return operational health status, service identifier, and server timestamp."""
    return HealthResponse(
        status="ok",
        service=settings.app_name.lower() + "-backend",
        environment=settings.environment,
    )
