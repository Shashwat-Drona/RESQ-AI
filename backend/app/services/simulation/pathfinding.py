"""A* Pathfinding and Dynamic Route Planning Engine for RESQ-AI."""

import heapq
import itertools
from typing import Dict, List, Optional, Set, Tuple

from app.schemas.environment import (
    CityGrid,
    Coordinate,
    GridCell,
    HazardState,
    TerrainType,
)
from app.schemas.route import MovementProfile, RouteResponse


class AStarPathfinder:
    """Deterministic A* pathfinder supporting 4-directional navigation with hazard-aware movement costs."""

    # 4-Directional movement: Up, Down, Left, Right (no diagonal steps)
    DIRECTIONS: List[Tuple[int, int]] = [
        (-1, 0),  # Up
        (1, 0),   # Down
        (0, -1),  # Left
        (0, 1),   # Right
    ]

    # Minimum edge traversal cost across any cell (used to scale Manhattan heuristic)
    MIN_EDGE_COST: float = 1.0

    @classmethod
    def get_cell_cost(cls, cell: GridCell, profile: MovementProfile) -> Optional[float]:
        """Evaluate the traversal cost of entering a cell for a given movement profile.
        
        Returns:
            Positive float (>= 1.0) if traversable.
            None if cell is impassable.
        """
        # Buildings are universally impassable for rescue units
        if cell.terrain == TerrainType.BUILDING:
            return None

        # Debris-blocked cells are impassable
        if cell.hazard == HazardState.DEBRIS_BLOCKED or cell.debris_severity >= 2.0:
            return None

        # Movement Profile: Ground Responder (Emergency Vehicle)
        if profile == MovementProfile.GROUND_RESPONDER:
            # Deep flood water >= 1.50m or DANGEROUS status is impassable
            if cell.hazard == HazardState.DANGEROUS or cell.water_level >= 1.50:
                return None

            # Shallow flooded road or open ground (passable with reduced speed / higher cost)
            if cell.hazard == HazardState.FLOODED or cell.water_level >= 0.25:
                base = 2.2 if cell.terrain == TerrainType.ROAD else 2.6
                return round(base + (cell.water_level * 1.5), 2)

            # Safe standard terrain
            if cell.terrain in [TerrainType.ROAD, TerrainType.SHELTER]:
                return 1.0
            elif cell.terrain == TerrainType.OPEN_GROUND:
                return 1.2
            else:
                return 1.0

        # Movement Profile: On Foot (Pedestrian Responder)
        elif profile == MovementProfile.ON_FOOT:
            # Responders on foot cannot safely wade through water >= 1.20m
            if cell.hazard == HazardState.DANGEROUS or cell.water_level >= 1.20:
                return None

            # Shallow water wading cost
            if cell.hazard == HazardState.FLOODED or cell.water_level >= 0.25:
                base = 1.8 if cell.terrain == TerrainType.ROAD else 2.0
                return round(base + (cell.water_level * 1.2), 2)

            # Safe standard terrain
            if cell.terrain in [TerrainType.ROAD, TerrainType.SHELTER, TerrainType.OPEN_GROUND]:
                return 1.0
            else:
                return 1.0

        return None

    @classmethod
    def manhattan_distance(cls, r1: int, c1: int, r2: int, c2: int) -> float:
        """Compute the Manhattan distance heuristic between two cells.
        
        Since minimum edge cost across all terrain is 1.0, Manhattan distance
        never overestimates the true remaining cost, guaranteeing admissibility.
        """
        return float(abs(r1 - r2) + abs(c1 - c2)) * cls.MIN_EDGE_COST

    @classmethod
    def plan_route(
        cls,
        grid: CityGrid,
        start: Coordinate,
        goal: Coordinate,
        profile: MovementProfile = MovementProfile.GROUND_RESPONDER,
    ) -> RouteResponse:
        """Find an optimal A* path between start and goal on the given city grid.
        
        Guarantees:
        - 4-directional Manhattan distance heuristic.
        - Stable tie-breaking using priority queue counter.
        - Idempotence: Does not mutate the input grid or cell properties.
        - Correct cost accumulation and expanded node tracking.
        """
        sr, sc = start.row, start.col
        gr, gc = goal.row, goal.col

        # 1. Coordinate bounds verification
        if not (0 <= sr < grid.rows and 0 <= sc < grid.cols):
            return RouteResponse(
                found=False,
                start=start,
                goal=goal,
                path=[],
                path_length=0,
                total_cost=0.0,
                expanded_nodes=0,
                movement_profile=profile,
                reason=f"Start coordinate ({sr}, {sc}) is out of grid bounds (0..{grid.rows - 1}, 0..{grid.cols - 1}).",
            )

        if not (0 <= gr < grid.rows and 0 <= gc < grid.cols):
            return RouteResponse(
                found=False,
                start=start,
                goal=goal,
                path=[],
                path_length=0,
                total_cost=0.0,
                expanded_nodes=0,
                movement_profile=profile,
                reason=f"Goal coordinate ({gr}, {gc}) is out of grid bounds (0..{grid.rows - 1}, 0..{grid.cols - 1}).",
            )

        # 2. Endpoint passability checks
        start_cell = grid.cells[sr][sc]
        start_cost = cls.get_cell_cost(start_cell, profile)
        if start_cost is None:
            return RouteResponse(
                found=False,
                start=start,
                goal=goal,
                path=[],
                path_length=0,
                total_cost=0.0,
                expanded_nodes=0,
                movement_profile=profile,
                reason=f"Start position ({sr}, {sc}) is impassable for {profile.value} (Terrain: {start_cell.terrain.value}, Hazard: {start_cell.hazard.value}).",
            )

        goal_cell = grid.cells[gr][gc]
        goal_cost = cls.get_cell_cost(goal_cell, profile)
        if goal_cost is None:
            return RouteResponse(
                found=False,
                start=start,
                goal=goal,
                path=[],
                path_length=0,
                total_cost=0.0,
                expanded_nodes=0,
                movement_profile=profile,
                reason=f"Destination ({gr}, {gc}) is impassable for {profile.value} (Terrain: {goal_cell.terrain.value}, Hazard: {goal_cell.hazard.value}).",
            )

        # 3. Trivial path check: start == goal
        if (sr, sc) == (gr, gc):
            return RouteResponse(
                found=True,
                start=start,
                goal=goal,
                path=[start],
                path_length=0,
                total_cost=0.0,
                expanded_nodes=0,
                movement_profile=profile,
            )

        # 4. A* Search Data Structures
        tie_counter = itertools.count()
        start_coord = (sr, sc)
        goal_coord = (gr, gc)

        # g_score: exact cost from start to current node
        g_score: Dict[Tuple[int, int], float] = {start_coord: 0.0}

        # came_from: tracks predecessor for path reconstruction
        came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}

        # closed_set: visited nodes whose optimal path is established
        closed_set: Set[Tuple[int, int]] = set()

        # open_set: priority queue entries: (f_score, h_score, tie_breaker, coordinate)
        initial_h = cls.manhattan_distance(sr, sc, gr, gc)
        open_queue: List[Tuple[float, float, int, Tuple[int, int]]] = [
            (initial_h, initial_h, next(tie_counter), start_coord)
        ]

        expanded_nodes = 0

        while open_queue:
            current_f, current_h, _, current = heapq.heappop(open_queue)

            if current in closed_set:
                continue

            closed_set.add(current)
            expanded_nodes += 1

            # Goal reached!
            if current == goal_coord:
                # Reconstruct path
                path_tuples: List[Tuple[int, int]] = [current]
                while current in came_from:
                    current = came_from[current]
                    path_tuples.append(current)
                path_tuples.reverse()

                path_coords = [Coordinate(row=r, col=c) for r, c in path_tuples]
                total_cost = round(g_score[goal_coord], 2)

                return RouteResponse(
                    found=True,
                    start=start,
                    goal=goal,
                    path=path_coords,
                    path_length=len(path_coords) - 1,
                    total_cost=total_cost,
                    expanded_nodes=expanded_nodes,
                    movement_profile=profile,
                )

            cr, cc = current
            current_g = g_score[current]

            # Explore 4-directional neighbors in fixed, deterministic order
            for dr, dc in cls.DIRECTIONS:
                nr, nc = cr + dr, cc + dc

                if not (0 <= nr < grid.rows and 0 <= nc < grid.cols):
                    continue

                neighbor_coord = (nr, nc)
                if neighbor_coord in closed_set:
                    continue

                neighbor_cell = grid.cells[nr][nc]
                edge_cost = cls.get_cell_cost(neighbor_cell, profile)

                # Skip impassable cells
                if edge_cost is None:
                    continue

                tentative_g = current_g + edge_cost

                if tentative_g < g_score.get(neighbor_coord, float("inf")):
                    g_score[neighbor_coord] = tentative_g
                    came_from[neighbor_coord] = current
                    h = cls.manhattan_distance(nr, nc, gr, gc)
                    f = tentative_g + h
                    heapq.heappush(
                        open_queue,
                        (f, h, next(tie_counter), neighbor_coord),
                    )

        # Destination unreachable
        return RouteResponse(
            found=False,
            start=start,
            goal=goal,
            path=[],
            path_length=0,
            total_cost=0.0,
            expanded_nodes=expanded_nodes,
            movement_profile=profile,
            reason="No traversable route connects origin and destination. Obstacles or hazards block all pathways.",
        )
