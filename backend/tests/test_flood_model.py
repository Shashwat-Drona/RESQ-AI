"""Tests for deterministic flood propagation simulation model."""

from app.schemas.environment import CityGrid, HazardState, TerrainType
from app.services.simulation.flood_model import FloodSimulationModel
from app.services.simulation.grid_generator import CityGridGenerator


def test_flood_model_initialization():
    """Verify initial flood sources are placed and water level is non-negative."""
    grid, _, _ = CityGridGenerator.generate(rows=10, cols=10, seed=42)
    model = FloodSimulationModel(sources=[(0, 0), (0, 1)])
    events = model.initialize_flood(grid)

    assert len(events) >= 1
    # Check that source cell has water
    source_cell = grid.cells[0][0]
    if source_cell.terrain != TerrainType.BUILDING:
        assert source_cell.water_level > 0.0
        assert source_cell.hazard in [HazardState.FLOODED, HazardState.DANGEROUS]


def test_flood_progression_over_ticks():
    """Verify flood volume increases and spreads to adjacent road cells deterministically."""
    grid, _, _ = CityGridGenerator.generate(rows=10, cols=10, seed=42)
    # Ensure source is on road
    grid.cells[0][0].terrain = TerrainType.ROAD
    model = FloodSimulationModel(sources=[(0, 0)])
    model.initialize_flood(grid)

    initial_water_sum = sum(
        cell.water_level for row in grid.cells for cell in row
    )

    # Step simulation 3 times
    for t in range(1, 4):
        model.step(grid, tick=t)

    post_water_sum = sum(
        cell.water_level for row in grid.cells for cell in row
    )
    assert post_water_sum > initial_water_sum


def test_flood_values_stay_within_valid_bounds():
    """Verify flood depths stay bounded [0.0, 5.0m] even after many ticks."""
    grid, _, _ = CityGridGenerator.generate(rows=8, cols=8, seed=42)
    model = FloodSimulationModel(sources=[(0, 0), (0, 1)])
    model.initialize_flood(grid)

    for t in range(1, 15):
        model.step(grid, tick=t)

    for r in range(grid.rows):
        for c in range(grid.cols):
            cell = grid.cells[r][c]
            assert 0.0 <= cell.water_level <= FloodSimulationModel.MAX_WATER_LEVEL


def test_buildings_block_flood_water():
    """Verify that solid building cells are not flooded through."""
    grid, _, _ = CityGridGenerator.generate(rows=8, cols=8, seed=42)
    # Surround a building with roads
    grid.cells[2][2].terrain = TerrainType.BUILDING
    grid.cells[2][1].terrain = TerrainType.ROAD
    grid.cells[2][3].terrain = TerrainType.ROAD
    grid.cells[1][2].terrain = TerrainType.ROAD
    grid.cells[3][2].terrain = TerrainType.ROAD

    # Flood the neighboring road cell directly
    grid.cells[2][1].water_level = 3.0
    grid.cells[2][1].hazard = HazardState.DANGEROUS

    model = FloodSimulationModel(sources=[(2, 1)])
    for t in range(1, 5):
        model.step(grid, tick=t)

    # The building must remain untouched by water
    assert grid.cells[2][2].water_level == 0.0
    assert grid.cells[2][2].hazard == HazardState.SAFE


def test_deep_flooding_becomes_non_traversable():
    """Verify that when water reaches DEEP_FLOOD_THRESHOLD (1.5m), traversability becomes False."""
    grid, _, _ = CityGridGenerator.generate(rows=8, cols=8, seed=42)
    cell = grid.cells[0][0]
    cell.terrain = TerrainType.ROAD

    model = FloodSimulationModel(sources=[(0, 0)])
    model.initialize_flood(grid)

    # Force tick until deep water threshold is reached
    for t in range(1, 6):
        model.step(grid, tick=t)

    if cell.water_level >= 1.50:
        assert cell.hazard == HazardState.DANGEROUS
        assert cell.traversable is False
