"""Simulation configuration endpoints."""

from fastapi import APIRouter, HTTPException, status
from pydantic import ValidationError
from app.schemas.simulation import SimulationConfig
from app.services.simulation_service import SimulationService

router = APIRouter(tags=["Configuration"])


@router.get("/config", response_model=SimulationConfig, summary="Default simulation configuration")
async def get_default_config() -> SimulationConfig:
    """Return the baseline default configuration parameters for the disaster simulation."""
    return SimulationService.get_default_config()


@router.post(
    "/config/validate",
    response_model=SimulationConfig,
    summary="Validate custom simulation configuration",
    responses={
        422: {"description": "Validation error for invalid grid, agent count, or disaster parameters"},
    },
)
async def validate_config(payload: SimulationConfig) -> SimulationConfig:
    """Accept and validate a simulation configuration against constraints.
    
    Ensures dimensions, agent thresholds, and tick intervals satisfy operational bounds.
    """
    return payload
