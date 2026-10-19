"""Pydantic schemas and contracts for rescue prioritization and civilian triage."""

from typing import List, Optional
from pydantic import BaseModel, Field

from app.schemas.environment import (
    CivilianStatus,
    Coordinate,
    HazardState,
    UrgencyLevel,
)


class ScoreBreakdown(BaseModel):
    """Component breakdown of the multi-factor triage priority score."""

    urgency_score: float = Field(..., description="Contribution from triage urgency level (5.0 to 40.0)")
    health_score: float = Field(..., description="Contribution from health deficit: (100 - health) * 0.30")
    trapped_score: float = Field(..., description="Contribution from trapped physical status (+15.0)")
    hazard_score: float = Field(..., description="Contribution from environmental hazard severity (0.0 to 15.0)")
    injured_score: float = Field(..., description="Contribution from injury status (+8.0)")
    waiting_score: float = Field(..., description="Contribution from elapsed waiting time, capped at 10.0")


class TriageItem(BaseModel):
    """Prioritized rescue candidate evaluated by the triage scoring heuristic."""

    rank: int = Field(..., ge=1, description="Priority rank (1 is highest rescue priority)")
    civilian_id: str = Field(..., description="Unique civilian identifier")
    coordinate: Coordinate = Field(..., description="Civilian location coordinate")
    status: CivilianStatus = Field(..., description="Current status: waiting, injured, trapped, or rescued")
    urgency: UrgencyLevel = Field(..., description="Triage urgency: low, medium, high, or critical")
    health: int = Field(..., ge=0, le=100, description="Current health percentage (0-100)")
    waiting_ticks: int = Field(default=0, ge=0, description="Elapsed simulation ticks spent awaiting rescue")
    priority_score: float = Field(..., ge=0.0, description="Calculated composite priority score")
    hazard_state: HazardState = Field(default=HazardState.SAFE, description="Hazard state at civilian location")
    water_level: float = Field(default=0.0, ge=0.0, description="Water depth at location (meters)")
    debris_severity: float = Field(default=0.0, ge=0.0, description="Structural rubble severity at location")
    explanation: str = Field(..., description="Human-readable rationale for this civilian's priority ranking")
    score_breakdown: ScoreBreakdown = Field(..., description="Detailed component breakdown of the priority score")


class TriageSummary(BaseModel):
    """Aggregate statistics across all civilians in the simulation."""

    total_civilians: int = Field(..., ge=0, description="Total civilians in the scenario")
    active_unrescued: int = Field(..., ge=0, description="Civilians still awaiting rescue in the disaster zone")
    rescued_count: int = Field(..., ge=0, description="Civilians safely evacuated to shelters")
    critical_count: int = Field(..., ge=0, description="Count of civilians with CRITICAL urgency")
    high_count: int = Field(..., ge=0, description="Count of civilians with HIGH urgency")
    medium_count: int = Field(..., ge=0, description="Count of civilians with MEDIUM urgency")
    low_count: int = Field(..., ge=0, description="Count of civilians with LOW urgency")
    trapped_count: int = Field(..., ge=0, description="Count of civilians currently trapped")
    injured_count: int = Field(..., ge=0, description="Count of civilians currently injured")


class PrioritiesResponse(BaseModel):
    """API response model for GET /api/v1/simulation/priorities."""

    current_tick: int = Field(..., ge=0, description="Simulation tick at which priorities were calculated")
    queue: List[TriageItem] = Field(default_factory=list, description="Ranked list of unrescued civilians")
    summary: TriageSummary = Field(..., description="Aggregate summary counts across triage categories")
    is_heuristic: bool = Field(default=True, description="Indicates this ranking is an educational simulation heuristic")
    methodology: str = Field(
        default="RESQ-AI Multi-Factor Weighted Triage Heuristic",
        description="Name of the scoring algorithm employed",
    )
