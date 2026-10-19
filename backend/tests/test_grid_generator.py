"""Tests for synthetic city grid procedural generator."""

from app.schemas.environment import HazardState, TerrainType
from app.services.simulation.grid_generator import CityGridGenerator


def test_city_grid_generator_dimensions_and_bounds():
    """Verify generated grid respects exact requested dimensions and cell bounds."""
    rows, cols = 15, 12
    grid, civilians, shelters = CityGridGenerator.generate(
        rows=rows, cols=cols, num_civilians=6, num_shelters=2, seed=123
    )

    assert grid.rows == rows
    assert grid.cols == cols
    assert len(grid.cells) == rows
    assert all(len(row) == cols for row in grid.cells)

    for r in range(rows):
        for c in range(cols):
            cell = grid.cells[r][c]
            assert cell.coordinate.row == r
            assert cell.coordinate.col == c
            assert 0.0 <= cell.water_level <= 10.0
            assert 0.0 <= cell.debris_severity <= 5.0


def test_city_grid_reproducibility_with_seed():
    """Verify that identical seeds produce identical grids, civilians, and shelters."""
    grid1, civs1, shelters1 = CityGridGenerator.generate(
        rows=10, cols=10, num_civilians=5, num_shelters=1, seed=999
    )
    grid2, civs2, shelters2 = CityGridGenerator.generate(
        rows=10, cols=10, num_civilians=5, num_shelters=1, seed=999
    )

    assert grid1.model_dump() == grid2.model_dump()
    assert [c.model_dump() for c in civs1] == [c.model_dump() for c in civs2]
    assert [s.model_dump() for s in shelters1] == [s.model_dump() for s in shelters2]


def test_city_grid_different_seeds_produce_variation():
    """Verify that different seeds produce different layouts."""
    grid1, _, _ = CityGridGenerator.generate(rows=12, cols=12, seed=111)
    grid2, _, _ = CityGridGenerator.generate(rows=12, cols=12, seed=222)

    terrains1 = [cell.terrain for row in grid1.cells for cell in row]
    terrains2 = [cell.terrain for row in grid2.cells for cell in row]
    assert terrains1 != terrains2


def test_buildings_are_not_traversable():
    """Verify that building cells are strictly marked non-traversable."""
    grid, _, _ = CityGridGenerator.generate(rows=10, cols=10, seed=42)

    building_cells = [
        cell
        for row in grid.cells
        for cell in row
        if cell.terrain == TerrainType.BUILDING
    ]
    assert len(building_cells) > 0
    for cell in building_cells:
        assert cell.traversable is False


def test_shelters_and_civilians_valid_locations():
    """Verify shelters and civilians are placed on accessible cells, not inside solid buildings."""
    rows, cols = 16, 16
    grid, civilians, shelters = CityGridGenerator.generate(
        rows=rows, cols=cols, num_civilians=8, num_shelters=2, seed=777
    )

    assert len(shelters) == 2
    for s in shelters:
        assert 0 <= s.coordinate.row < rows
        assert 0 <= s.coordinate.col < cols
        cell = grid.cells[s.coordinate.row][s.coordinate.col]
        assert cell.terrain == TerrainType.SHELTER
        assert cell.traversable is True

    assert len(civilians) == 8
    for civ in civilians:
        assert 0 <= civ.coordinate.row < rows
        assert 0 <= civ.coordinate.col < cols
        cell = grid.cells[civ.coordinate.row][civ.coordinate.col]
        # Civilians must not be placed inside impassable buildings
        assert cell.terrain != TerrainType.BUILDING
