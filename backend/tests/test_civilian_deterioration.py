"""Comprehensive unit tests for CivilianDeteriorationModel and physiological decay."""

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
from app.schemas.simulation import (
    DisasterType,
    StartSimulationRequest,
)
from app.services.simulation.civilian_model import CivilianDeteriorationModel
from app.services.simulation.engine import SimulationEngine


def _make_grid(cells_desc) -> CityGrid:
    in_rows = len(cells_desc)
    in_cols = len(cells_desc[0])
    rows = max(5, in_rows)
    cols = max(5, in_cols)
    matrix = []
    for r in range(rows):
        row_cells = []
        for c in range(cols):
            if r < in_rows and c < in_cols:
                h, w, d = cells_desc[r][c]
            else:
                h, w, d = HazardState.SAFE, 0.0, 0.0
            row_cells.append(
                GridCell(
                    coordinate=Coordinate(row=r, col=c),
                    terrain=TerrainType.ROAD,
                    hazard=h,
                    water_level=w,
                    debris_severity=d,
                    traversable=(h != HazardState.DEBRIS_BLOCKED and w < 1.5),
                    elevation=1.0,
                )
            )
        matrix.append(row_cells)
    return CityGrid(rows=rows, cols=cols, cells=matrix)


def test_health_never_exceeds_100_or_drops_below_0():
    """Verify health is strictly clamped within [0, 100]."""
    civ_low = Civilian(id="c1", coordinate=Coordinate(row=0, col=0), health=4)
    civ_high = Civilian(id="c2", coordinate=Coordinate(row=0, col=1), health=100)

    grid = _make_grid([
        [(HazardState.DANGEROUS, 2.5, 0.0), (HazardState.SAFE, 0.0, 0.0)]
    ])

    # Tick 1: c1 loses 8 HP -> would be -4 without clamp
    CivilianDeteriorationModel.step_civilians([civ_low, civ_high], grid, current_tick=1)

    assert civ_low.health == 0
    assert civ_high.health == 100


def test_health_deterioration_follows_documented_rules():
    """Verify decay amounts: dangerous=-8, debris=-5, flood=-3, safe=0."""
    civ_danger = Civilian(id="c1", coordinate=Coordinate(row=0, col=0), health=100)
    civ_debris = Civilian(id="c2", coordinate=Coordinate(row=0, col=1), health=100)
    civ_flood = Civilian(id="c3", coordinate=Coordinate(row=0, col=2), health=100)
    civ_safe = Civilian(id="c4", coordinate=Coordinate(row=0, col=3), health=100)

    grid = _make_grid([[
        (HazardState.DANGEROUS, 2.0, 0.0),
        (HazardState.DEBRIS_BLOCKED, 0.0, 3.0),
        (HazardState.FLOODED, 0.8, 0.0),
        (HazardState.SAFE, 0.0, 0.0),
    ]])

    CivilianDeteriorationModel.step_civilians(
        [civ_danger, civ_debris, civ_flood, civ_safe], grid, current_tick=1
    )

    assert civ_danger.health == 100 - CivilianDeteriorationModel.DANGEROUS_DECAY  # 92
    assert civ_debris.health == 100 - CivilianDeteriorationModel.DEBRIS_DECAY      # 95
    assert civ_flood.health == 100 - CivilianDeteriorationModel.FLOOD_DECAY        # 97
    assert civ_safe.health == 100                                                # 100


def test_safe_civilians_do_not_receive_inappropriate_penalties():
    """Verify uninjured civilians in SAFE cells do not lose health."""
    civ_safe = Civilian(id="c1", coordinate=Coordinate(row=0, col=0), status=CivilianStatus.WAITING, health=100)
    grid = _make_grid([[(HazardState.SAFE, 0.0, 0.0)]])

    for t in range(1, 6):
        CivilianDeteriorationModel.step_civilians([civ_safe], grid, current_tick=t)

    assert civ_safe.health == 100
    assert civ_safe.waiting_ticks == 5


def test_dangerous_exposure_causes_expected_deterioration():
    """Verify repeated exposure to dangerous flood water steadily depletes health."""
    civ = Civilian(id="c1", coordinate=Coordinate(row=0, col=0), health=50)
    grid = _make_grid([[(HazardState.DANGEROUS, 2.0, 0.0)]])

    CivilianDeteriorationModel.step_civilians([civ], grid, current_tick=1)
    assert civ.health == 42
    assert civ.status == CivilianStatus.TRAPPED
    assert civ.urgency == UrgencyLevel.CRITICAL

    CivilianDeteriorationModel.step_civilians([civ], grid, current_tick=2)
    assert civ.health == 34


def test_urgency_escalation_at_documented_thresholds():
    """Verify health drops below 50 -> HIGH, and below 25 -> CRITICAL."""
    # Civilian starts at 54, in flooded cell (-3 per tick)
    civ = Civilian(
        id="c1",
        coordinate=Coordinate(row=0, col=0),
        health=52,
        urgency=UrgencyLevel.LOW,
        status=CivilianStatus.WAITING,
    )
    grid = _make_grid([[(HazardState.FLOODED, 0.5, 0.0)]])

    # Tick 1: health 52 -> 49 (<= 50) -> should escalate to HIGH
    events_1 = CivilianDeteriorationModel.step_civilians([civ], grid, current_tick=1)
    assert civ.health == 49
    assert civ.urgency == UrgencyLevel.HIGH
    assert any("HIGH" in e for e in events_1)

    # Set health to 26 and tick -> health 23 (<= 25) -> should escalate to CRITICAL
    civ.health = 26
    events_2 = CivilianDeteriorationModel.step_civilians([civ], grid, current_tick=2)
    assert civ.health == 23
    assert civ.urgency == UrgencyLevel.CRITICAL
    assert any("CRITICAL" in e for e in events_2)


def test_rescued_civilians_do_not_deteriorate():
    """Verify that rescued civilians never decay, never escalate, and never increment waiting ticks."""
    civ_rescued = Civilian(
        id="c_rescued",
        coordinate=Coordinate(row=0, col=0),
        status=CivilianStatus.RESCUED,
        health=40,
        urgency=UrgencyLevel.HIGH,
        waiting_ticks=3,
    )
    # Cell is dangerous, but civilian is already rescued
    grid = _make_grid([[(HazardState.DANGEROUS, 3.0, 0.0)]])

    CivilianDeteriorationModel.step_civilians([civ_rescued], grid, current_tick=1)

    assert civ_rescued.health == 40
    assert civ_rescued.waiting_ticks == 3  # unchanged
    assert civ_rescued.status == CivilianStatus.RESCUED
    assert civ_rescued.urgency == UrgencyLevel.HIGH


def test_each_tick_applies_condition_updates_exactly_once():
    """Verify that stepping tick advances waiting ticks by exactly 1 per unrescued civilian."""
    civ = Civilian(id="c1", coordinate=Coordinate(row=0, col=0), waiting_ticks=0)
    grid = _make_grid([[(HazardState.SAFE, 0.0, 0.0)]])

    CivilianDeteriorationModel.step_civilians([civ], grid, current_tick=1)
    assert civ.waiting_ticks == 1

    CivilianDeteriorationModel.step_civilians([civ], grid, current_tick=2)
    assert civ.waiting_ticks == 2


def test_engine_pause_prevents_civilian_progression():
    """Verify that pausing simulation prevents tick steps and civilian deterioration."""
    engine = SimulationEngine()
    engine.start(StartSimulationRequest(scenario_id="flooded_neighborhood", seed=101))
    engine.pause()

    # Attempting step while paused must raise SimulationNotRunningError
    from app.services.simulation.engine import SimulationNotRunningError
    import pytest
    with pytest.raises(SimulationNotRunningError):
        engine.step()


def test_engine_reset_restores_original_scenario_state():
    """Verify reset restores original civilian health, waiting ticks (0), and status."""
    engine = SimulationEngine()
    initial_state = engine.start(StartSimulationRequest(scenario_id="flooded_neighborhood", seed=101))
    initial_civ_healths = [c.health for c in initial_state.civilians]

    # Advance 3 ticks
    for _ in range(3):
        engine.step()

    # Reset
    reset_state = engine.reset()

    assert reset_state.current_tick == 0
    assert len(reset_state.civilians) == len(initial_state.civilians)
    for reset_civ, init_health in zip(reset_state.civilians, initial_civ_healths):
        assert reset_civ.health == init_health
        assert reset_civ.waiting_ticks == 0


def test_identical_seeds_produce_reproducible_deterioration():
    """Verify deterministic outcomes for identical seed and tick sequences."""
    engine1 = SimulationEngine()
    engine1.start(StartSimulationRequest(scenario_id="flooded_neighborhood", seed=321))
    for _ in range(4):
        engine1.step()

    engine2 = SimulationEngine()
    engine2.start(StartSimulationRequest(scenario_id="flooded_neighborhood", seed=321))
    for _ in range(4):
        engine2.step()

    for c1, c2 in zip(engine1.civilians, engine2.civilians):
        assert c1.id == c2.id
        assert c1.health == c2.health
        assert c1.status == c2.status
        assert c1.urgency == c2.urgency
        assert c1.waiting_ticks == c2.waiting_ticks
