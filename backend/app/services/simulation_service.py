"""Simulation service providing singleton engine orchestration and lifecycle management."""

from typing import List, Optional
from app.core.config import settings
from app.schemas.prioritization import PrioritiesResponse
from app.schemas.route import RouteRequest, RouteResponse
from app.schemas.simulation import (
    DisasterType,
    ScenarioInfo,
    SimulationConfig,
    SimulationState,
    SimulationStatus,
    StartSimulationRequest,
    TickResult,
)
from app.services.simulation.engine import SimulationEngine
from app.services.simulation.pathfinding import AStarPathfinder
from app.services.simulation.prioritization import RescuePrioritizer
from app.services.simulation.scenarios import get_all_scenarios


class SimulationService:
    """Manages baseline simulation configuration and the active SimulationEngine instance."""

    # Active session instance for local development
    _engine: SimulationEngine = SimulationEngine()

    @classmethod
    def get_engine(cls) -> SimulationEngine:
        """Access the active SimulationEngine instance."""
        return cls._engine

    @classmethod
    def reset_engine(cls) -> SimulationEngine:
        """Reset the singleton engine for test isolation or fresh session."""
        cls._engine = SimulationEngine()
        return cls._engine

    @staticmethod
    def get_default_config() -> SimulationConfig:
        """Construct the default simulation configuration from application settings."""
        disaster = (
            DisasterType(settings.default_disaster_type.lower())
            if settings.default_disaster_type.lower() in [d.value for d in DisasterType]
            else DisasterType.FLOOD
        )
        return SimulationConfig(
            grid_rows=settings.default_grid_rows,
            grid_cols=settings.default_grid_cols,
            max_agents=settings.default_max_agents,
            disaster_type=disaster,
            tick_interval_seconds=settings.default_tick_interval_seconds,
        )

    @classmethod
    def get_initial_state(cls, config: SimulationConfig | None = None) -> SimulationState:
        """Generate simulation state.
        
        If an active simulation scenario is running or paused, returns its true telemetry.
        Otherwise returns a clean initial state with status 'not_started'.
        """
        if cls._engine.is_active():
            return cls._engine.get_state()

        active_config = config or SimulationService.get_default_config()
        return SimulationState(
            status=SimulationStatus.NOT_STARTED,
            current_tick=0,
            config=active_config,
            active_incidents=0,
            active_agents=0,
            rescued_count=0,
            message="Simulation engine initialized in standby. No active simulation session is running.",
        )

    @staticmethod
    def get_scenarios() -> List[ScenarioInfo]:
        """Return all built-in scenario templates."""
        return get_all_scenarios()

    @classmethod
    def start_simulation(cls, request: StartSimulationRequest) -> SimulationState:
        """Initialize and start a scenario on the active engine."""
        return cls._engine.start(request)

    @classmethod
    def step_tick(cls) -> TickResult:
        """Advance the active simulation by one tick."""
        return cls._engine.step()

    @classmethod
    def pause_simulation(cls) -> SimulationState:
        """Pause active simulation."""
        return cls._engine.pause()

    @classmethod
    def resume_simulation(cls) -> SimulationState:
        """Resume paused simulation."""
        return cls._engine.resume()

    @classmethod
    def reset_simulation(cls) -> SimulationState:
        """Reset active scenario back to initial tick 0 state."""
        return cls._engine.reset()

    @classmethod
    def plan_route(cls, request: RouteRequest) -> RouteResponse:
        """Evaluate optimal A* route against the current active simulation grid.
        
        Guarantees:
        - Evaluates against the active environmental terrain and hazard state.
        - Non-mutating: Does not advance ticks or modify simulation state.
        - Raises ValueError if no active simulation scenario has been initialized.
        """
        if not cls._engine.is_active() or cls._engine.grid is None:
            raise ValueError(
                "Simulation has not been initialized. Start a scenario before requesting routes."
            )

        return AStarPathfinder.plan_route(
            grid=cls._engine.grid,
            start=request.start,
            goal=request.goal,
            profile=request.movement_profile,
        )

    @classmethod
    def get_priorities(cls) -> PrioritiesResponse:
        """Evaluate ranked rescue priority queue against current simulation state.
        
        Guarantees:
        - Evaluates current civilian health, triage urgency, hazard exposure, and waiting ticks.
        - Non-mutating: Does not advance ticks or modify civilian/simulation state.
        - Raises ValueError if no active simulation scenario has been initialized.
        """
        if not cls._engine.is_active() or cls._engine.grid is None:
            raise ValueError(
                "Simulation has not been initialized. Start a scenario before requesting rescue priorities."
            )

        return RescuePrioritizer.get_priorities_snapshot(
            current_tick=cls._engine.current_tick,
            civilians=cls._engine.civilians,
            grid=cls._engine.grid,
        )
