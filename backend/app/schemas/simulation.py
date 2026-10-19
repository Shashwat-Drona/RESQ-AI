"""Initial simulation data contracts and Pydantic models."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class DisasterType(str, Enum):
    """Supported disaster simulation scenarios."""

    FLOOD = "flood"
    EARTHQUAKE = "earthquake"


class SimulationStatus(str, Enum):
    """Lifecycle status of the simulation engine."""

    NOT_STARTED = "not_started"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class Coordinate(BaseModel):
    """Grid position in the simulation map (row, column)."""

    row: int = Field(..., ge=0, description="Zero-indexed row coordinate")
    col: int = Field(..., ge=0, description="Zero-indexed column coordinate")


class SimulationConfig(BaseModel):
    """Configuration parameters for the disaster simulation."""

    grid_rows: int = Field(
        default=20,
        ge=5,
        le=100,
        description="Number of grid rows in the city map (min 5, max 100)",
    )
    grid_cols: int = Field(
        default=20,
        ge=5,
        le=100,
        description="Number of grid columns in the city map (min 5, max 100)",
    )
    max_agents: int = Field(
        default=5,
        ge=1,
        le=50,
        description="Maximum rescue agents allowed simultaneously (min 1, max 50)",
    )
    disaster_type: DisasterType = Field(
        default=DisasterType.FLOOD,
        description="Primary disaster scenario to simulate",
    )
    tick_interval_seconds: float = Field(
        default=1.0,
        gt=0.05,
        le=30.0,
        description="Duration of each simulation step in seconds",
    )

    @field_validator("grid_rows", "grid_cols")
    @classmethod
    def validate_dimensions(cls, v: int) -> int:
        if v < 5:
            raise ValueError("Grid dimension must be at least 5x5 for simulation operations")
        return v


class SimulationState(BaseModel):
    """Current state of the simulation engine.
    
    Represents initial or active state cleanly. In Phase 1, status is 'not_started'
    and lists of agents, incidents, and blocked roads remain empty.
    """

    status: SimulationStatus = Field(
        default=SimulationStatus.NOT_STARTED,
        description="Current operational lifecycle state",
    )
    current_tick: int = Field(
        default=0,
        ge=0,
        description="Monotonically increasing simulation step counter",
    )
    config: SimulationConfig = Field(
        ...,
        description="Simulation configuration currently bound to this state",
    )
    active_incidents: int = Field(
        default=0,
        ge=0,
        description="Number of unresolved emergency incidents (0 in initial state)",
    )
    active_agents: int = Field(
        default=0,
        ge=0,
        description="Number of deployed rescue agents (0 in initial state)",
    )
    rescued_count: int = Field(
        default=0,
        ge=0,
        description="Total civilians safely evacuated to shelters",
    )
    message: str = Field(
        default="Simulation engine is initialized and ready. No active simulation is running.",
        description="Human-readable status summary",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the state capture",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=lambda: {
            "phase": 1,
            "engine_mode": "idle",
            "future_features": [
                "pathfinding",
                "civilian_urgency",
                "shelter_allocation",
                "resource_constraints",
            ],
        },
        description="Extensible metadata for future phase enhancements",
    )
