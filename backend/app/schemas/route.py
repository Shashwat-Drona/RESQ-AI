"""Route planning and pathfinding schemas for RESQ-AI Phase 3."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.environment import Coordinate


class MovementProfile(str, Enum):
    """Movement profile specifying responder physical capabilities and constraints."""

    GROUND_RESPONDER = "ground_responder"
    ON_FOOT = "on_foot"


class RouteRequest(BaseModel):
    """Request payload to plan an A* route between two coordinates on the active grid."""

    start: Coordinate = Field(..., description="Origin grid position")
    goal: Coordinate = Field(..., description="Destination grid position")
    movement_profile: MovementProfile = Field(
        default=MovementProfile.GROUND_RESPONDER,
        description="Responder mobility classification governing passable hazards and costs",
    )


class RouteResponse(BaseModel):
    """Evaluation result of the A* pathfinding search."""

    found: bool = Field(..., description="Whether an admissible path connects start and goal")
    start: Coordinate = Field(..., description="Origin coordinate")
    goal: Coordinate = Field(..., description="Destination coordinate")
    path: List[Coordinate] = Field(
        default_factory=list,
        description="Ordered sequence of coordinates from start to goal inclusive",
    )
    path_length: int = Field(
        default=0,
        ge=0,
        description="Total edge steps in the route (len(path) - 1)",
    )
    total_cost: float = Field(
        default=0.0,
        ge=0.0,
        description="Sum of terrain and hazard traversal weights along the path",
    )
    expanded_nodes: int = Field(
        default=0,
        ge=0,
        description="Total states explored by A* search during path evaluation",
    )
    movement_profile: MovementProfile = Field(
        ...,
        description="Mobility profile utilized for cost and obstacle evaluation",
    )
    reason: Optional[str] = Field(
        default=None,
        description="Diagnostic explanation when route cannot be identified",
    )
