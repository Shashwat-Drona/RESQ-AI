"""Deterministic earthquake damage, road collapse, and aftershock disaster model."""

import random
from typing import List, Tuple
from app.schemas.environment import CityGrid, HazardState, TerrainType


class EarthquakeSimulationModel:
    """Simulates seismic fault ruptures, building collapse debris, and distinct aftershock events."""

    def __init__(
        self,
        epicenter: Tuple[int, int] | None = None,
        intensity: float = 6.8,
        seed: int = 42,
    ):
        """Initialize earthquake parameters with epicenter and intensity."""
        self.epicenter: Tuple[int, int] = epicenter or (10, 10)
        self.intensity: float = intensity
        self.seed: int = seed
        self.rng = random.Random(seed)
        # Scheduled distinct aftershock ticks (e.g., tick 3 and tick 7)
        self.aftershock_ticks: List[int] = [3, 7]

    def initialize_earthquake(self, grid: CityGrid) -> List[str]:
        """Generate initial earthquake structural damage and road debris blockages."""
        events: List[str] = []
        er, ec = self.epicenter
        events.append(
            f"Seismic event of magnitude {self.intensity} struck city at epicenter ({er}, {ec})."
        )

        debris_count = 0
        # Iterate over cells and generate structural collapse around epicenter
        for r in range(grid.rows):
            for c in range(grid.cols):
                dist = abs(r - er) + abs(c - ec)
                # Influence radius based on intensity
                if dist <= 8:
                    cell = grid.cells[r][c]
                    # Shelters are seismically reinforced and remain safe
                    if cell.terrain == TerrainType.SHELTER:
                        continue

                    # Damage likelihood decreases with distance
                    damage_prob = max(0.15, 0.75 - (dist * 0.08))
                    if self.rng.random() < damage_prob:
                        if cell.terrain == TerrainType.BUILDING:
                            cell.debris_severity = round(self.rng.uniform(2.5, 4.8), 2)
                            # Rubble spills to an adjacent road/open ground
                            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                                nr, nc = r + dr, c + dc
                                if 0 <= nr < grid.rows and 0 <= nc < grid.cols:
                                    adj_cell = grid.cells[nr][nc]
                                    if (
                                        adj_cell.terrain == TerrainType.ROAD
                                        and adj_cell.hazard != HazardState.DEBRIS_BLOCKED
                                    ):
                                        adj_cell.hazard = HazardState.DEBRIS_BLOCKED
                                        adj_cell.debris_severity = round(
                                            self.rng.uniform(2.0, 4.0), 2
                                        )
                                        adj_cell.traversable = False
                                        debris_count += 1
                                        break
                        elif cell.terrain in [TerrainType.ROAD, TerrainType.OPEN_GROUND]:
                            if self.rng.random() < 0.25:
                                cell.hazard = HazardState.DEBRIS_BLOCKED
                                cell.debris_severity = round(self.rng.uniform(2.0, 3.5), 2)
                                cell.traversable = False
                                debris_count += 1

        events.append(
            f"Initial tremor caused {debris_count} critical road obstructions and collapsed structures."
        )
        return events

    def step(self, grid: CityGrid, tick: int) -> List[str]:
        """Update earthquake-related effects for the tick.
        
        Distinct aftershocks occur only at designated scheduled intervals,
        modeling distinct geological tremors rather than fluid diffusion.
        """
        events: List[str] = []

        if tick in self.aftershock_ticks:
            er, ec = self.epicenter
            magnitude = round(self.intensity - 1.8 - (tick * 0.1), 1)
            events.append(
                f"[Aftershock Alert] Magnitude {magnitude} aftershock recorded near ({er}, {ec})."
            )

            # Secondary collapse on 1-2 vulnerable cells
            new_blockages = 0
            for r in range(grid.rows):
                for c in range(grid.cols):
                    cell = grid.cells[r][c]
                    if (
                        cell.terrain == TerrainType.ROAD
                        and cell.traversable
                        and cell.hazard == HazardState.SAFE
                    ):
                        dist = abs(r - er) + abs(c - ec)
                        if dist <= 5 and self.rng.random() < 0.15:
                            cell.hazard = HazardState.DEBRIS_BLOCKED
                            cell.debris_severity = round(self.rng.uniform(2.0, 3.0), 2)
                            cell.traversable = False
                            new_blockages += 1
                            events.append(
                                f"Secondary structural failure deposited rubble on road at ({r}, {c})."
                            )
                            if new_blockages >= 2:
                                break
                if new_blockages >= 2:
                    break

        return events
