"""Simulation data contracts and Pydantic models for Phase 2."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

from app.schemas.environment import CityGrid, Civilian, Coordinate, Shelter


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
    seed: Optional[int] = Field(
        default=42,
        description="Random seed for deterministic city and disaster generation",
    )
    scenario_id: Optional[str] = Field(
        default=None,
        description="Identifier of pre-configured scenario template",
    )

    @field_validator("grid_rows", "grid_cols")
    @classmethod
    def validate_dimensions(cls, v: int) -> int:
        if v < 5:
            raise ValueError("Grid dimension must be at least 5x5 for simulation operations")
        return v


class SimulationState(BaseModel):
    """Current state of the simulation engine.
    
    Includes full environmental telemetry, cell grid, disaster conditions,
    civilians, shelters, and lifecycle indicators.
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
        description="Number of unresolved emergency incidents / affected civilians",
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
    grid: Optional[CityGrid] = Field(
        default=None,
        description="2D city environment grid with terrain and hazard conditions",
    )
    civilians: List[Civilian] = Field(
        default_factory=list,
        description="List of civilians distributed across the city",
    )
    shelters: List[Shelter] = Field(
        default_factory=list,
        description="List of emergency evacuation shelters",
    )
    scenario_id: Optional[str] = Field(
        default=None,
        description="Current active scenario identifier",
    )
    tick_events: List[str] = Field(
        default_factory=list,
        description="Operational log events generated during the most recent tick",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=lambda: {
            "phase": 2,
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


class StartSimulationRequest(BaseModel):
    """Parameters to initialize or restart a disaster simulation scenario."""

    scenario_id: Optional[str] = Field(
        default=None,
        description="ID of built-in scenario (e.g., 'flooded_neighborhood', 'earthquake_district')",
    )
    disaster_type: Optional[DisasterType] = Field(
        default=None,
        description="Disaster type if overriding template or creating custom scenario",
    )
    seed: Optional[int] = Field(
        default=42,
        description="Random seed for deterministic procedural generation",
    )
    grid_rows: Optional[int] = Field(
        default=None,
        ge=5,
        le=100,
        description="Optional override for grid rows",
    )
    grid_cols: Optional[int] = Field(
        default=None,
        ge=5,
        le=100,
        description="Optional override for grid columns",
    )
    max_agents: Optional[int] = Field(
        default=None,
        ge=1,
        le=50,
        description="Optional override for max responders",
    )
    num_civilians: Optional[int] = Field(
        default=None,
        ge=1,
        le=100,
        description="Optional override for civilian incident count",
    )


class ScenarioInfo(BaseModel):
    """Description of a pre-configured disaster scenario template."""

    id: str = Field(..., description="Unique scenario identifier")
    name: str = Field(..., description="Human-readable scenario title")
    description: str = Field(..., description="Scenario background narrative")
    disaster_type: DisasterType = Field(..., description="Primary disaster type")
    default_seed: int = Field(..., description="Reference random seed for reproducibility")
    recommended_rows: int = Field(..., description="Default grid row dimension")
    recommended_cols: int = Field(..., description="Default grid column dimension")
    civilian_count: int = Field(..., description="Standard civilian count placed in scenario")


class TickResult(BaseModel):
    """Response returned upon completing a single simulation tick step."""

    current_tick: int = Field(..., description="New advanced tick count")
    status: SimulationStatus = Field(..., description="Simulation status after tick")
    events: List[str] = Field(default_factory=list, description="Narrative events that occurred")
    state: SimulationState = Field(..., description="Updated complete simulation state")
