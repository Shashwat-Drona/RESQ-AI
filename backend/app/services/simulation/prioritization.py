"""Dedicated Rescue Prioritization & Civilian Triage Service for RESQ-AI.

Provides deterministic multi-factor triage scoring, component breakdowns,
human-readable triage rationales, and stable priority queue generation.

This system is an educational simulation heuristic designed for disaster modeling
and multi-agent emergency simulations.
"""

from typing import List, Optional, Tuple

from app.schemas.environment import (
    CityGrid,
    Civilian,
    CivilianStatus,
    GridCell,
    HazardState,
    UrgencyLevel,
)
from app.schemas.prioritization import (
    PrioritiesResponse,
    ScoreBreakdown,
    TriageItem,
    TriageSummary,
)


class RescuePrioritizer:
    """Deterministic, transparent triage scoring and rescue queue ranking engine."""

    # Urgency categorical score contributions
    URGENCY_WEIGHTS = {
        UrgencyLevel.CRITICAL: 40.0,
        UrgencyLevel.HIGH: 25.0,
        UrgencyLevel.MEDIUM: 15.0,
        UrgencyLevel.LOW: 5.0,
    }

    # Urgency numerical rank for deterministic tie-breaking
    URGENCY_RANKS = {
        UrgencyLevel.CRITICAL: 4,
        UrgencyLevel.HIGH: 3,
        UrgencyLevel.MEDIUM: 2,
        UrgencyLevel.LOW: 1,
    }

    # Status bonus contributions
    TRAPPED_BONUS = 15.0
    INJURED_BONUS = 8.0

    # Maximum waiting time bonus cap to prevent waiting time from eclipsing acute life hazards
    MAX_WAITING_BONUS = 10.0
    WAITING_PER_TICK = 1.0

    @classmethod
    def compute_priority_score(
        cls,
        civilian: Civilian,
        cell: Optional[GridCell] = None,
    ) -> Tuple[float, ScoreBreakdown, str]:
        """Compute the composite priority score, component breakdown, and rationale for a civilian.
        
        Formula:
            Score = S_urgency + S_health + S_trapped + S_hazard + S_injured + S_waiting
            
        Where:
            S_urgency: 5.0 to 40.0 based on UrgencyLevel
            S_health: (100 - health) * 0.30 (health deficit scaling)
            S_trapped: 15.0 if status == TRAPPED, else 0.0
            S_hazard: 0.0 to 15.0 based on active cell environmental hazard
            S_injured: 8.0 if status == INJURED, else 0.0
            S_waiting: min(10.0, waiting_ticks * 1.0)
            
        Returns:
            Tuple of (total_score, ScoreBreakdown, human_readable_explanation)
        """
        # 1. Urgency contribution
        urgency_score = cls.URGENCY_WEIGHTS.get(civilian.urgency, 15.0)

        # 2. Health deficit contribution (clamped 0-100)
        clamped_health = max(0, min(100, civilian.health))
        health_score = round((100 - clamped_health) * 0.30, 2)

        # 3. Trapped physical status contribution
        trapped_score = cls.TRAPPED_BONUS if civilian.status == CivilianStatus.TRAPPED else 0.0

        # 4. Environmental hazard contribution
        hazard_score = 0.0
        hazard_desc = "Safe sector"
        if cell is not None:
            if cell.hazard == HazardState.DANGEROUS or cell.water_level >= 1.5:
                hazard_score = 15.0
                hazard_desc = f"Deep water danger ({cell.water_level:.1f}m)"
            elif cell.hazard == HazardState.DEBRIS_BLOCKED or cell.debris_severity >= 2.0:
                hazard_score = min(12.0, round(8.0 + (1.0 * cell.debris_severity), 2))
                hazard_desc = f"Structural debris (sev {cell.debris_severity:.1f})"
            elif cell.hazard == HazardState.FLOODED:
                hazard_score = min(10.0, round(5.0 + (3.0 * cell.water_level), 2))
                hazard_desc = f"Flooded roadway ({cell.water_level:.1f}m)"
            else:
                hazard_score = 0.0
                hazard_desc = "Clear safe ground"

        # 5. Injured status contribution
        injured_score = cls.INJURED_BONUS if civilian.status == CivilianStatus.INJURED else 0.0

        # 6. Elapsed waiting time contribution (strictly capped)
        waiting_score = min(
            cls.MAX_WAITING_BONUS,
            round(civilian.waiting_ticks * cls.WAITING_PER_TICK, 2),
        )

        # Total Composite Score
        total_score = round(
            urgency_score + health_score + trapped_score + hazard_score + injured_score + waiting_score,
            2,
        )

        breakdown = ScoreBreakdown(
            urgency_score=urgency_score,
            health_score=health_score,
            trapped_score=trapped_score,
            hazard_score=hazard_score,
            injured_score=injured_score,
            waiting_score=waiting_score,
        )

        # Generate concise explanation of primary ranking drivers
        reasons: List[str] = []
        if civilian.urgency == UrgencyLevel.CRITICAL:
            reasons.append("Critical triage priority")
        elif civilian.urgency == UrgencyLevel.HIGH:
            reasons.append("High urgency incident")

        if civilian.status == CivilianStatus.TRAPPED:
            reasons.append("Trapped by physical hazards")
        elif civilian.status == CivilianStatus.INJURED:
            reasons.append("Suffering physical trauma")

        if hazard_score >= 10.0:
            reasons.append(f"Exposed to {hazard_desc.lower()}")
        elif hazard_score > 0.0:
            reasons.append(f"In {hazard_desc.lower()}")

        if clamped_health < 40:
            reasons.append(f"Severe health depletion ({clamped_health}%)")
        elif clamped_health < 75:
            reasons.append(f"Declining health ({clamped_health}%)")

        if civilian.waiting_ticks >= 3:
            reasons.append(f"Awaiting evacuation ({civilian.waiting_ticks} ticks)")

        if not reasons:
            explanation = f"Stable in {hazard_desc.lower()}; health at {clamped_health}%."
        else:
            explanation = "; ".join(reasons) + "."

        return total_score, breakdown, explanation

    @classmethod
    def rank_civilians(
        cls,
        civilians: List[Civilian],
        grid: Optional[CityGrid] = None,
        include_rescued: bool = False,
    ) -> List[TriageItem]:
        """Rank unrescued civilians into a deterministic, prioritized rescue queue.
        
        Sorting Criteria (Tie-breaking):
            1. Priority score descending (highest priority score first)
            2. Urgency level descending (CRITICAL > HIGH > MEDIUM > LOW)
            3. Health ascending (lower health / more depleted first)
            4. Civilian ID ascending (stable alphabetic tie-breaker)
        """
        # Filter unrescued candidates
        candidates = [
            c for c in civilians
            if include_rescued or c.status != CivilianStatus.RESCUED
        ]

        evaluated_items: List[Tuple[float, int, int, str, TriageItem]] = []

        for civ in candidates:
            cell = None
            if grid is not None and 0 <= civ.coordinate.row < grid.rows and 0 <= civ.coordinate.col < grid.cols:
                cell = grid.cells[civ.coordinate.row][civ.coordinate.col]

            score, breakdown, explanation = cls.compute_priority_score(civ, cell)
            urgency_rank = cls.URGENCY_RANKS.get(civ.urgency, 1)

            triage_item = TriageItem(
                rank=1,  # Assigned after sorting
                civilian_id=civ.id,
                coordinate=civ.coordinate,
                status=civ.status,
                urgency=civ.urgency,
                health=civ.health,
                waiting_ticks=civ.waiting_ticks,
                priority_score=score,
                hazard_state=cell.hazard if cell else HazardState.SAFE,
                water_level=cell.water_level if cell else 0.0,
                debris_severity=cell.debris_severity if cell else 0.0,
                explanation=explanation,
                score_breakdown=breakdown,
            )

            # Tuple for stable sorting: (-score, -urgency_rank, health, id)
            sort_key = (-score, -urgency_rank, civ.health, civ.id)
            evaluated_items.append((sort_key[0], sort_key[1], sort_key[2], sort_key[3], triage_item))

        # Sort deterministically
        evaluated_items.sort(key=lambda item: (item[0], item[1], item[2], item[3]))

        # Assign 1-indexed ranks
        ranked_queue: List[TriageItem] = []
        for idx, (_, _, _, _, triage_item) in enumerate(evaluated_items, start=1):
            triage_item.rank = idx
            ranked_queue.append(triage_item)

        return ranked_queue

    @classmethod
    def build_triage_summary(cls, civilians: List[Civilian]) -> TriageSummary:
        """Calculate aggregate statistical metrics across all simulation civilians."""
        total = len(civilians)
        rescued = sum(1 for c in civilians if c.status == CivilianStatus.RESCUED)
        active_unrescued = total - rescued

        critical = sum(1 for c in civilians if c.urgency == UrgencyLevel.CRITICAL and c.status != CivilianStatus.RESCUED)
        high = sum(1 for c in civilians if c.urgency == UrgencyLevel.HIGH and c.status != CivilianStatus.RESCUED)
        medium = sum(1 for c in civilians if c.urgency == UrgencyLevel.MEDIUM and c.status != CivilianStatus.RESCUED)
        low = sum(1 for c in civilians if c.urgency == UrgencyLevel.LOW and c.status != CivilianStatus.RESCUED)

        trapped = sum(1 for c in civilians if c.status == CivilianStatus.TRAPPED)
        injured = sum(1 for c in civilians if c.status == CivilianStatus.INJURED)

        return TriageSummary(
            total_civilians=total,
            active_unrescued=active_unrescued,
            rescued_count=rescued,
            critical_count=critical,
            high_count=high,
            medium_count=medium,
            low_count=low,
            trapped_count=trapped,
            injured_count=injured,
        )

    @classmethod
    def get_priorities_snapshot(
        cls,
        current_tick: int,
        civilians: List[Civilian],
        grid: Optional[CityGrid] = None,
    ) -> PrioritiesResponse:
        """Generate complete PrioritiesResponse snapshot for the current simulation state."""
        queue = cls.rank_civilians(civilians=civilians, grid=grid, include_rescued=False)
        summary = cls.build_triage_summary(civilians=civilians)

        return PrioritiesResponse(
            current_tick=current_tick,
            queue=queue,
            summary=summary,
            is_heuristic=True,
            methodology="RESQ-AI Multi-Factor Weighted Triage Heuristic",
        )
