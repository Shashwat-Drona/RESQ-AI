"""Unit tests for rescue agent schemas, mission models, and fleet definitions."""

import pytest
from pydantic import ValidationError
from app.schemas.agent import (
    AgentStatus,
    AgentType,
    DispatchSummary,
    MissionStatus,
    RescueAgent,
    RescueMission,
)
from app.schemas.environment import Coordinate, Shelter
from app.schemas.route import MovementProfile
from app.services.simulation.dispatcher import RescueCoordinator


def test_agent_schema_valid():
    """Verify standard valid agent instantiation."""
    agent = RescueAgent(
        id="agent_ground_1",
        name="Alpha-1",
        type=AgentType.GROUND_RESPONDER,
        coordinate=Coordinate(row=5, col=5),
        status=AgentStatus.IDLE,
        movement_profile=MovementProfile.GROUND_RESPONDER,
        speed_cells_per_tick=1,
    )
    assert agent.id == "agent_ground_1"
    assert agent.status == AgentStatus.IDLE
    assert agent.completed_rescues == 0
    assert agent.carrying_civilian_id is None
    assert agent.active_path == []


def test_agent_schema_invalid_status():
    """Verify validation error on unrecognized status enum."""
    with pytest.raises(ValidationError):
        RescueAgent(
            id="agent_ground_1",
            name="Alpha-1",
            type=AgentType.GROUND_RESPONDER,
            coordinate=Coordinate(row=0, col=0),
            status="flying_high",  # Invalid enum value
            movement_profile=MovementProfile.GROUND_RESPONDER,
        )


def test_mission_schema_lifecycle():
    """Verify mission schema tracks steps and coordinates."""
    mission = RescueMission(
        id="mission_civ_1_0",
        agent_id="agent_ground_1",
        civilian_id="civ_1",
        target_coordinate=Coordinate(row=10, col=10),
        status=MissionStatus.EN_ROUTE,
        route=[Coordinate(row=0, col=0), Coordinate(row=1, col=0)],
        explanation="Testing route tracking",
    )
    assert mission.status == MissionStatus.EN_ROUTE
    assert len(mission.route) == 2
    assert mission.completed_at_tick is None


def test_default_fleet_generation():
    """Verify default fleet produces heterogeneous agents stationed at shelters."""
    shelters = [
        Shelter(id="shelter_1", name="West Depot", coordinate=Coordinate(row=2, col=2)),
        Shelter(id="shelter_2", name="East Base", coordinate=Coordinate(row=15, col=15)),
    ]
    fleet = RescueCoordinator.create_default_fleet(shelters=shelters, max_agents=4)

    assert len(fleet) == 4
    # Ground vs Foot responder distribution
    ground_responders = [a for a in fleet if a.type == AgentType.GROUND_RESPONDER]
    foot_responders = [a for a in fleet if a.type == AgentType.FOOT_RESPONDER]
    assert len(ground_responders) == 2
    assert len(foot_responders) == 2

    # Movement profiles correctly mapped
    assert ground_responders[0].movement_profile == MovementProfile.GROUND_RESPONDER
    assert foot_responders[0].movement_profile == MovementProfile.ON_FOOT

    # Spawn positions at shelters
    assert fleet[0].coordinate == shelters[0].coordinate
    assert fleet[1].coordinate == shelters[1].coordinate
    assert fleet[2].coordinate == shelters[0].coordinate
    assert fleet[3].coordinate == shelters[1].coordinate


def test_dispatch_summary_aggregation():
    """Verify dispatch summary calculates correct counts."""
    agents = [
        RescueAgent(
            id="a1",
            name="Unit 1",
            type=AgentType.GROUND_RESPONDER,
            coordinate=Coordinate(row=0, col=0),
            status=AgentStatus.IDLE,
            movement_profile=MovementProfile.GROUND_RESPONDER,
        ),
        RescueAgent(
            id="a2",
            name="Unit 2",
            type=AgentType.FOOT_RESPONDER,
            coordinate=Coordinate(row=1, col=1),
            status=AgentStatus.TRANSPORTING,
            movement_profile=MovementProfile.ON_FOOT,
        ),
    ]
    missions = [
        RescueMission(
            id="m1",
            agent_id="a2",
            civilian_id="c1",
            target_coordinate=Coordinate(row=2, col=2),
            status=MissionStatus.TRANSPORTING,
            explanation="Carrying patient",
        ),
        RescueMission(
            id="m0",
            agent_id="a1",
            civilian_id="c0",
            target_coordinate=Coordinate(row=0, col=0),
            status=MissionStatus.COMPLETED,
            explanation="Delivered safely",
        ),
    ]
    summary = RescueCoordinator.get_summary(agents, missions)
    assert summary.total_agents == 2
    assert summary.available_agents == 1
    assert summary.active_missions == 1
    assert summary.completed_evacuations == 1
    assert summary.failed_missions == 0
