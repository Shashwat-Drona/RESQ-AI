"""Tests for SimulationEngine core lifecycle and state management."""

import pytest
from app.schemas.simulation import (
    DisasterType,
    SimulationStatus,
    StartSimulationRequest,
)
from app.services.simulation.engine import (
    SimulationEngine,
    SimulationNotRunningError,
)


def test_engine_initial_state_is_not_started():
    """Engine begins in not_started state without active grid."""
    engine = SimulationEngine()
    state = engine.get_state()
    assert state.status == SimulationStatus.NOT_STARTED
    assert state.current_tick == 0
    assert state.grid is None


def test_engine_start_scenario_returns_running_state():
    """Starting scenario sets status to RUNNING and initializes environment."""
    engine = SimulationEngine()
    req = StartSimulationRequest(
        scenario_id="flooded_neighborhood",
        seed=101,
        grid_rows=15,
        grid_cols=15,
        num_civilians=6,
    )
    state = engine.start(req)

    assert state.status == SimulationStatus.RUNNING
    assert state.current_tick == 0
    assert state.grid is not None
    assert state.grid.rows == 15
    assert state.grid.cols == 15
    assert len(state.civilians) == 6
    assert len(state.shelters) >= 1
    assert state.active_incidents > 0


def test_engine_step_advances_tick_by_one():
    """Stepping engine increments tick counter exactly once."""
    engine = SimulationEngine()
    engine.start(StartSimulationRequest(scenario_id="flooded_neighborhood"))
    assert engine.current_tick == 0

    res1 = engine.step()
    assert res1.current_tick == 1
    assert engine.current_tick == 1
    assert len(res1.events) > 0

    res2 = engine.step()
    assert res2.current_tick == 2
    assert engine.current_tick == 2


def test_engine_pause_and_prevent_tick_when_paused():
    """Paused simulation does not advance and raises SimulationNotRunningError on tick."""
    engine = SimulationEngine()
    engine.start(StartSimulationRequest(scenario_id="flooded_neighborhood"))
    engine.step()  # tick 1

    paused_state = engine.pause()
    assert paused_state.status == SimulationStatus.PAUSED

    # Attempting to tick while paused must fail
    with pytest.raises(SimulationNotRunningError):
        engine.step()

    # Tick counter must remain unchanged
    assert engine.current_tick == 1

    # Resume allows stepping again
    engine.resume()
    assert engine.status == SimulationStatus.RUNNING
    res = engine.step()
    assert res.current_tick == 2


def test_engine_reset_restores_initial_scenario():
    """Reset restores the initial seeded scenario (tick=0, same environment)."""
    engine = SimulationEngine()
    req = StartSimulationRequest(scenario_id="flooded_neighborhood", seed=555)
    initial_state = engine.start(req)

    # Advance 5 ticks
    for _ in range(5):
        engine.step()
    assert engine.current_tick == 5

    # Reset
    reset_state = engine.reset()
    assert reset_state.current_tick == 0
    assert reset_state.status == SimulationStatus.RUNNING
    assert reset_state.config.seed == 555
    assert len(reset_state.civilians) == len(initial_state.civilians)


def test_get_state_is_idempotent_and_non_mutating():
    """Calling get_state repeatedly does not advance ticks or modify state."""
    engine = SimulationEngine()
    engine.start(StartSimulationRequest(scenario_id="earthquake_district", seed=42))

    state1 = engine.get_state()
    state2 = engine.get_state()

    assert state1.current_tick == state2.current_tick
    assert state1.status == state2.status
    assert state1.active_incidents == state2.active_incidents


def test_simulation_determinism_reproducibility():
    """Identical seed and scenario must produce byte-for-byte identical agent and mission trajectories."""
    # Run 1
    engine1 = SimulationEngine()
    engine1.start(StartSimulationRequest(scenario_id="flooded_neighborhood", seed=777, max_agents=4))
    for _ in range(8):
        engine1.step()
    state1 = engine1.get_state()

    # Run 2
    engine2 = SimulationEngine()
    engine2.start(StartSimulationRequest(scenario_id="flooded_neighborhood", seed=777, max_agents=4))
    for _ in range(8):
        engine2.step()
    state2 = engine2.get_state()

    assert state1.current_tick == state2.current_tick == 8
    assert state1.rescued_count == state2.rescued_count
    assert len(state1.missions) == len(state2.missions)
    for a1, a2 in zip(state1.agents, state2.agents):
        assert a1.id == a2.id
        assert a1.coordinate == a2.coordinate
        assert a1.status == a2.status
        assert a1.completed_rescues == a2.completed_rescues


def test_pause_halts_agents_and_missions():
    """Pausing halts tick execution; resuming enables continuation without state corruption."""
    engine = SimulationEngine()
    engine.start(StartSimulationRequest(scenario_id="earthquake_district", seed=123, max_agents=3))
    engine.step()
    engine.step()

    # Pause
    paused_state = engine.pause()
    assert paused_state.status == SimulationStatus.PAUSED

    # Attempting step on paused engine raises SimulationNotRunningError
    with pytest.raises(SimulationNotRunningError):
        engine.step()

    # Telemetry unchanged while paused
    assert engine.current_tick == 2
    resumed_state = engine.resume()
    assert resumed_state.status == SimulationStatus.RUNNING

    # Step proceeds normally after resume
    tick3 = engine.step()
    assert tick3.current_tick == 3

