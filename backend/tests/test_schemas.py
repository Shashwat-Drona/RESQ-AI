"""Unit tests for Pydantic schema validation."""

import pytest
from pydantic import ValidationError
from app.schemas.simulation import (
    Coordinate,
    DisasterType,
    SimulationConfig,
    SimulationState,
    SimulationStatus,
)


def test_coordinate_valid():
    """Coordinate must accept non-negative integer row and column."""
    coord = Coordinate(row=4, col=12)
    assert coord.row == 4
    assert coord.col == 12


def test_coordinate_invalid_negative():
    """Coordinate must reject negative values."""
    with pytest.raises(ValidationError):
        Coordinate(row=-1, col=5)

    with pytest.raises(ValidationError):
        Coordinate(row=0, col=-2)


def test_simulation_config_valid_bounds():
    """SimulationConfig accepts valid configurations."""
    cfg = SimulationConfig(
        grid_rows=10,
        grid_cols=15,
        max_agents=3,
        disaster_type=DisasterType.EARTHQUAKE,
        tick_interval_seconds=2.5,
    )
    assert cfg.grid_rows == 10
    assert cfg.grid_cols == 15
    assert cfg.max_agents == 3
    assert cfg.disaster_type == DisasterType.EARTHQUAKE
    assert cfg.tick_interval_seconds == 2.5


def test_simulation_config_rejects_out_of_bounds():
    """SimulationConfig rejects out-of-bound agents and tick intervals."""
    # Max agents cannot be 0
    with pytest.raises(ValidationError):
        SimulationConfig(max_agents=0)

    # Grid rows cannot be less than 5
    with pytest.raises(ValidationError):
        SimulationConfig(grid_rows=4)

    # Tick interval cannot be <= 0
    with pytest.raises(ValidationError):
        SimulationConfig(tick_interval_seconds=0.0)


def test_simulation_state_initial_defaults():
    """SimulationState default must be NOT_STARTED with zero ticks."""
    cfg = SimulationConfig()
    state = SimulationState(config=cfg)
    assert state.status == SimulationStatus.NOT_STARTED
    assert state.current_tick == 0
    assert state.active_incidents == 0
    assert state.active_agents == 0
    assert state.rescued_count == 0
