"""Pydantic schemas and contracts for rescue agents, autonomous dispatch, and mission coordination."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.environment import Coordinate
from app.schemas.route import MovementProfile


class AgentType(str, Enum):
    """Classification of autonomous emergency rescue agent."""

    GROUND_RESPONDER = "ground_responder"  # Emergency vehicle operating on roads/open ground
    FOOT_RESPONDER = "foot_responder"      # Search & rescue crew on foot, wading shallow waters


class AgentStatus(str, Enum):
    """Operational lifecycle status of a rescue agent."""

    IDLE = "idle"                        # Stationed / awaiting mission assignment
    EN_ROUTE = "en_route"                # Navigating along A* route to target civilian
    RESCUING = "rescuing"                # At civilian location, stabilizing and boarding
    TRANSPORTING = "transporting"        # Carrying civilian along route to evacuation shelter
    UNAVAILABLE = "unavailable"          # Blocked by dynamic obstacles or out of service


class MissionStatus(str, Enum):
    """Lifecycle phase of a rescue mission assignment."""

    ASSIGNED = "assigned"                # Target selected, route initialized
    EN_ROUTE = "en_route"                # Agent en route to civilian
    RESCUING = "rescuing"                # Agent actively performing extraction
    TRANSPORTING = "transporting"        # Civilian in transit to shelter
    COMPLETED = "completed"              # Civilian safely evacuated into shelter
    FAILED = "failed"                    # Target or shelter became completely unreachable
    CANCELLED = "cancelled"              # Mission invalidated


class RescueMission(BaseModel):
    """Individual emergency rescue assignment connecting an agent to a civilian and shelter."""

    id: str = Field(..., description="Unique mission identifier (e.g. 'mission_1_1')")
    agent_id: str = Field(..., description="Identifier of the assigned rescue agent")
    civilian_id: str = Field(..., description="Identifier of the target civilian")
    target_coordinate: Coordinate = Field(..., description="Grid coordinate where civilian was located")
    shelter_id: Optional[str] = Field(default=None, description="Assigned destination shelter identifier")
    shelter_coordinate: Optional[Coordinate] = Field(default=None, description="Destination shelter location")
    status: MissionStatus = Field(default=MissionStatus.ASSIGNED, description="Current mission progress phase")
    route: List[Coordinate] = Field(default_factory=list, description="Active planned A* route coordinates")
    route_step_index: int = Field(default=0, ge=0, description="Index of current position along the route")
    created_at_tick: int = Field(default=0, ge=0, description="Simulation tick when mission was dispatched")
    completed_at_tick: Optional[int] = Field(default=None, description="Tick when civilian was safely delivered")
    explanation: str = Field(..., description="Operational narrative describing mission status or rationale")


class RescueAgent(BaseModel):
    """Autonomous rescue agent situated in the city grid."""

    id: str = Field(..., description="Unique agent identifier (e.g. 'agent_ground_1')")
    name: str = Field(..., description="Human-readable callsign or unit name")
    type: AgentType = Field(..., description="Agent equipment and capability classification")
    coordinate: Coordinate = Field(..., description="Current grid location")
    status: AgentStatus = Field(default=AgentStatus.IDLE, description="Operational availability status")
    movement_profile: MovementProfile = Field(
        ...,
        description="Pathfinding mobility constraints governing passable terrain and costs",
    )
    current_mission_id: Optional[str] = Field(default=None, description="Active mission identifier if dispatched")
    target_civilian_id: Optional[str] = Field(default=None, description="Target civilian currently being rescued")
    carrying_civilian_id: Optional[str] = Field(default=None, description="Civilian currently aboard during transport")
    completed_rescues: int = Field(default=0, ge=0, description="Total civilian lives saved by this unit")
    speed_cells_per_tick: int = Field(default=1, ge=1, le=5, description="Maximum grid steps per tick")
    active_path: List[Coordinate] = Field(default_factory=list, description="Remaining route waypoints to destination")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extensible telemetry metadata")


class DispatchSummary(BaseModel):
    """Aggregate fleet and mission operational statistics."""

    total_agents: int = Field(..., ge=0, description="Total rescue agents deployed in the scenario")
    available_agents: int = Field(..., ge=0, description="Agents currently idle and available for dispatch")
    active_missions: int = Field(..., ge=0, description="Missions currently en-route, rescuing, or transporting")
    completed_evacuations: int = Field(..., ge=0, description="Total civilian rescues successfully completed")
    failed_missions: int = Field(..., ge=0, description="Missions that failed due to impassable hazards")


class AgentsResponse(BaseModel):
    """API response model for GET /api/v1/simulation/agents."""

    current_tick: int = Field(..., ge=0, description="Simulation tick at which agents were queried")
    agents: List[RescueAgent] = Field(default_factory=list, description="List of all rescue agents in the fleet")
    summary: DispatchSummary = Field(..., description="High-level fleet operational summary")


class MissionsResponse(BaseModel):
    """API response model for GET /api/v1/simulation/missions."""

    current_tick: int = Field(..., ge=0, description="Simulation tick at which missions were queried")
    missions: List[RescueMission] = Field(default_factory=list, description="List of all active and historical missions")
    summary: DispatchSummary = Field(..., description="High-level mission operational summary")


class EventsResponse(BaseModel):
    """API response model for GET /api/v1/simulation/events."""

    current_tick: int = Field(..., ge=0, description="Simulation tick at which events were queried")
    events: List[str] = Field(default_factory=list, description="Recent operational and dispatch event logs")
