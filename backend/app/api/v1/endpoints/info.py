"""Application metadata and project info endpoint."""

from fastapi import APIRouter
from app.core.config import settings
from app.schemas.info import AppInfoResponse
from app.schemas.simulation import DisasterType

router = APIRouter(tags=["System Info"])


@router.get("/info", response_model=AppInfoResponse, summary="Application Information")
async def get_app_info() -> AppInfoResponse:
    """Return application name, current active phase, description, and supported scenarios."""
    return AppInfoResponse(
        name=settings.app_name,
        phase=settings.phase,
        version=settings.app_version,
        description=settings.description,
        supported_disasters=[d.value for d in DisasterType],
    )
