"""Civilian Condition & Deterioration Model for RESQ-AI simulation ticks.

Manages deterministic physiological deterioration, environmental exposure,
triage urgency escalation, and waiting time tracking across simulation steps.
"""

from typing import List
from app.schemas.environment import (
    CityGrid,
    Civilian,
    CivilianStatus,
    HazardState,
    UrgencyLevel,
)


class CivilianDeteriorationModel:
    """Deterministic updater for civilian physiological health and triage status."""

    # Environmental health decay amounts per tick
    DANGEROUS_DECAY = 8
    DEBRIS_DECAY = 5
    FLOOD_DECAY = 3
    INJURY_BASE_DECAY = 1

    # Health escalation thresholds
    CRITICAL_HEALTH_THRESHOLD = 25
    HIGH_HEALTH_THRESHOLD = 50

    @classmethod
    def step_civilians(
        cls,
        civilians: List[Civilian],
        grid: CityGrid,
        current_tick: int,
    ) -> List[str]:
        """Update each civilian's exposure, health, and triage status for the tick.
        
        Guarantees:
        - Health is clamped strictly within [0, 100].
        - Rescued civilians do not deteriorate and do not increment waiting time.
        - Urgency escalates when conditions deteriorate, but is never downgraded.
        - Returns narrative event logs for meaningful status/health transitions.
        """
        events: List[str] = []

        for civ in civilians:
            # Rescued civilians are safe in shelter
            if civ.status == CivilianStatus.RESCUED:
                continue

            # Increment waiting time spent awaiting rescue
            civ.waiting_ticks += 1

            # Check cell environmental condition
            r, c = civ.coordinate.row, civ.coordinate.col
            cell = grid.cells[r][c]

            prev_health = civ.health
            prev_status = civ.status
            prev_urgency = civ.urgency

            # 1. Environmental hazard exposure and decay
            if cell.hazard == HazardState.DANGEROUS or cell.water_level >= 1.5:
                civ.health -= cls.DANGEROUS_DECAY
                civ.status = CivilianStatus.TRAPPED
                civ.urgency = UrgencyLevel.CRITICAL
                events.append(
                    f"Civilian {civ.id} endangered by deep water ({cell.water_level:.1f}m) at ({r}, {c}). Health: {max(0, civ.health)}%."
                )
            elif cell.hazard == HazardState.DEBRIS_BLOCKED or cell.debris_severity >= 2.0:
                civ.health -= cls.DEBRIS_DECAY
                if civ.status == CivilianStatus.WAITING:
                    civ.status = CivilianStatus.TRAPPED
                if civ.urgency in [UrgencyLevel.LOW, UrgencyLevel.MEDIUM]:
                    civ.urgency = UrgencyLevel.HIGH
                if prev_status != civ.status or prev_urgency != civ.urgency:
                    events.append(
                        f"Civilian {civ.id} trapped by structural debris at ({r}, {c}). Health: {max(0, civ.health)}%."
                    )
            elif cell.hazard == HazardState.FLOODED:
                civ.health -= cls.FLOOD_DECAY
                if civ.status == CivilianStatus.WAITING:
                    civ.status = CivilianStatus.INJURED
                if civ.urgency == UrgencyLevel.LOW:
                    civ.urgency = UrgencyLevel.MEDIUM
                if prev_status != civ.status or prev_urgency != civ.urgency:
                    events.append(
                        f"Civilian {civ.id} exposed to flooding ({cell.water_level:.1f}m) at ({r}, {c}). Status: {civ.status.value}."
                    )
            else:
                # Safe sector
                if civ.status == CivilianStatus.INJURED:
                    civ.health -= cls.INJURY_BASE_DECAY
                elif civ.status == CivilianStatus.TRAPPED:
                    civ.health -= cls.INJURY_BASE_DECAY

            # 2. Strict health clamping [0, 100]
            civ.health = max(0, min(100, civ.health))

            # 3. Health-based urgency escalation (never downgrade)
            if civ.health <= cls.CRITICAL_HEALTH_THRESHOLD and civ.urgency != UrgencyLevel.CRITICAL:
                civ.urgency = UrgencyLevel.CRITICAL
                events.append(
                    f"Civilian {civ.id} health depleted to {civ.health}%. Urgency escalated to CRITICAL."
                )
            elif (
                civ.health <= cls.HIGH_HEALTH_THRESHOLD
                and civ.urgency in [UrgencyLevel.LOW, UrgencyLevel.MEDIUM]
            ):
                civ.urgency = UrgencyLevel.HIGH
                events.append(
                    f"Civilian {civ.id} health fell to {civ.health}%. Urgency escalated to HIGH."
                )

        return events
