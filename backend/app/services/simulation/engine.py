"""Core SimulationEngine managing environment state, disaster steps, and lifecycle."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.schemas.environment import (
    CityGrid,
    Civilian,
    CivilianStatus,
    GridCell,
    HazardState,
    Shelter,
    UrgencyLevel,
)
from app.schemas.simulation import (
    DisasterType,
    SimulationConfig,
    SimulationState,
    SimulationStatus,
    StartSimulationRequest,
    TickResult,
)
from app.services.simulation.earthquake_model import EarthquakeSimulationModel
from app.services.simulation.flood_model import FloodSimulationModel
from app.services.simulation.grid_generator import CityGridGenerator
from app.services.simulation.scenarios import (
    BUILTIN_SCENARIOS,
    get_scenario_by_id,
)


class SimulationNotRunningError(Exception):
    """Raised when tick is attempted on an idle or paused simulation."""

    def __init__(self, status: SimulationStatus):
        super().__init__(f"Simulation is not running (current status: '{status.value}').")
        self.status = status


class SimulationEngine:
    """Independent simulation engine orchestrating grid, disasters, civilians, and lifecycle."""

    def __init__(self):
        """Initialize simulation engine in idle standby state."""
        self.status: SimulationStatus = SimulationStatus.NOT_STARTED
        self.current_tick: int = 0
        self.config: SimulationConfig = SimulationConfig()
        self.grid: Optional[CityGrid] = None
        self.civilians: List[Civilian] = []
        self.shelters: List[Shelter] = []
        self.scenario_id: Optional[str] = None
        self.seed: int = 42

        self.flood_model: Optional[FloodSimulationModel] = None
        self.earthquake_model: Optional[EarthquakeSimulationModel] = None

        self.initial_snapshot: Optional[SimulationState] = None
        self.last_tick_events: List[str] = []
        self.rescued_count: int = 0

    def is_active(self) -> bool:
        """Check if simulation has an initialized environment."""
        return self.grid is not None and self.status != SimulationStatus.NOT_STARTED

    def get_state(self) -> SimulationState:
        """Return non-mutating snapshot of the current simulation state."""
        active_incidents = sum(
            1 for c in self.civilians if c.status != CivilianStatus.RESCUED
        )

        message = (
            "Simulation is active and running."
            if self.status == SimulationStatus.RUNNING
            else "Simulation is paused."
            if self.status == SimulationStatus.PAUSED
            else "Simulation completed."
            if self.status == SimulationStatus.COMPLETED
            else "Simulation engine is initialized and ready. No active simulation is running."
        )

        return SimulationState(
            status=self.status,
            current_tick=self.current_tick,
            config=self.config,
            active_incidents=active_incidents,
            active_agents=0,  # Agents are implemented in future phases
            rescued_count=self.rescued_count,
            message=message,
            updated_at=datetime.now(timezone.utc),
            grid=self.grid,
            civilians=self.civilians,
            shelters=self.shelters,
            scenario_id=self.scenario_id,
            tick_events=list(self.last_tick_events),
            metadata={
                "phase": 2,
                "engine_mode": self.status.value,
                "scenario": self.scenario_id or "default",
                "seed": self.seed,
            },
        )

    def start(self, request: StartSimulationRequest) -> SimulationState:
        """Initialize or restart simulation scenario with deterministic seeded environment."""
        # 1. Resolve template scenario or defaults
        scenario = None
        if request.scenario_id:
            scenario = get_scenario_by_id(request.scenario_id)

        disaster_type = (
            request.disaster_type
            or (scenario.disaster_type if scenario else DisasterType.FLOOD)
        )
        self.seed = request.seed if request.seed is not None else (
            scenario.default_seed if scenario else 42
        )
        self.scenario_id = scenario.id if scenario else (request.scenario_id or "custom_scenario")

        rows = (
            request.grid_rows
            or (scenario.recommended_rows if scenario else self.config.grid_rows)
        )
        cols = (
            request.grid_cols
            or (scenario.recommended_cols if scenario else self.config.grid_cols)
        )
        max_agents = request.max_agents or self.config.max_agents
        num_civilians = (
            request.num_civilians
            or (scenario.civilian_count if scenario else 8)
        )

        self.config = SimulationConfig(
            grid_rows=rows,
            grid_cols=cols,
            max_agents=max_agents,
            disaster_type=disaster_type,
            seed=self.seed,
            scenario_id=self.scenario_id,
        )

        # 2. Generate City Grid, Shelters, and Civilians
        self.grid, self.civilians, self.shelters = CityGridGenerator.generate(
            rows=rows,
            cols=cols,
            num_civilians=num_civilians,
            num_shelters=2,
            seed=self.seed,
        )

        # 3. Setup Disaster Mechanics
        init_events: List[str] = [
            f"Initialized scenario '{self.scenario_id}' with seed {self.seed} ({rows}x{cols} grid)."
        ]

        if disaster_type == DisasterType.FLOOD:
            sources = [(0, 0), (0, 1), (1, 0)]
            if self.scenario_id == "severe_mixed_district":
                # Ruptured water main in urban center
                sources.append((rows // 2, cols // 2))
            self.flood_model = FloodSimulationModel(sources=sources)
            flood_events = self.flood_model.initialize_flood(self.grid)
            init_events.extend(flood_events)
            self.earthquake_model = None

            if self.scenario_id == "severe_mixed_district":
                # Severe mixed obstacle features localized earthquake debris as well
                self.earthquake_model = EarthquakeSimulationModel(
                    epicenter=(rows // 2, cols // 2),
                    intensity=5.8,
                    seed=self.seed,
                )
                eq_events = self.earthquake_model.initialize_earthquake(self.grid)
                init_events.extend(eq_events)

        elif disaster_type == DisasterType.EARTHQUAKE:
            self.flood_model = None
            self.earthquake_model = EarthquakeSimulationModel(
                epicenter=(rows // 2, cols // 2),
                intensity=7.1,
                seed=self.seed,
            )
            eq_events = self.earthquake_model.initialize_earthquake(self.grid)
            init_events.extend(eq_events)

        # 4. Synchronize civilian hazard status with initial cell condition
        for civ in self.civilians:
            cell = self.grid.cells[civ.coordinate.row][civ.coordinate.col]
            if cell.hazard in [HazardState.FLOODED, HazardState.DEBRIS_BLOCKED]:
                civ.status = CivilianStatus.TRAPPED
                civ.urgency = UrgencyLevel.HIGH

        self.current_tick = 0
        self.rescued_count = 0
        self.status = SimulationStatus.RUNNING
        self.last_tick_events = init_events

        # Snapshot deep copy for reset capability
        state = self.get_state()
        self.initial_snapshot = state.model_copy(deep=True)
        return state

    def step(self) -> TickResult:
        """Advance the simulation by exactly one tick."""
        if self.status != SimulationStatus.RUNNING:
            raise SimulationNotRunningError(self.status)

        self.current_tick += 1
        tick_events: List[str] = [f"--- Simulation Tick {self.current_tick} ---"]

        # 1. Step Flood disaster if active
        if self.flood_model and self.grid:
            flood_events = self.flood_model.step(self.grid, self.current_tick)
            tick_events.extend(flood_events)

        # 2. Step Earthquake disaster if active
        if self.earthquake_model and self.grid:
            eq_events = self.earthquake_model.step(self.grid, self.current_tick)
            tick_events.extend(eq_events)

        # 3. Update affected civilians condition
        if self.grid:
            for civ in self.civilians:
                if civ.status == CivilianStatus.RESCUED:
                    continue

                cell = self.grid.cells[civ.coordinate.row][civ.coordinate.col]

                if cell.hazard == HazardState.DANGEROUS or cell.water_level >= 1.5:
                    civ.status = CivilianStatus.TRAPPED
                    civ.urgency = UrgencyLevel.CRITICAL
                    civ.health = max(10, civ.health - 6)
                    tick_events.append(
                        f"Civilian {civ.id} endangered by deep flooding at ({cell.coordinate.row}, {cell.coordinate.col}). Health: {civ.health}%."
                    )
                elif cell.hazard in [HazardState.FLOODED, HazardState.DEBRIS_BLOCKED]:
                    if civ.status == CivilianStatus.WAITING:
                        civ.status = CivilianStatus.INJURED
                    if civ.urgency == UrgencyLevel.LOW:
                        civ.urgency = UrgencyLevel.MEDIUM

        self.last_tick_events = tick_events
        state = self.get_state()
        return TickResult(
            current_tick=self.current_tick,
            status=self.status,
            events=tick_events,
            state=state,
        )

    def pause(self) -> SimulationState:
        """Pause a running simulation without destroying environmental state."""
        if self.status == SimulationStatus.RUNNING:
            self.status = SimulationStatus.PAUSED
            self.last_tick_events.append("Simulation paused by operator.")
        return self.get_state()

    def resume(self) -> SimulationState:
        """Resume a paused simulation."""
        if self.status == SimulationStatus.PAUSED:
            self.status = SimulationStatus.RUNNING
            self.last_tick_events.append("Simulation resumed.")
        return self.get_state()

    def reset(self) -> SimulationState:
        """Restore initial state of the scenario using original configuration and seed."""
        if self.initial_snapshot is not None:
            # Reconstruct clean state from snapshot
            snapshot = self.initial_snapshot.model_copy(deep=True)
            self.current_tick = 0
            self.status = SimulationStatus.RUNNING
            self.grid = snapshot.grid
            self.civilians = snapshot.civilians
            self.shelters = snapshot.shelters
            self.config = snapshot.config
            self.rescued_count = 0
            self.last_tick_events = [
                f"Simulation reset to initial state (Seed: {self.seed})."
            ]

            # Re-instantiate clean disaster models
            if self.config.disaster_type == DisasterType.FLOOD:
                sources = [(0, 0), (0, 1), (1, 0)]
                if self.scenario_id == "severe_mixed_district":
                    sources.append((self.config.grid_rows // 2, self.config.grid_cols // 2))
                self.flood_model = FloodSimulationModel(sources=sources)
                if self.scenario_id == "severe_mixed_district":
                    self.earthquake_model = EarthquakeSimulationModel(
                        epicenter=(self.config.grid_rows // 2, self.config.grid_cols // 2),
                        intensity=5.8,
                        seed=self.seed,
                    )
                else:
                    self.earthquake_model = None
            else:
                self.flood_model = None
                self.earthquake_model = EarthquakeSimulationModel(
                    epicenter=(self.config.grid_rows // 2, self.config.grid_cols // 2),
                    intensity=7.1,
                    seed=self.seed,
                )
            return self.get_state()
        else:
            return self.get_state()
