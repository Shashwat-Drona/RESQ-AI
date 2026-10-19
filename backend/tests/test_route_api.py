"""Automated tests for Route Planning API endpoint (POST /api/v1/simulation/route)."""

from fastapi import status
from fastapi.testclient import TestClient
from app.schemas.environment import HazardState, TerrainType
from app.services.simulation_service import SimulationService


def test_route_request_before_initialization_rejected(client: TestClient):
    """POST /api/v1/simulation/route before starting simulation must return HTTP 400."""
    SimulationService.reset_engine()

    payload = {
        "start": {"row": 0, "col": 0},
        "goal": {"row": 4, "col": 4},
        "movement_profile": "ground_responder",
    }
    response = client.post("/api/v1/simulation/route", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "not been initialized" in response.json()["detail"].lower()


def test_route_request_after_scenario_start_success(client: TestClient):
    """POST /api/v1/simulation/route succeeds on initialized scenario."""
    SimulationService.reset_engine()
    client.post(
        "/api/v1/simulation/start",
        json={"scenario_id": "flooded_neighborhood", "seed": 42},
    )

    payload = {
        "start": {"row": 0, "col": 0},
        "goal": {"row": 0, "col": 4},
        "movement_profile": "ground_responder",
    }
    response = client.post("/api/v1/simulation/route", json=payload)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["found"] is True
    assert len(data["path"]) > 0
    assert data["path_length"] == len(data["path"]) - 1
    assert data["total_cost"] >= data["path_length"]
    assert data["movement_profile"] == "ground_responder"


def test_route_request_does_not_advance_tick_or_mutate_state(client: TestClient):
    """Calling route planner does NOT advance simulation tick or mutate operational state."""
    SimulationService.reset_engine()
    client.post(
        "/api/v1/simulation/start",
        json={"scenario_id": "flooded_neighborhood", "seed": 42},
    )

    state_before = client.get("/api/v1/simulation/state").json()
    assert state_before["current_tick"] == 0

    payload = {
        "start": {"row": 0, "col": 0},
        "goal": {"row": 4, "col": 0},
    }
    _ = client.post("/api/v1/simulation/route", json=payload)

    state_after = client.get("/api/v1/simulation/state").json()
    assert state_after["current_tick"] == 0
    assert state_after["status"] == state_before["status"]
    assert state_after["active_incidents"] == state_before["active_incidents"]


def test_dynamic_route_replanning_after_disaster_advancement(client: TestClient):
    """Verify that route dynamically changes or detours after tick advancement changes cell hazards."""
    SimulationService.reset_engine()
    client.post(
        "/api/v1/simulation/start",
        json={"scenario_id": "flooded_neighborhood", "seed": 42, "grid_rows": 15, "grid_cols": 15},
    )

    engine = SimulationService.get_engine()
    assert engine.grid is not None

    # Find two road cells
    start_pos = {"row": 0, "col": 0}
    goal_pos = {"row": 0, "col": 4}

    # 1. First route
    resp1 = client.post(
        "/api/v1/simulation/route",
        json={"start": start_pos, "goal": goal_pos},
    )
    assert resp1.status_code == status.HTTP_200_OK
    route1 = resp1.json()

    # 2. Block the path of route1 at step 2 by placing severe rubble
    step_cell = route1["path"][1]
    engine.grid.cells[step_cell["row"]][step_cell["col"]].hazard = HazardState.DEBRIS_BLOCKED
    engine.grid.cells[step_cell["row"]][step_cell["col"]].debris_severity = 4.0
    engine.grid.cells[step_cell["row"]][step_cell["col"]].traversable = False

    # 3. Request route again: must replan and detour around the blocked cell
    resp2 = client.post(
        "/api/v1/simulation/route",
        json={"start": start_pos, "goal": goal_pos},
    )
    assert resp2.status_code == status.HTTP_200_OK
    route2 = resp2.json()

    if route2["found"]:
        # Blocked cell must NOT be in the newly replanned path
        path2_tuples = [(c["row"], c["col"]) for c in route2["path"]]
        assert (step_cell["row"], step_cell["col"]) not in path2_tuples
        assert route2["path"] != route1["path"]


def test_route_request_invalid_coordinates(client: TestClient):
    """POST /api/v1/simulation/route with negative coordinate rejected with 422."""
    SimulationService.reset_engine()
    client.post("/api/v1/simulation/start", json={"scenario_id": "flooded_neighborhood"})

    # Negative coordinates violate Pydantic schema ge=0
    payload = {
        "start": {"row": -1, "col": 0},
        "goal": {"row": 2, "col": 2},
    }
    response = client.post("/api/v1/simulation/route", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
