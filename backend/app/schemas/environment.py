"""Environmental models and grid schemas for RESQ-AI simulation."""

from enum import Enum
from typing import Any, Dict, List
from pydantic import BaseModel, Field


class Coordinate(BaseModel):
    """Grid position in the simulation map (row, column)."""

    row: int = Field(..., ge=0, description="Zero-indexed row coordinate")
    col: int = Field(..., ge=0, description="Zero-indexed column coordinate")


class TerrainType(str, Enum):
    """Terrain classification of a grid cell."""

    ROAD = "road"
    BUILDING = "building"
    OPEN_GROUND = "open_ground"
    SHELTER = "shelter"


class HazardState(str, Enum):
    """Dynamic hazard condition affecting a cell."""

    SAFE = "safe"
    FLOODED = "flooded"
    DEBRIS_BLOCKED = "debris_blocked"
    DANGEROUS = "dangerous"


class CivilianStatus(str, Enum):
    """Operational status of affected civilian."""

    WAITING = "waiting"
    INJURED = "injured"
    TRAPPED = "trapped"
    IN_TRANSIT = "in_transit"
    RESCUED = "rescued"


class UrgencyLevel(str, Enum):
    """Urgency / triage priority category."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class GridCell(BaseModel):
    """State and attributes of an individual grid cell."""

    coordinate: Coordinate = Field(..., description="Grid coordinate (row, col)")
    terrain: TerrainType = Field(..., description="Physical terrain classification")
    hazard: HazardState = Field(default=HazardState.SAFE, description="Current hazard condition")
    water_level: float = Field(
        default=0.0,
        ge=0.0,
        le=10.0,
        description="Water depth in meters (0.0 to 10.0)",
    )
    debris_severity: float = Field(
        default=0.0,
        ge=0.0,
        le=5.0,
        description="Structural debris severity scale (0.0 to 5.0)",
    )
    traversable: bool = Field(
        default=True,
        description="Whether standard ground rescue responders can navigate this cell",
    )
    elevation: float = Field(
        default=1.0,
        ge=0.0,
        le=100.0,
        description="Topographical elevation affecting flood runoff (meters)",
    )


class Civilian(BaseModel):
    """Representation of an affected person requiring evacuation."""

    id: str = Field(..., description="Unique civilian identifier")
    coordinate: Coordinate = Field(..., description="Current location coordinate")
    status: CivilianStatus = Field(
        default=CivilianStatus.WAITING,
        description="Current survival and rescue status",
    )
    urgency: UrgencyLevel = Field(
        default=UrgencyLevel.MEDIUM,
        description="Triage priority category",
    )
    health: int = Field(default=100, ge=0, le=100, description="Health percentage (0-100)")
    waiting_ticks: int = Field(
        default=0,
        ge=0,
        description="Number of elapsed simulation ticks spent awaiting rescue",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Extensible metadata for future medical/agent phases",
    )


class Shelter(BaseModel):
    """Evacuation shelter or emergency safe depot."""

    id: str = Field(..., description="Unique shelter identifier")
    name: str = Field(..., description="Designated human-readable shelter name")
    coordinate: Coordinate = Field(..., description="Shelter location coordinate")
    capacity: int = Field(default=30, ge=1, description="Maximum civilian capacity")
    current_occupancy: int = Field(
        default=0,
        ge=0,
        description="Current occupants sheltered safely",
    )


class CityGrid(BaseModel):
    """Complete 2D city simulation grid."""

    rows: int = Field(..., ge=5, le=100, description="Number of grid rows")
    cols: int = Field(..., ge=5, le=100, description="Number of grid columns")
    cells: List[List[GridCell]] = Field(..., description="2D matrix of grid cells [row][col]")
