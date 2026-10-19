"""Comprehensive integration and unit tests for the multi-agent rescue dispatcher."""

from app.schemas.agent import AgentStatus, AgentType, MissionStatus, RescueAgent, RescueMission
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
from app.schemas.route import MovementProfile
from app.services.simulation.dispatcher import RescueCoordinator
from app.services.simulation.grid_generator import CityGridGenerator


def create_simple_corridor_grid(rows: int = 5, cols: int = 10) -> CityGrid:
    """Create a test grid with a single open road corridor along row 2."""
    cells = []
    for r in range(rows):
        row_cells = []
        for c in range(cols):
            # Row 2 is road, others are buildings
            terrain = TerrainType.ROAD if r == 2 else TerrainType.BUILDING
            row_cells.append(
                GridCell(
                    coordinate=Coordinate(row=r, col=c),
                    terrain=terrain,
                    hazard=HazardState.SAFE,
                )
            )
        cells.append(row_cells)
    return CityGrid(rows=rows, cols=cols, cells=cells)


def test_dispatcher_selects_highest_priority_civilian():
    """Verify dispatch assigns the most urgent civilian first."""
    grid = create_simple_corridor_grid()
    shelter = Shelter(id="s1", name="Base", coordinate=Coordinate(row=2, col=0))
    agent = RescueAgent(
        id="agent_1",
        name="Unit 1",
        type=AgentType.GROUND_RESPONDER,
        coordinate=Coordinate(row=2, col=0),
        status=AgentStatus.IDLE,
        movement_profile=MovementProfile.GROUND_RESPONDER,
    )
    civ_low = Civilian(
        id="civ_low",
        coordinate=Coordinate(row=2, col=5),
        status=CivilianStatus.WAITING,
        urgency=UrgencyLevel.LOW,
        health=90,
    )
    civ_critical = Civilian(
        id="civ_crit",
        coordinate=Coordinate(row=2, col=8),
        status=CivilianStatus.WAITING,
        urgency=UrgencyLevel.CRITICAL,
        health=20,
    )

    missions = []
    new_missions, events = RescueCoordinator.dispatch_idle_agents(
        agents=[agent],
        civilians=[civ_low, civ_critical],
        grid=grid,
        current_tick=1,
        missions=missions,
    )

    assert len(new_missions) == 1
    assert new_missions[0].civilian_id == "civ_crit"
    assert agent.status == AgentStatus.EN_ROUTE
    assert agent.target_civilian_id == "civ_crit"
    assert agent.current_mission_id == new_missions[0].id


def test_dispatcher_unreachable_target_does_not_block_reachable():
    """If the #1 triage target is blocked, the dispatcher should assign the reachable #2 target."""
    grid = create_simple_corridor_grid()
    # Block coordinate (2, 8) with deep water
    grid.cells[2][8].hazard = HazardState.DANGEROUS
    grid.cells[2][8].water_level = 2.0

    shelter = Shelter(id="s1", name="Base", coordinate=Coordinate(row=2, col=0))
    agent = RescueAgent(
        id="agent_ground",
        name="Ground Unit",
        type=AgentType.GROUND_RESPONDER,
        coordinate=Coordinate(row=2, col=0),
        status=AgentStatus.IDLE,
        movement_profile=MovementProfile.GROUND_RESPONDER,
    )
    civ_crit_unreachable = Civilian(
        id="civ_unreachable",
        coordinate=Coordinate(row=2, col=8),
        status=CivilianStatus.WAITING,
        urgency=UrgencyLevel.CRITICAL,
        health=10,
    )
    civ_med_reachable = Civilian(
        id="civ_reachable",
        coordinate=Coordinate(row=2, col=4),
        status=CivilianStatus.WAITING,
        urgency=UrgencyLevel.MEDIUM,
        health=70,
    )

    missions = []
    new_missions, events = RescueCoordinator.dispatch_idle_agents(
        agents=[agent],
        civilians=[civ_crit_unreachable, civ_med_reachable],
        grid=grid,
        current_tick=1,
        missions=missions,
    )

    assert len(new_missions) == 1
    assert new_missions[0].civilian_id == "civ_reachable"
    assert agent.target_civilian_id == "civ_reachable"


def test_heterogeneous_capabilities_shallow_water():
    """Foot responders can traverse shallow water while ground vehicles cannot."""
    grid = create_simple_corridor_grid()
    # Shallow water at (2, 2)
    grid.cells[2][2].hazard = HazardState.FLOODED
    grid.cells[2][2].water_level = 0.8  # Passable for foot, but ground vehicles face severe cost or restrictions

    # If water is deep enough to stop ground responder (>= 1.50m)
    grid.cells[2][2].water_level = 1.6
    grid.cells[2][2].hazard = HazardState.DANGEROUS  # Impassable for ground responder

    foot_agent = RescueAgent(
        id="agent_foot",
        name="Foot Crew",
        type=AgentType.FOOT_RESPONDER,
        coordinate=Coordinate(row=2, col=0),
        status=AgentStatus.IDLE,
        movement_profile=MovementProfile.ON_FOOT,
    )
    # Foot responder with water level 0.8 (passable)
    grid.cells[2][2].hazard = HazardState.FLOODED
    grid.cells[2][2].water_level = 0.8

    civ = Civilian(
        id="civ_target",
        coordinate=Coordinate(row=2, col=5),
        status=CivilianStatus.WAITING,
        urgency=UrgencyLevel.HIGH,
    )

    missions = []
    new_missions, events = RescueCoordinator.dispatch_idle_agents(
        agents=[foot_agent],
        civilians=[civ],
        grid=grid,
        current_tick=1,
        missions=missions,
    )
    assert len(new_missions) == 1
    assert new_missions[0].agent_id == "agent_foot"


def test_autonomous_movement_and_evacuation_lifecycle():
    """Verify complete end-to-end mission lifecycle: en-route -> pickup -> transport -> evacuation."""
    grid = create_simple_corridor_grid(rows=5, cols=6)
    shelter = Shelter(id="shelter_main", name="Main Depot", coordinate=Coordinate(row=2, col=0), capacity=10)
    agent = RescueAgent(
        id="agent_1",
        name="Unit 1",
        type=AgentType.GROUND_RESPONDER,
        coordinate=Coordinate(row=2, col=0),
        status=AgentStatus.IDLE,
        movement_profile=MovementProfile.GROUND_RESPONDER,
    )
    civ = Civilian(
        id="civ_1",
        coordinate=Coordinate(row=2, col=2),  # 2 steps away from shelter
        status=CivilianStatus.WAITING,
        urgency=UrgencyLevel.HIGH,
        health=80,
    )

    civilians = [civ]
    shelters = [shelter]
    agents = [agent]
    missions: list[RescueMission] = []

    # Tick 1: Dispatch
    new_missions, _ = RescueCoordinator.dispatch_idle_agents(agents, civilians, grid, 1, missions)
    assert len(new_missions) == 1
    assert agent.status == AgentStatus.EN_ROUTE
    assert agent.coordinate == Coordinate(row=2, col=0)
    # Remaining path to civ at col 2: [ (2, 1), (2, 2) ]
    assert len(agent.active_path) == 2

    # Tick 2: Agent advances 1 cell
    newly_rescued, events = RescueCoordinator.step_agents_and_missions(agents, missions, civilians, shelters, grid, 2)
    assert newly_rescued == 0
    assert agent.coordinate == Coordinate(row=2, col=1)
    assert civ.status == CivilianStatus.WAITING  # Not yet reached

    # Tick 3: Agent arrives at civilian!
    newly_rescued, events = RescueCoordinator.step_agents_and_missions(agents, missions, civilians, shelters, grid, 3)
    assert newly_rescued == 0
    assert agent.coordinate == Coordinate(row=2, col=2)
    assert civ.status == CivilianStatus.IN_TRANSIT
    assert agent.status == AgentStatus.TRANSPORTING
    assert agent.carrying_civilian_id == "civ_1"
    # Route back to shelter at (2, 0)
    assert len(agent.active_path) == 2  # [ (2, 1), (2, 0) ]

    # Tick 4: Transporting step 1
    newly_rescued, events = RescueCoordinator.step_agents_and_missions(agents, missions, civilians, shelters, grid, 4)
    assert newly_rescued == 0
    assert agent.coordinate == Coordinate(row=2, col=1)
    assert civ.coordinate == Coordinate(row=2, col=1)

    # Tick 5: Transporting step 2 -> Arrival at shelter!
    newly_rescued, events = RescueCoordinator.step_agents_and_missions(agents, missions, civilians, shelters, grid, 5)
    assert newly_rescued == 1
    assert civ.status == CivilianStatus.RESCUED
    assert civ.coordinate == Coordinate(row=2, col=0)
    assert shelter.current_occupancy == 1
    assert agent.completed_rescues == 1
    assert agent.status == AgentStatus.IDLE
    assert agent.carrying_civilian_id is None
    assert agent.current_mission_id is None
    assert missions[0].status == MissionStatus.COMPLETED


def test_dynamic_replan_when_path_blocked():
    """Verify that an active agent reroutes when a hazard appears in front of it."""
    # Create grid with two parallel road corridors (row 1 and row 3) connected at cols 0 and 5
    cells = []
    for r in range(5):
        row_cells = []
        for c in range(6):
            terrain = TerrainType.ROAD if (r in (1, 3) or (c in (0, 5) and 1 <= r <= 3)) else TerrainType.BUILDING
            row_cells.append(
                GridCell(
                    coordinate=Coordinate(row=r, col=c),
                    terrain=terrain,
                    hazard=HazardState.SAFE,
                )
            )
        cells.append(row_cells)
    grid = CityGrid(rows=5, cols=6, cells=cells)

    shelter = Shelter(id="s1", name="Depot", coordinate=Coordinate(row=1, col=0))
    agent = RescueAgent(
        id="agent_1",
        name="Unit 1",
        type=AgentType.GROUND_RESPONDER,
        coordinate=Coordinate(row=1, col=0),
        status=AgentStatus.IDLE,
        movement_profile=MovementProfile.GROUND_RESPONDER,
    )
    civ = Civilian(
        id="civ_target",
        coordinate=Coordinate(row=1, col=4),
        status=CivilianStatus.WAITING,
        urgency=UrgencyLevel.HIGH,
    )

    missions = []
    # Dispatch: should plan along row 1: (1, 0) -> (1, 1) -> (1, 2) -> (1, 3) -> (1, 4)
    RescueCoordinator.dispatch_idle_agents([agent], [civ], grid, 1, missions)
    assert agent.status == AgentStatus.EN_ROUTE

    # Move 1 step to (1, 1)
    RescueCoordinator.step_agents_and_missions([agent], missions, [civ], [shelter], grid, 2)
    assert agent.coordinate == Coordinate(row=1, col=1)

    # Now drop debris at (1, 2)
    grid.cells[1][2].hazard = HazardState.DEBRIS_BLOCKED
    grid.cells[1][2].debris_severity = 3.0

    # Next step should trigger replanning: agent cannot go through (1, 2), so it must reroute!
    newly_rescued, events = RescueCoordinator.step_agents_and_missions([agent], missions, [civ], [shelter], grid, 3)
    assert any("Replanning" in e or "rerouted" in e for e in events)
    # Agent should not step into (1, 2)
    assert agent.coordinate != Coordinate(row=1, col=2)


def test_collision_resolution_deterministic_yielding():
    """Verify that when two agents head towards the same cell, the one with lower ID moves while the other yields."""
    grid = create_simple_corridor_grid(rows=5, cols=10)
    shelter = Shelter(id="s1", name="Base", coordinate=Coordinate(row=2, col=0))

    # Agent A at (2, 1) wanting to move to (2, 2)
    agent_a = RescueAgent(
        id="agent_a",
        name="Alpha",
        type=AgentType.GROUND_RESPONDER,
        coordinate=Coordinate(row=2, col=1),
        status=AgentStatus.EN_ROUTE,
        movement_profile=MovementProfile.GROUND_RESPONDER,
        active_path=[Coordinate(row=2, col=2)],
        current_mission_id="m_a",
    )
    # Agent B at (2, 3) wanting to move to (2, 2)
    agent_b = RescueAgent(
        id="agent_b",
        name="Bravo",
        type=AgentType.GROUND_RESPONDER,
        coordinate=Coordinate(row=2, col=3),
        status=AgentStatus.EN_ROUTE,
        movement_profile=MovementProfile.GROUND_RESPONDER,
        active_path=[Coordinate(row=2, col=2)],
        current_mission_id="m_b",
    )

    missions = [
        RescueMission(id="m_a", agent_id="agent_a", civilian_id="c1", target_coordinate=Coordinate(row=2, col=2), explanation=""),
        RescueMission(id="m_b", agent_id="agent_b", civilian_id="c2", target_coordinate=Coordinate(row=2, col=2), explanation=""),
    ]
    civs = [
        Civilian(id="c1", coordinate=Coordinate(row=2, col=2)),
        Civilian(id="c2", coordinate=Coordinate(row=2, col=2)),
    ]

    newly_rescued, events = RescueCoordinator.step_agents_and_missions(
        [agent_a, agent_b], missions, civs, [shelter], grid, 1
    )

    # agent_a (lower lexicographical ID) wins right of way to (2, 2)
    assert agent_a.coordinate == Coordinate(row=2, col=2)
    # agent_b yields and remains at (2, 3)
    assert agent_b.coordinate == Coordinate(row=2, col=3)
    assert any("yielded right-of-way" in e for e in events)
