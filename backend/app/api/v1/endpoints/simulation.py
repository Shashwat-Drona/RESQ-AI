"""Simulation lifecycle and state endpoints."""

from fastapi import APIRouter
from app.schemas.simulation import SimulationState
from app.services.simulation_service import SimulationService

router = APIRouter(tags=["Simulation State"])


@router.get(
    "/simulation/state",
    response_model=SimulationState,
    summary="Get initial simulation state",
)
async def get_simulation_state() -> SimulationState:
    """Return current simulation state.
    
    In Phase 1, always returns an explicit status of 'not_started' with zero active
    incidents, zero deployed agents, and baseline configuration metadata.
    """
    return SimulationService.get_initial_state()
