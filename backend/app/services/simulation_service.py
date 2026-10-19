"""Simulation service providing configuration management and state factory."""

from app.core.config import settings
from app.schemas.simulation import (
    DisasterType,
    SimulationConfig,
    SimulationState,
    SimulationStatus,
)


class SimulationService:
    """Manages baseline simulation configuration and initial state generation."""

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

    @staticmethod
    def get_initial_state(config: SimulationConfig | None = None) -> SimulationState:
        """Generate a valid initial simulation state with status 'not_started'.
        
        Does not fabricate active rescue operations or fake telemetry.
        """
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
