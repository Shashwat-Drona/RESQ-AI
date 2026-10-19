"""Tests for deterministic earthquake damage and aftershock model."""

from app.schemas.environment import HazardState, TerrainType
from app.services.simulation.earthquake_model import EarthquakeSimulationModel
from app.services.simulation.grid_generator import CityGridGenerator


def test_earthquake_initialization_creates_rubble_and_blocks_roads():
    """Verify earthquake tremor damages buildings and blocks adjacent roads with debris."""
    grid, _, shelters = CityGridGenerator.generate(rows=14, cols=14, seed=42)
    model = EarthquakeSimulationModel(epicenter=(7, 7), intensity=7.0, seed=42)
    events = model.initialize_earthquake(grid)

    assert len(events) >= 2
    # Verify that at least some road cells are now blocked with debris
    blocked_cells = [
        cell
        for row in grid.cells
        for cell in row
        if cell.hazard == HazardState.DEBRIS_BLOCKED
    ]
    assert len(blocked_cells) > 0
    for cell in blocked_cells:
        assert cell.traversable is False
        assert cell.debris_severity >= 2.0


def test_shelters_are_protected_from_earthquake_destruction():
    """Verify that shelters remain safe and operational despite nearby earthquake tremors."""
    grid, _, shelters = CityGridGenerator.generate(rows=12, cols=12, seed=42)
    for s in shelters:
        # Place epicenter near shelter to test resilience
        model = EarthquakeSimulationModel(
            epicenter=(s.coordinate.row, s.coordinate.col),
            intensity=7.5,
            seed=42,
        )
        model.initialize_earthquake(grid)
        shelter_cell = grid.cells[s.coordinate.row][s.coordinate.col]
        assert shelter_cell.hazard == HazardState.SAFE
        assert shelter_cell.traversable is True


def test_earthquake_scheduled_aftershocks_occur_on_designated_ticks():
    """Verify aftershocks trigger exclusively on designated ticks, not on all ticks."""
    grid, _, _ = CityGridGenerator.generate(rows=12, cols=12, seed=42)
    model = EarthquakeSimulationModel(epicenter=(6, 6), intensity=6.5, seed=42)
    model.initialize_earthquake(grid)

    # Tick 1: No scheduled aftershock
    events_t1 = model.step(grid, tick=1)
    assert not any("Aftershock" in e for e in events_t1)

    # Tick 3: Scheduled aftershock in self.aftershock_ticks
    events_t3 = model.step(grid, tick=3)
    assert any("Aftershock" in e for e in events_t3)
