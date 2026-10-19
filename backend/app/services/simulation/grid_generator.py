"""Synthetic procedural city grid generator with deterministic seeded generation."""

import random
from typing import List, Tuple
from app.schemas.environment import (
    CityGrid,
    Civilian,
    CivilianStatus,
    GridCell,
    HazardState,
    Shelter,
    TerrainType,
    UrgencyLevel,
)
from app.schemas.simulation import Coordinate


class CityGridGenerator:
    """Generates synthetic city terrain, roads, buildings, shelters, and civilians."""

    @staticmethod
    def generate(
        rows: int,
        cols: int,
        num_civilians: int = 8,
        num_shelters: int = 2,
        seed: int = 42,
    ) -> Tuple[CityGrid, List[Civilian], List[Shelter]]:
        """Procedurally generate a complete synthetic city environment.
        
        Guarantees:
        - Interconnected road network grid.
        - Buildings placed in urban blocks.
        - Open ground for park/staging zones.
        - Shelters placed on traversable ground with higher elevation.
        - Civilians placed exclusively on accessible road/open terrain (not inside solid buildings).
        - 100% reproducible for the same seed and dimensions.
        """
        rng = random.Random(seed)

        # 1. Initialize empty matrix of cells
        grid_matrix: List[List[GridCell]] = []

        # Road frequency (every 3-4 blocks)
        road_row_interval = 4
        road_col_interval = 4

        for r in range(rows):
            row_cells: List[GridCell] = []
            for c in range(cols):
                is_road = (
                    r % road_row_interval == 0
                    or c % road_col_interval == 0
                    or r == 0
                    or r == rows - 1
                    or c == 0
                    or c == cols - 1
                )

                if is_road:
                    terrain = TerrainType.ROAD
                else:
                    # Non-road cell: 70% Building, 30% Open Ground
                    if rng.random() < 0.72:
                        terrain = TerrainType.BUILDING
                    else:
                        terrain = TerrainType.OPEN_GROUND

                # Elevation: higher at the north/west, lower towards south/east with slight variance
                base_elevation = max(
                    0.5,
                    float(rows - r) * 0.4 + float(cols - c) * 0.3 + rng.uniform(-0.3, 0.3),
                )

                is_traversable = terrain != TerrainType.BUILDING

                cell = GridCell(
                    coordinate=Coordinate(row=r, col=c),
                    terrain=terrain,
                    hazard=HazardState.SAFE,
                    water_level=0.0,
                    debris_severity=0.0,
                    traversable=is_traversable,
                    elevation=round(base_elevation, 2),
                )
                row_cells.append(cell)
            grid_matrix.append(row_cells)

        # 2. Place Shelters on safe, high-elevation road-accessible spots
        shelters: List[Shelter] = []
        candidate_shelter_cells: List[Tuple[int, int]] = []
        for r in range(rows):
            for c in range(cols):
                if grid_matrix[r][c].terrain in [TerrainType.ROAD, TerrainType.OPEN_GROUND]:
                    candidate_shelter_cells.append((r, c))

        # Sort candidate shelter cells by highest elevation first
        candidate_shelter_cells.sort(
            key=lambda coord: grid_matrix[coord[0]][coord[1]].elevation,
            reverse=True,
        )

        shelter_count = max(1, min(num_shelters, len(candidate_shelter_cells)))
        # Pick high elevation positions that are spaced apart
        selected_shelter_coords: List[Tuple[int, int]] = []
        for coord in candidate_shelter_cells:
            if len(selected_shelter_coords) >= shelter_count:
                break
            # Ensure distance from existing shelters
            if all(
                abs(coord[0] - sc[0]) + abs(coord[1] - sc[1]) >= 4
                for sc in selected_shelter_coords
            ):
                selected_shelter_coords.append(coord)

        if not selected_shelter_coords and candidate_shelter_cells:
            selected_shelter_coords.append(candidate_shelter_cells[0])

        for idx, (sr, sc) in enumerate(selected_shelter_coords, start=1):
            grid_matrix[sr][sc].terrain = TerrainType.SHELTER
            grid_matrix[sr][sc].traversable = True
            shelter = Shelter(
                id=f"shelter_{idx}",
                name=f"Evacuation Shelter {chr(64 + idx)}",
                coordinate=Coordinate(row=sr, col=sc),
                capacity=25 + (idx * 5),
                current_occupancy=0,
            )
            shelters.append(shelter)

        # 3. Place Civilians on traversable cells (roads or open grounds)
        traversable_cells: List[Tuple[int, int]] = []
        for r in range(rows):
            for c in range(cols):
                # Don't place civilians directly inside the shelter at start
                if (
                    grid_matrix[r][c].terrain in [TerrainType.ROAD, TerrainType.OPEN_GROUND]
                    and (r, c) not in selected_shelter_coords
                ):
                    traversable_cells.append((r, c))

        rng.shuffle(traversable_cells)
        actual_civilians_count = min(num_civilians, len(traversable_cells))
        civilians: List[Civilian] = []

        urgency_choices = [
            UrgencyLevel.LOW,
            UrgencyLevel.MEDIUM,
            UrgencyLevel.HIGH,
            UrgencyLevel.CRITICAL,
        ]
        urgency_weights = [0.35, 0.35, 0.20, 0.10]

        for idx in range(actual_civilians_count):
            cr, cc = traversable_cells[idx]
            urgency = rng.choices(urgency_choices, weights=urgency_weights, k=1)[0]
            status = (
                CivilianStatus.INJURED
                if urgency in [UrgencyLevel.HIGH, UrgencyLevel.CRITICAL]
                else CivilianStatus.WAITING
            )
            initial_health = 100 if status == CivilianStatus.WAITING else rng.randint(60, 85)

            civ = Civilian(
                id=f"civ_{idx + 1}",
                coordinate=Coordinate(row=cr, col=cc),
                status=status,
                urgency=urgency,
                health=initial_health,
                metadata={
                    "sector": f"Sector-{cr // 5}-{cc // 5}",
                    "initial_cell_terrain": grid_matrix[cr][cc].terrain.value,
                },
            )
            civilians.append(civ)

        city_grid = CityGrid(rows=rows, cols=cols, cells=grid_matrix)
        return city_grid, civilians, shelters
