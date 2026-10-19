"""Simulation lifecycle and environment endpoints."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas.agent import AgentsResponse, EventsResponse, MissionsResponse
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse
from app.schemas.prioritization import PrioritiesResponse
from app.schemas.route import RouteRequest, RouteResponse
from app.schemas.simulation import (
    ScenarioInfo,
    SimulationState,
    StartSimulationRequest,
    TickResult,
)
from app.services.simulation.engine import SimulationNotRunningError
from app.services.simulation_service import SimulationService

router = APIRouter(tags=["Simulation Lifecycle & Environment"])


@router.get(
    "/simulation/scenarios",
    response_model=List[ScenarioInfo],
    summary="List built-in disaster scenarios",
)
async def list_scenarios() -> List[ScenarioInfo]:
    """Retrieve available pre-configured simulation scenarios and disaster templates."""
    return SimulationService.get_scenarios()


@router.get(
    "/simulation/state",
    response_model=SimulationState,
    summary="Get current simulation telemetry state",
)
async def get_simulation_state() -> SimulationState:
    """Return the complete current simulation state.
    
    Before initialization, returns a truthful 'not_started' state.
    When active, includes 2D city grid, cell terrain, flood/debris hazards,
    affected civilians, and shelter occupancy.
    """
    return SimulationService.get_initial_state()


@router.post(
    "/simulation/start",
    response_model=SimulationState,
    summary="Initialize and start a disaster scenario",
    status_code=status.HTTP_200_OK,
)
async def start_simulation(payload: StartSimulationRequest) -> SimulationState:
    """Initialize a fresh city grid environment and start disaster simulation."""
    return SimulationService.start_simulation(payload)


@router.post(
    "/simulation/tick",
    response_model=TickResult,
    summary="Advance simulation by one tick",
    responses={
        400: {"description": "Simulation is not currently running (paused or not started)"},
    },
)
async def step_simulation_tick() -> TickResult:
    """Advance the active disaster simulation by exactly one tick step."""
    try:
        return SimulationService.step_tick()
    except SimulationNotRunningError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


@router.post(
    "/simulation/pause",
    response_model=SimulationState,
    summary="Pause active simulation",
)
async def pause_simulation() -> SimulationState:
    """Pause the simulation engine without destroying the environment state."""
    return SimulationService.pause_simulation()


@router.post(
    "/simulation/resume",
    response_model=SimulationState,
    summary="Resume paused simulation",
)
async def resume_simulation() -> SimulationState:
    """Resume a paused simulation engine."""
    return SimulationService.resume_simulation()


@router.post(
    "/simulation/reset",
    response_model=SimulationState,
    summary="Reset scenario to initial seeded state",
)
async def reset_simulation() -> SimulationState:
    """Reset the current simulation back to tick 0 using original configuration and seed."""
    return SimulationService.reset_simulation()


@router.post(
    "/simulation/route",
    response_model=RouteResponse,
    summary="Plan optimal A* route on the active city grid",
    responses={
        400: {"description": "Simulation not initialized or no active grid available"},
        422: {"description": "Validation error for invalid coordinate payload"},
    },
)
async def plan_simulation_route(payload: RouteRequest) -> RouteResponse:
    """Evaluate optimal A* route between two coordinates on the active environment grid."""
    try:
        return SimulationService.plan_route(payload)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


@router.get(
    "/simulation/priorities",
    response_model=PrioritiesResponse,
    summary="Get rescue priority queue and civilian triage summary",
    responses={
        400: {"description": "Simulation not initialized"},
    },
)
async def get_rescue_priorities() -> PrioritiesResponse:
    """Return ranked active rescue queue and aggregate triage summary for current state."""
    try:
        return SimulationService.get_priorities()
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


@router.get(
    "/simulation/agents",
    response_model=AgentsResponse,
    summary="Get autonomous rescue agents and operational fleet status",
)
async def get_rescue_agents() -> AgentsResponse:
    """Retrieve all deployed rescue agents, current coordinates, active missions, and fleet summary."""
    return SimulationService.get_agents()


@router.get(
    "/simulation/missions",
    response_model=MissionsResponse,
    summary="Get active and historical rescue missions",
)
async def get_rescue_missions() -> MissionsResponse:
    """Retrieve all active, completed, and failed rescue missions and assignment explanations."""
    return SimulationService.get_missions()


@router.get(
    "/simulation/events",
    response_model=EventsResponse,
    summary="Get recent simulation and dispatch event logs",
)
async def get_simulation_events() -> EventsResponse:
    """Retrieve operational event logs and autonomous dispatch notifications."""
    return SimulationService.get_events()


@router.post(
    "/simulation/evaluate",
    response_model=EvaluationResponse,
    summary="Run empirical benchmark comparing AI Triage against Naive Baseline",
)
async def evaluate_strategies(payload: EvaluationRequest) -> EvaluationResponse:
    """Run an isolated deterministic benchmark comparing RESQ-AI against the Baseline strategy.
    
    Guarantees:
    - Runs in isolated SimulationEngine instances; does not affect active dashboard simulation.
    - Evaluates identical scenario grids, civilian spawns, shelter locations, and seeds.
    - Compares rescues, critical rescues, average rescue ticks, civilian health, and failed missions.
    """
    try:
        return SimulationService.evaluate(payload)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


@router.get(
    "/simulation/evaluate/latest",
    response_model=Optional[EvaluationResponse],
    summary="Get latest benchmark evaluation results",
)
async def get_latest_evaluation() -> Optional[EvaluationResponse]:
    """Retrieve the most recent strategy comparison benchmark report if available."""
    return SimulationService.get_latest_evaluation()


