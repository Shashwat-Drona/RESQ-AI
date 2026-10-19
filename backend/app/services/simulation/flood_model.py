"""Deterministic flood propagation disaster engine."""

from typing import List, Set, Tuple
from app.schemas.environment import CityGrid, HazardState, TerrainType


class FloodSimulationModel:
    """Simulates physical water accumulation, gravity runoff, and terrain traversability changes."""

    MAX_WATER_LEVEL: float = 5.0
    SHALLOW_FLOOD_THRESHOLD: float = 0.25
    DEEP_FLOOD_THRESHOLD: float = 1.50
    INFLOW_PER_TICK: float = 0.60
    FLOW_COEFFICIENT: float = 0.28

    def __init__(self, sources: List[Tuple[int, int]] | None = None):
        """Initialize flood model with designated water breach / inflow coordinates."""
        self.sources: List[Tuple[int, int]] = sources or [(0, 0), (0, 1), (1, 0)]

    def initialize_flood(self, grid: CityGrid) -> List[str]:
        """Apply initial flood breach conditions at designated sources."""
        events: List[str] = []
        for r, c in self.sources:
            if 0 <= r < grid.rows and 0 <= c < grid.cols:
                cell = grid.cells[r][c]
                # Buildings act as barriers; only flood non-buildings directly
                if cell.terrain != TerrainType.BUILDING:
                    cell.water_level = round(1.20, 2)
                    cell.hazard = HazardState.FLOODED
                    events.append(
                        f"Flood surge breach initiated at ({r}, {c}) [Initial depth: 1.20m]."
                    )
        return events

    def step(self, grid: CityGrid, tick: int) -> List[str]:
        """Advance flood propagation by exactly one simulation tick.
        
        Rules:
        1. Inflow sources inject additional water volume up to MAX_WATER_LEVEL.
        2. Water diffuses to 4-way orthogonal neighbor cells (ROAD, OPEN_GROUND, SHELTER).
        3. Buildings block water penetration, protecting interior space.
        4. Gravity runoff favors cells with lower (elevation + water_level) hydraulic head.
        5. Hazard transitions to FLOODED at 0.25m, and DANGEROUS/impassable at 1.50m.
        """
        events: List[str] = []
        new_water: List[List[float]] = [
            [grid.cells[r][c].water_level for c in range(grid.cols)]
            for r in range(grid.rows)
        ]

        # 1. Inflow at sources
        for r, c in self.sources:
            if 0 <= r < grid.rows and 0 <= c < grid.cols:
                if grid.cells[r][c].terrain != TerrainType.BUILDING:
                    new_water[r][c] = min(
                        self.MAX_WATER_LEVEL,
                        round(new_water[r][c] + self.INFLOW_PER_TICK, 2),
                    )

        # 2. Diffusion / Gravity flow calculation
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

        for r in range(grid.rows):
            for c in range(grid.cols):
                src_cell = grid.cells[r][c]
                curr_depth = grid.cells[r][c].water_level

                if curr_depth <= 0.05 or src_cell.terrain == TerrainType.BUILDING:
                    continue

                src_head = src_cell.elevation + curr_depth

                for dr, dc in directions:
                    nr, nc = r + dr, c + dc
                    if not (0 <= nr < grid.rows and 0 <= nc < grid.cols):
                        continue

                    target_cell = grid.cells[nr][nc]
                    # Buildings act as flood barriers
                    if target_cell.terrain == TerrainType.BUILDING:
                        continue

                    target_head = target_cell.elevation + grid.cells[nr][nc].water_level
                    head_diff = src_head - target_head

                    if head_diff > 0.05:
                        transfer = min(
                            head_diff * self.FLOW_COEFFICIENT,
                            curr_depth * 0.20,
                            0.35,
                        )
                        if transfer > 0.02:
                            new_water[nr][nc] = min(
                                self.MAX_WATER_LEVEL,
                                round(new_water[nr][nc] + transfer, 2),
                            )

        # 3. Apply updated water levels and recalculate hazards & traversability
        impassable_count = 0
        flooded_count = 0

        for r in range(grid.rows):
            for c in range(grid.cols):
                cell = grid.cells[r][c]
                if cell.terrain == TerrainType.BUILDING:
                    continue

                prev_hazard = cell.hazard
                cell.water_level = round(new_water[r][c], 2)

                if cell.water_level >= self.DEEP_FLOOD_THRESHOLD:
                    cell.hazard = HazardState.DANGEROUS
                    cell.traversable = False
                    impassable_count += 1
                    if prev_hazard != HazardState.DANGEROUS:
                        events.append(
                            f"Road at ({r}, {c}) became impassable due to deep flooding ({cell.water_level}m)."
                        )
                elif cell.water_level >= self.SHALLOW_FLOOD_THRESHOLD:
                    cell.hazard = HazardState.FLOODED
                    # Shallow water remains traversable unless debris is present
                    cell.traversable = cell.debris_severity < 2.0
                    flooded_count += 1
                else:
                    if cell.debris_severity >= 2.0:
                        cell.hazard = HazardState.DEBRIS_BLOCKED
                        cell.traversable = False
                    else:
                        cell.hazard = HazardState.SAFE
                        cell.traversable = True

        if tick % 2 == 0 or impassable_count > 0:
            events.append(
                f"[Tick {tick} Flood Update] Active flooded sectors: {flooded_count}, Impassable deep water sectors: {impassable_count}."
            )

        return events
