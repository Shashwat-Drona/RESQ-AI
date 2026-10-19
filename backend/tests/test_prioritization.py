"""Comprehensive unit tests for the RescuePrioritizer triage service."""

from app.schemas.environment import (
    CityGrid,
    Civilian,
    CivilianStatus,
    Coordinate,
    GridCell,
    HazardState,
    TerrainType,
    UrgencyLevel,
)
from app.services.simulation.prioritization import RescuePrioritizer


def _make_cell(
    row: int = 0,
    col: int = 0,
    hazard: HazardState = HazardState.SAFE,
    water_level: float = 0.0,
    debris_severity: float = 0.0,
) -> GridCell:
    return GridCell(
        coordinate=Coordinate(row=row, col=col),
        terrain=TerrainType.ROAD,
        hazard=hazard,
        water_level=water_level,
        debris_severity=debris_severity,
        traversable=(hazard != HazardState.DEBRIS_BLOCKED and water_level < 1.5),
        elevation=1.0,
    )


def test_critical_urgency_increases_priority():
    """Verify that CRITICAL urgency yields a higher score than LOW/MEDIUM/HIGH, all else equal."""
    civ_low = Civilian(id="c1", coordinate=Coordinate(row=0, col=0), urgency=UrgencyLevel.LOW, health=100)
    civ_high = Civilian(id="c2", coordinate=Coordinate(row=0, col=0), urgency=UrgencyLevel.HIGH, health=100)
    civ_crit = Civilian(id="c3", coordinate=Coordinate(row=0, col=0), urgency=UrgencyLevel.CRITICAL, health=100)

    score_low, _, _ = RescuePrioritizer.compute_priority_score(civ_low)
    score_high, _, _ = RescuePrioritizer.compute_priority_score(civ_high)
    score_crit, _, _ = RescuePrioritizer.compute_priority_score(civ_crit)

    assert score_crit > score_high > score_low
    assert score_crit - score_low == 35.0  # 40.0 - 5.0


def test_lower_health_increases_priority():
    """Verify that lower health percentage yields a strictly higher priority score."""
    civ_healthy = Civilian(id="c1", coordinate=Coordinate(row=0, col=0), health=100)
    civ_failing = Civilian(id="c2", coordinate=Coordinate(row=0, col=0), health=20)

    score_healthy, b_healthy, _ = RescuePrioritizer.compute_priority_score(civ_healthy)
    score_failing, b_failing, _ = RescuePrioritizer.compute_priority_score(civ_failing)

    assert score_failing > score_healthy
    assert b_healthy.health_score == 0.0
    assert b_failing.health_score == round((100 - 20) * 0.30, 2)  # 24.0


def test_trapped_status_increases_priority():
    """Verify that trapped civilians receive the dedicated TRAPPED_BONUS (+15.0)."""
    civ_waiting = Civilian(id="c1", coordinate=Coordinate(row=0, col=0), status=CivilianStatus.WAITING)
    civ_trapped = Civilian(id="c2", coordinate=Coordinate(row=0, col=0), status=CivilianStatus.TRAPPED)

    score_w, b_w, _ = RescuePrioritizer.compute_priority_score(civ_waiting)
    score_t, b_t, _ = RescuePrioritizer.compute_priority_score(civ_trapped)

    assert b_w.trapped_score == 0.0
    assert b_t.trapped_score == 15.0
    assert score_t - score_w == 15.0


def test_dangerous_hazard_exposure_increases_priority():
    """Verify that dangerous environmental hazards (deep water, debris) increase priority score."""
    civ = Civilian(id="c1", coordinate=Coordinate(row=0, col=0))
    cell_safe = _make_cell(hazard=HazardState.SAFE)
    cell_danger = _make_cell(hazard=HazardState.DANGEROUS, water_level=2.0)

    score_safe, b_safe, _ = RescuePrioritizer.compute_priority_score(civ, cell_safe)
    score_danger, b_danger, _ = RescuePrioritizer.compute_priority_score(civ, cell_danger)

    assert b_safe.hazard_score == 0.0
    assert b_danger.hazard_score == 15.0
    assert score_danger > score_safe


def test_injured_status_affects_priority_as_documented():
    """Verify that injured status adds the INJURED_BONUS (+8.0)."""
    civ_waiting = Civilian(id="c1", coordinate=Coordinate(row=0, col=0), status=CivilianStatus.WAITING)
    civ_injured = Civilian(id="c2", coordinate=Coordinate(row=0, col=0), status=CivilianStatus.INJURED)

    score_w, b_w, _ = RescuePrioritizer.compute_priority_score(civ_waiting)
    score_inj, b_inj, _ = RescuePrioritizer.compute_priority_score(civ_injured)

    assert b_w.injured_score == 0.0
    assert b_inj.injured_score == 8.0
    assert score_inj - score_w == 8.0


def test_waiting_time_contribution_is_capped():
    """Verify that waiting time accumulates +1.0 per tick up to the strict 10.0 cap."""
    civ_5 = Civilian(id="c1", coordinate=Coordinate(row=0, col=0), waiting_ticks=5)
    civ_15 = Civilian(id="c2", coordinate=Coordinate(row=0, col=0), waiting_ticks=15)
    civ_100 = Civilian(id="c3", coordinate=Coordinate(row=0, col=0), waiting_ticks=100)

    _, b_5, _ = RescuePrioritizer.compute_priority_score(civ_5)
    _, b_15, _ = RescuePrioritizer.compute_priority_score(civ_15)
    _, b_100, _ = RescuePrioritizer.compute_priority_score(civ_100)

    assert b_5.waiting_score == 5.0
    assert b_15.waiting_score == 10.0
    assert b_100.waiting_score == 10.0  # Capped at MAX_WAITING_BONUS


def test_rescued_civilians_do_not_appear_in_active_queue():
    """Verify that civilians with RESCUED status are excluded from the active queue."""
    civilians = [
        Civilian(id="c1", coordinate=Coordinate(row=0, col=0), status=CivilianStatus.WAITING),
        Civilian(id="c2", coordinate=Coordinate(row=0, col=1), status=CivilianStatus.RESCUED),
        Civilian(id="c3", coordinate=Coordinate(row=0, col=2), status=CivilianStatus.INJURED),
    ]

    queue = RescuePrioritizer.rank_civilians(civilians=civilians, include_rescued=False)
    ids_in_queue = [item.civilian_id for item in queue]

    assert "c1" in ids_in_queue
    assert "c3" in ids_in_queue
    assert "c2" not in ids_in_queue
    assert len(queue) == 2


def test_tie_breaking_is_deterministic():
    """Verify deterministic tie-breaking by priority score, urgency rank, health, and ID."""
    # Two civilians with identical stats except ID
    civ_b = Civilian(id="civ_b", coordinate=Coordinate(row=0, col=0), urgency=UrgencyLevel.HIGH, health=80)
    civ_a = Civilian(id="civ_a", coordinate=Coordinate(row=0, col=0), urgency=UrgencyLevel.HIGH, health=80)

    # Pass civ_b first in list
    queue = RescuePrioritizer.rank_civilians(civilians=[civ_b, civ_a])

    assert len(queue) == 2
    # Because scores, urgency, and health are identical, alphabetic ID tie-breaker places civ_a first
    assert queue[0].civilian_id == "civ_a"
    assert queue[0].rank == 1
    assert queue[1].civilian_id == "civ_b"
    assert queue[1].rank == 2


def test_ranking_is_correct_for_hand_constructed_set():
    """Verify hand-constructed ranking where critical trapped civilian ranks #1."""
    # 1. Critical trapped civilian in deep flood (highest)
    civ_critical = Civilian(
        id="c_crit",
        coordinate=Coordinate(row=0, col=0),
        urgency=UrgencyLevel.CRITICAL,
        status=CivilianStatus.TRAPPED,
        health=20,
        waiting_ticks=4,
    )
    # 2. High urgency injured civilian in shallow water
    civ_high = Civilian(
        id="c_high",
        coordinate=Coordinate(row=1, col=1),
        urgency=UrgencyLevel.HIGH,
        status=CivilianStatus.INJURED,
        health=60,
        waiting_ticks=2,
    )
    # 3. Healthy civilian in safe sector
    civ_safe = Civilian(
        id="c_safe",
        coordinate=Coordinate(row=2, col=2),
        urgency=UrgencyLevel.LOW,
        status=CivilianStatus.WAITING,
        health=100,
        waiting_ticks=1,
    )

    matrix = [[_make_cell(r, c) for c in range(5)] for r in range(5)]
    matrix[0][0] = _make_cell(0, 0, hazard=HazardState.DANGEROUS, water_level=2.0)
    matrix[1][1] = _make_cell(1, 1, hazard=HazardState.FLOODED, water_level=0.5)
    grid = CityGrid(rows=5, cols=5, cells=matrix)

    queue = RescuePrioritizer.rank_civilians(civilians=[civ_safe, civ_critical, civ_high], grid=grid)

    assert queue[0].civilian_id == "c_crit"
    assert queue[1].civilian_id == "c_high"
    assert queue[2].civilian_id == "c_safe"
    assert queue[0].rank == 1
    assert queue[1].rank == 2
    assert queue[2].rank == 3


def test_score_explanations_agree_with_actual_components():
    """Verify that human-readable explanations correctly highlight dominant triage drivers."""
    civ = Civilian(
        id="c_test",
        coordinate=Coordinate(row=0, col=0),
        urgency=UrgencyLevel.CRITICAL,
        status=CivilianStatus.TRAPPED,
        health=15,
        waiting_ticks=5,
    )
    cell = _make_cell(0, 0, hazard=HazardState.DANGEROUS, water_level=1.8)

    _, breakdown, explanation = RescuePrioritizer.compute_priority_score(civ, cell)

    assert "Critical triage" in explanation
    assert "Trapped" in explanation
    assert "deep water danger" in explanation.lower()
    assert "15%" in explanation
    assert breakdown.urgency_score == 40.0
    assert breakdown.trapped_score == 15.0
    assert breakdown.hazard_score == 15.0


def test_ranking_requests_do_not_mutate_state():
    """Verify that computing priority scores or ranking civilians does not mutate any inputs."""
    civ = Civilian(
        id="c1",
        coordinate=Coordinate(row=0, col=0),
        urgency=UrgencyLevel.MEDIUM,
        status=CivilianStatus.WAITING,
        health=85,
        waiting_ticks=3,
    )
    original_dict = civ.model_dump()

    RescuePrioritizer.rank_civilians(civilians=[civ])

    assert civ.model_dump() == original_dict


def test_identical_state_produces_identical_rankings():
    """Verify mathematical determinism: identical state produces identical output queue."""
    civs = [
        Civilian(id=f"c_{i}", coordinate=Coordinate(row=i, col=i), health=100 - (i * 10))
        for i in range(5)
    ]

    queue_1 = RescuePrioritizer.rank_civilians(civilians=civs)
    queue_2 = RescuePrioritizer.rank_civilians(civilians=civs)

    assert len(queue_1) == len(queue_2)
    for it1, it2 in zip(queue_1, queue_2):
        assert it1.civilian_id == it2.civilian_id
        assert it1.priority_score == it2.priority_score
        assert it1.rank == it2.rank
