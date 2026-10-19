"""Integration tests for the GET /api/v1/simulation/priorities API endpoint."""

from fastapi import status
from fastapi.testclient import TestClient
from app.services.simulation_service import SimulationService


def test_priorities_endpoint_before_initialization_rejected(client: TestClient):
    """Verify GET /api/v1/simulation/priorities returns 400 if no simulation is active."""
    SimulationService.reset_engine()
    response = client.get("/api/v1/simulation/priorities")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "not been initialized" in response.json()["detail"].lower()


def test_priorities_endpoint_after_scenario_start_success(client: TestClient):
    """Verify GET /api/v1/simulation/priorities succeeds with typed response after start."""
    SimulationService.reset_engine()

    start_res = client.post(
        "/api/v1/simulation/start",
        json={"scenario_id": "flooded_neighborhood", "seed": 101},
    )
    assert start_res.status_code == status.HTTP_200_OK

    response = client.get("/api/v1/simulation/priorities")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "queue" in data
    assert "summary" in data
    assert data["is_heuristic"] is True
    assert data["current_tick"] == 0

    # Summary metrics validation
    summary = data["summary"]
    assert summary["total_civilians"] == len(start_res.json()["civilians"])
    assert summary["active_unrescued"] == summary["total_civilians"]
    assert summary["rescued_count"] == 0

    # Queue structure validation
    queue = data["queue"]
    assert len(queue) == summary["active_unrescued"]
    if len(queue) > 0:
        first = queue[0]
        assert first["rank"] == 1
        assert "civilian_id" in first
        assert "priority_score" in first
        assert "explanation" in first
        assert "score_breakdown" in first


def test_priorities_endpoint_correct_rank_ordering(client: TestClient):
    """Verify items in queue are ordered strictly with ascending ranks and descending priority scores."""
    SimulationService.reset_engine()
    client.post(
        "/api/v1/simulation/start",
        json={"scenario_id": "flooded_neighborhood", "seed": 101},
    )

    response = client.get("/api/v1/simulation/priorities")
    assert response.status_code == status.HTTP_200_OK

    queue = response.json()["queue"]
    for i in range(len(queue) - 1):
        assert queue[i]["rank"] == i + 1
        # Scores must be descending (greater than or equal)
        assert queue[i]["priority_score"] >= queue[i + 1]["priority_score"]


def test_priorities_endpoint_get_does_not_mutate_state(client: TestClient):
    """Verify GET /api/v1/simulation/priorities is idempotent and non-mutating."""
    SimulationService.reset_engine()
    client.post(
        "/api/v1/simulation/start",
        json={"scenario_id": "flooded_neighborhood", "seed": 101},
    )

    state_before = client.get("/api/v1/simulation/state").json()

    # Call priorities multiple times
    res1 = client.get("/api/v1/simulation/priorities")
    res2 = client.get("/api/v1/simulation/priorities")

    state_after = client.get("/api/v1/simulation/state").json()

    assert state_before["current_tick"] == state_after["current_tick"]
    assert state_before["status"] == state_after["status"]
    assert res1.json() == res2.json()


def test_priorities_dynamically_update_after_simulation_tick(client: TestClient):
    """Verify priorities queue dynamically recalculates after disaster expansion and civilian decay."""
    SimulationService.reset_engine()
    client.post(
        "/api/v1/simulation/start",
        json={"scenario_id": "flooded_neighborhood", "seed": 101},
    )

    initial_priorities = client.get("/api/v1/simulation/priorities").json()

    # Step simulation 2 ticks
    client.post("/api/v1/simulation/tick")
    client.post("/api/v1/simulation/tick")

    ticked_priorities = client.get("/api/v1/simulation/priorities").json()

    assert ticked_priorities["current_tick"] == 2
    # Check that waiting ticks increased on queued civilians
    for item in ticked_priorities["queue"]:
        assert item["waiting_ticks"] >= 2
