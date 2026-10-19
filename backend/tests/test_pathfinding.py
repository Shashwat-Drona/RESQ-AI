"""Comprehensive automated tests for A* pathfinding algorithm."""

import copy
import heapq
from typing import Dict, List, Optional, Tuple
from app.schemas.environment import (
    CityGrid,
    Coordinate,
    GridCell,
    HazardState,
    TerrainType,
)
from app.schemas.route import MovementProfile, RouteResponse
from app.services.simulation.pathfinding import AStarPathfinder


def create_test_grid(rows: int, cols: int, fill: TerrainType = TerrainType.ROAD) -> CityGrid:
    """Helper to build an isolated small test grid with uniform terrain."""
    cells: List[List[GridCell]] = []
    for r in range(rows):
        row: List[GridCell] = []
        for c in range(cols):
            row.append(
                GridCell(
                    coordinate=Coordinate(row=r, col=c),
                    terrain=fill,
                    hazard=HazardState.SAFE,
                    water_level=0.0,
                    debris_severity=0.0,
                    traversable=True,
                    elevation=1.0,
                )
            )
        cells.append(row)
    return CityGrid(rows=rows, cols=cols, cells=cells)


def dijkstra_reference_cost(
    grid: CityGrid,
    start: Tuple[int, int],
    goal: Tuple[int, int],
    profile: MovementProfile,
) -> Optional[float]:
    """Independent Dijkstra shortest-path reference implementation to verify A* optimality."""
    sr, sc = start
    gr, gc = goal
    if (sr, sc) == (gr, gc):
        return 0.0

    dist: Dict[Tuple[int, int], float] = {(sr, sc): 0.0}
    pq: List[Tuple[float, Tuple[int, int]]] = [(0.0, (sr, sc))]
    visited = set()

    while pq:
        d, curr = heapq.heappop(pq)
        if curr in visited:
            continue
        visited.add(curr)

        if curr == (gr, gc):
            return round(d, 2)

        cr, cc = curr
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = cr + dr, cc + dc
            if 0 <= nr < grid.rows and 0 <= nc < grid.cols:
                cost = AStarPathfinder.get_cell_cost(grid.cells[nr][nc], profile)
                if cost is not None:
                    new_d = d + cost
                    if new_d < dist.get((nr, nc), float("inf")):
                        dist[(nr, nc)] = new_d
                        heapq.heappush(pq, (new_d, (nr, nc)))
    return None


def test_direct_route_unobstructed_grid():
    """1. Direct straight route through an unobstructed road grid."""
    grid = create_test_grid(5, 5)
    start = Coordinate(row=0, col=0)
    goal = Coordinate(row=0, col=4)

    result = AStarPathfinder.plan_route(grid, start, goal)
    assert result.found is True
    assert result.path_length == 4
    assert result.total_cost == 4.0
    assert result.path == [Coordinate(row=0, col=c) for c in range(5)]


def test_route_around_building():
    """2. Route must detour around a building blocking the straight line."""
    grid = create_test_grid(5, 5)
    # Place building blocking (1, 1) and (1, 2)
    grid.cells[1][1].terrain = TerrainType.BUILDING
    grid.cells[1][1].traversable = False
    grid.cells[1][2].terrain = TerrainType.BUILDING
    grid.cells[1][2].traversable = False

    start = Coordinate(row=1, col=0)
    goal = Coordinate(row=1, col=3)

    result = AStarPathfinder.plan_route(grid, start, goal)
    assert result.found is True
    assert result.path_length > 3  # Must detour
    for coord in result.path:
        cell = grid.cells[coord.row][coord.col]
        assert cell.terrain != TerrainType.BUILDING


def test_route_avoids_debris_blocked_cell():
    """3. Route avoids a road cell choked with earthquake rubble."""
    grid = create_test_grid(5, 5)
    # Block road at (0, 2)
    grid.cells[0][2].hazard = HazardState.DEBRIS_BLOCKED
    grid.cells[0][2].debris_severity = 3.5
    grid.cells[0][2].traversable = False

    start = Coordinate(row=0, col=0)
    goal = Coordinate(row=0, col=4)

    result = AStarPathfinder.plan_route(grid, start, goal)
    assert result.found is True
    assert Coordinate(row=0, col=2) not in result.path


def test_ground_responder_avoids_dangerous_water():
    """4. Ground responder vehicle cannot traverse deep water (>= 1.5m)."""
    grid = create_test_grid(5, 5)
    # Place deep flood line across col 2
    for r in range(4):
        grid.cells[r][2].water_level = 2.0
        grid.cells[r][2].hazard = HazardState.DANGEROUS
        grid.cells[r][2].traversable = False

    # Keep (4, 2) safe for passage
    grid.cells[4][2].water_level = 0.0

    start = Coordinate(row=1, col=0)
    goal = Coordinate(row=1, col=4)

    result = AStarPathfinder.plan_route(grid, start, goal, MovementProfile.GROUND_RESPONDER)
    assert result.found is True
    # The route must detour through the safe gap at row 4
    path_tuples = [(c.row, c.col) for c in result.path]
    assert (4, 2) in path_tuples
    for c in result.path:
        assert grid.cells[c.row][c.col].water_level < 1.50


def test_longer_safe_route_preferred_over_costly_shallow_water():
    """5. A longer safe path is chosen over a shorter route through high-cost flooded cells."""
    grid = create_test_grid(5, 5)
    # Direct middle path (row 1) has high water level (high cost = ~3.7 per cell)
    grid.cells[1][1].hazard = HazardState.FLOODED
    grid.cells[1][1].water_level = 1.0
    grid.cells[1][2].hazard = HazardState.FLOODED
    grid.cells[1][2].water_level = 1.0
    grid.cells[1][3].hazard = HazardState.FLOODED
    grid.cells[1][3].water_level = 1.0

    # Row 0 is dry and clear (cost = 1.0 per cell)
    start = Coordinate(row=1, col=0)
    goal = Coordinate(row=1, col=4)

    result = AStarPathfinder.plan_route(grid, start, goal)
    assert result.found is True
    # Path should detour through dry row 0 to minimize total cost
    path_tuples = [(c.row, c.col) for c in result.path]
    assert (0, 1) in path_tuples or (0, 2) in path_tuples


def test_fully_blocked_destination_returns_not_found():
    """6. Destination completely enclosed by buildings returns found=False with clear reason."""
    grid = create_test_grid(5, 5)
    # Enclose (2, 2) with buildings
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        grid.cells[2 + dr][2 + dc].terrain = TerrainType.BUILDING
        grid.cells[2 + dr][2 + dc].traversable = False

    start = Coordinate(row=0, col=0)
    goal = Coordinate(row=2, col=2)

    result = AStarPathfinder.plan_route(grid, start, goal)
    assert result.found is False
    assert len(result.path) == 0
    assert result.reason is not None
    assert "No traversable route" in result.reason


def test_out_of_bounds_coordinates_handled():
    """7. Out of bounds start and goal coordinates return found=False with descriptive reason."""
    grid = create_test_grid(5, 5)

    res_start_oob = AStarPathfinder.plan_route(grid, Coordinate(row=10, col=2), Coordinate(row=2, col=2))
    assert res_start_oob.found is False
    assert "out of grid bounds" in res_start_oob.reason

    res_goal_oob = AStarPathfinder.plan_route(grid, Coordinate(row=0, col=0), Coordinate(row=10, col=10))
    assert res_goal_oob.found is False
    assert "out of grid bounds" in res_goal_oob.reason


def test_start_equals_goal():
    """8. Start equal to goal succeeds with single coordinate and zero cost."""
    grid = create_test_grid(5, 5)
    coord = Coordinate(row=2, col=3)

    result = AStarPathfinder.plan_route(grid, coord, coord)
    assert result.found is True
    assert result.path == [coord]
    assert result.path_length == 0
    assert result.total_cost == 0.0
    assert result.expanded_nodes == 0


def test_deterministic_output_for_identical_requests():
    """9. Repeated calls on the same grid produce identical paths and costs."""
    grid = create_test_grid(8, 8)
    grid.cells[2][2].terrain = TerrainType.BUILDING
    grid.cells[3][3].hazard = HazardState.DEBRIS_BLOCKED

    start = Coordinate(row=0, col=0)
    goal = Coordinate(row=7, col=7)

    res1 = AStarPathfinder.plan_route(grid, start, goal)
    res2 = AStarPathfinder.plan_route(grid, start, goal)

    assert res1.found is True
    assert res1.path == res2.path
    assert res1.total_cost == res2.total_cost
    assert res1.expanded_nodes == res2.expanded_nodes


def test_path_length_and_total_cost_correctness():
    """10. path_length strictly equals len(path) - 1, and total_cost equals sum of edge costs."""
    grid = create_test_grid(6, 6)
    grid.cells[1][1].terrain = TerrainType.OPEN_GROUND  # cost 1.2
    grid.cells[1][2].terrain = TerrainType.ROAD         # cost 1.0

    start = Coordinate(row=0, col=0)
    goal = Coordinate(row=3, col=3)

    result = AStarPathfinder.plan_route(grid, start, goal)
    assert result.found is True
    assert result.path_length == len(result.path) - 1

    # Sum costs of all steps from index 1 onwards
    calculated_sum = sum(
        AStarPathfinder.get_cell_cost(grid.cells[c.row][c.col], result.movement_profile)
        for c in result.path[1:]
    )
    assert round(result.total_cost, 2) == round(calculated_sum, 2)


def test_admissible_heuristic_and_optimality_against_dijkstra():
    """11. Verify A* optimality and admissibility by comparing costs with Dijkstra reference."""
    grid = create_test_grid(7, 7)
    # Add random terrain and water costs
    grid.cells[1][2].terrain = TerrainType.BUILDING
    grid.cells[2][2].terrain = TerrainType.BUILDING
    grid.cells[3][2].terrain = TerrainType.BUILDING
    grid.cells[2][4].hazard = HazardState.FLOODED
    grid.cells[2][4].water_level = 0.5

    for profile in [MovementProfile.GROUND_RESPONDER, MovementProfile.ON_FOOT]:
        start = Coordinate(row=0, col=1)
        goal = Coordinate(row=5, col=5)

        astar_result = AStarPathfinder.plan_route(grid, start, goal, profile)
        assert astar_result.found is True

        dijkstra_cost = dijkstra_reference_cost(grid, (0, 1), (5, 5), profile)
        assert dijkstra_cost is not None
        # A* cost must match the optimal Dijkstra cost exactly!
        assert round(astar_result.total_cost, 2) == dijkstra_cost


def test_strictly_four_directional_no_diagonal_steps():
    """12. Consecutive path coordinates must strictly have Manhattan distance == 1."""
    grid = create_test_grid(8, 8)
    # Add obstacles to force winding path
    grid.cells[2][1].terrain = TerrainType.BUILDING
    grid.cells[2][2].terrain = TerrainType.BUILDING
    grid.cells[4][4].terrain = TerrainType.BUILDING

    result = AStarPathfinder.plan_route(grid, Coordinate(row=0, col=0), Coordinate(row=7, col=7))
    assert result.found is True

    for i in range(len(result.path) - 1):
        c1 = result.path[i]
        c2 = result.path[i + 1]
        step_dist = abs(c1.row - c2.row) + abs(c1.col - c2.col)
        assert step_dist == 1, f"Diagonal or non-adjacent step detected between {c1} and {c2}"


def test_movement_profiles_differing_capabilities():
    """13. Open ground is cheaper for on_foot (1.0) than ground_responder vehicle (1.2)."""
    grid = create_test_grid(5, 5, fill=TerrainType.OPEN_GROUND)
    start = Coordinate(row=0, col=0)
    goal = Coordinate(row=0, col=4)

    res_vehicle = AStarPathfinder.plan_route(grid, start, goal, MovementProfile.GROUND_RESPONDER)
    res_foot = AStarPathfinder.plan_route(grid, start, goal, MovementProfile.ON_FOOT)

    assert res_vehicle.found is True
    assert res_foot.found is True
    # On foot responder traverses open ground at standard rate 1.0, vehicle at 1.2
    assert res_foot.total_cost < res_vehicle.total_cost


def test_returned_path_never_contains_impassable_cells():
    """14. A returned path must never step on buildings, debris, or deep water."""
    grid = create_test_grid(6, 6)
    grid.cells[1][1].terrain = TerrainType.BUILDING
    grid.cells[2][2].hazard = HazardState.DEBRIS_BLOCKED
    grid.cells[3][3].water_level = 2.5
    grid.cells[3][3].hazard = HazardState.DANGEROUS

    result = AStarPathfinder.plan_route(grid, Coordinate(row=0, col=0), Coordinate(row=5, col=5))
    assert result.found is True

    for coord in result.path:
        cell = grid.cells[coord.row][coord.col]
        assert cell.terrain != TerrainType.BUILDING
        assert cell.hazard != HazardState.DEBRIS_BLOCKED
        assert cell.water_level < 1.50


def test_grid_remains_unmutated_after_planning():
    """15. Calling plan_route does not alter any cell property in the input grid."""
    grid = create_test_grid(5, 5)
    grid.cells[1][2].water_level = 0.8
    grid.cells[1][2].hazard = HazardState.FLOODED

    # Deep copy before planning
    original_dump = copy.deepcopy(grid.model_dump())

    _ = AStarPathfinder.plan_route(grid, Coordinate(row=0, col=0), Coordinate(row=4, col=4))

    # Assert grid is completely identical
    assert grid.model_dump() == original_dump
