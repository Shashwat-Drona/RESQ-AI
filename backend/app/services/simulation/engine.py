"""Core SimulationEngine managing environment state, disaster steps, and lifecycle."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.schemas.environment import (
    CityGrid,
    Civilian,
    CivilianStatus,
    Coordinate,
    GridCell,
    HazardState,
    Shelter,
    TerrainType,
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
from app.schemas.agent import AgentStatus, RescueAgent, RescueMission
from app.schemas.evaluation import DispatchStrategy
from app.services.simulation.civilian_model import CivilianDeteriorationModel
from app.services.simulation.dispatcher import RescueCoordinator
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

    def __init__(self, dispatch_strategy: DispatchStrategy = DispatchStrategy.AI_TRIAGE):
        """Initialize simulation engine in idle standby state."""
        self.dispatch_strategy: DispatchStrategy = dispatch_strategy
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
        self.agents: List[RescueAgent] = []
        self.missions: List[RescueMission] = []

    def is_active(self) -> bool:
        """Check if simulation has an initialized environment."""
        return self.grid is not None and self.status != SimulationStatus.NOT_STARTED

    def get_state(self) -> SimulationState:
        """Return non-mutating snapshot of the current simulation state."""
        active_incidents = sum(
            1 for c in self.civilians if c.status != CivilianStatus.RESCUED
        )
        active_agents_count = len([a for a in self.agents if a.status != AgentStatus.UNAVAILABLE])

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
            active_agents=active_agents_count,
            rescued_count=self.rescued_count,
            message=message,
            updated_at=datetime.now(timezone.utc),
            grid=self.grid,
            civilians=self.civilians,
            shelters=self.shelters,
            agents=self.agents,
            missions=self.missions,
            scenario_id=self.scenario_id,
            tick_events=list(self.last_tick_events),
            metadata={
                "phase": 5,
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

        if self.scenario_id == "triage_benchmark_challenge":
            # Reposition shelters for accessible multi-trip evaluation
            self.shelters = [
                Shelter(id="shelter_1", name="Riverside Evac Base", coordinate=Coordinate(row=4, col=4), capacity=20, current_occupancy=0),
                Shelter(id="shelter_2", name="Highland Relief Center", coordinate=Coordinate(row=14, col=14), capacity=20, current_occupancy=0),
            ]
            for s in self.shelters:
                scell = self.grid.cells[s.coordinate.row][s.coordinate.col]
                scell.terrain = TerrainType.SHELTER
                scell.hazard = HazardState.SAFE
                scell.water_level = 0.0
                scell.traversable = True

            # Calibrate 8 civilians:
            # civ_1, civ_2, civ_3: LOW urgency (healthy, safe in dry south-west corner far away from shelters)
            # civ_4, civ_5: MEDIUM urgency (injured, health 75)
            # civ_6, civ_7, civ_8: CRITICAL urgency trapped near advancing water with health 55
            if len(self.civilians) >= 8:
                self.civilians[0].coordinate = Coordinate(row=18, col=2)
                self.civilians[0].urgency = UrgencyLevel.LOW
                self.civilians[0].status = CivilianStatus.WAITING
                self.civilians[0].health = 100

                self.civilians[1].coordinate = Coordinate(row=19, col=3)
                self.civilians[1].urgency = UrgencyLevel.LOW
                self.civilians[1].status = CivilianStatus.WAITING
                self.civilians[1].health = 100

                self.civilians[2].coordinate = Coordinate(row=17, col=4)
                self.civilians[2].urgency = UrgencyLevel.LOW
                self.civilians[2].status = CivilianStatus.WAITING
                self.civilians[2].health = 100

                self.civilians[3].coordinate = Coordinate(row=10, col=10)
                self.civilians[3].urgency = UrgencyLevel.MEDIUM
                self.civilians[3].status = CivilianStatus.INJURED
                self.civilians[3].health = 75

                self.civilians[4].coordinate = Coordinate(row=11, col=12)
                self.civilians[4].urgency = UrgencyLevel.MEDIUM
                self.civilians[4].status = CivilianStatus.INJURED
                self.civilians[4].health = 75

                self.civilians[5].coordinate = Coordinate(row=5, col=8)
                self.civilians[5].urgency = UrgencyLevel.CRITICAL
                self.civilians[5].status = CivilianStatus.TRAPPED
                self.civilians[5].health = 55

                self.civilians[6].coordinate = Coordinate(row=7, col=6)
                self.civilians[6].urgency = UrgencyLevel.CRITICAL
                self.civilians[6].status = CivilianStatus.TRAPPED
                self.civilians[6].health = 55

                self.civilians[7].coordinate = Coordinate(row=12, col=15)
                self.civilians[7].urgency = UrgencyLevel.CRITICAL
                self.civilians[7].status = CivilianStatus.TRAPPED
                self.civilians[7].health = 55

        # 3. Setup Disaster Mechanics
        init_events: List[str] = [
            f"Initialized scenario '{self.scenario_id}' with seed {self.seed} ({rows}x{cols} grid)."
        ]

        if disaster_type == DisasterType.FLOOD:
            # Ensure flood breach originates in river sectors rather than directly on the emergency vehicle shelter
            shelter_coords = {(s.coordinate.row, s.coordinate.col) for s in self.shelters}
            if any((r, c) in shelter_coords for r, c in [(0, 0), (0, 1), (1, 0)]):
                sources = [(rows - 1, cols - 1), (rows - 1, cols - 2), (rows - 2, cols - 1)]
            else:
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
            civ.waiting_ticks = 0
            cell = self.grid.cells[civ.coordinate.row][civ.coordinate.col]
            if cell.hazard in [HazardState.FLOODED, HazardState.DEBRIS_BLOCKED]:
                civ.status = CivilianStatus.TRAPPED
                civ.urgency = UrgencyLevel.HIGH

        # 5. Initialize autonomous rescue fleet
        self.agents = RescueCoordinator.create_default_fleet(
            shelters=self.shelters,
            max_agents=max_agents,
        )
        self.missions = []
        init_events.append(
            f"Rescue fleet deployed: {len(self.agents)} autonomous units stationed at shelters."
        )

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

        # 3. Update affected civilians condition and triage status
        if self.grid and self.civilians:
            civ_events = CivilianDeteriorationModel.step_civilians(
                civilians=self.civilians,
                grid=self.grid,
                current_tick=self.current_tick,
            )
            tick_events.extend(civ_events)

        # 4. Advance rescue agent movement, arrivals, transport, and replanning
        if self.grid and self.agents:
            newly_rescued, agent_events = RescueCoordinator.step_agents_and_missions(
                agents=self.agents,
                missions=self.missions,
                civilians=self.civilians,
                shelters=self.shelters,
                grid=self.grid,
                current_tick=self.current_tick,
            )
            self.rescued_count += newly_rescued
            tick_events.extend(agent_events)

        # 5. Autonomous dispatch for available idle agents to triage targets
        if self.grid and self.agents and self.civilians:
            new_missions, dispatch_events = RescueCoordinator.dispatch_idle_agents(
                agents=self.agents,
                civilians=self.civilians,
                grid=self.grid,
                current_tick=self.current_tick,
                missions=self.missions,
                strategy=self.dispatch_strategy,
            )
            tick_events.extend(dispatch_events)

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
            self.agents = [a.model_copy(deep=True) for a in snapshot.agents]
            self.missions = [m.model_copy(deep=True) for m in snapshot.missions]
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
