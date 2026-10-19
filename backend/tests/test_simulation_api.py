"""End-to-end API tests for simulation lifecycle endpoints."""

from fastapi import status
from fastapi.testclient import TestClient
from app.services.simulation_service import SimulationService


def test_api_list_scenarios(client: TestClient):
    """GET /api/v1/simulation/scenarios returns built-in scenario templates."""
    response = client.get("/api/v1/simulation/scenarios")
    assert response.status_code == status.HTTP_200_OK

    scenarios = response.json()
    assert len(scenarios) >= 3
    scenario_ids = [s["id"] for s in scenarios]
    assert "flooded_neighborhood" in scenario_ids
    assert "earthquake_district" in scenario_ids
    assert "severe_mixed_district" in scenario_ids


def test_api_simulation_lifecycle_flow(client: TestClient):
    """Test full start -> state -> tick -> pause -> tick-reject -> resume -> reset flow."""
    # Ensure fresh engine for test
    SimulationService.reset_engine()

    # 1. State before start should be not_started
    resp_init = client.get("/api/v1/simulation/state")
    assert resp_init.status_code == status.HTTP_200_OK
    assert resp_init.json()["status"] == "not_started"

    # 2. Start simulation
    payload = {
        "scenario_id": "flooded_neighborhood",
        "seed": 42,
        "grid_rows": 15,
        "grid_cols": 15,
        "num_civilians": 6,
    }
    resp_start = client.post("/api/v1/simulation/start", json=payload)
    assert resp_start.status_code == status.HTTP_200_OK
    start_data = resp_start.json()
    assert start_data["status"] == "running"
    assert start_data["current_tick"] == 0
    assert start_data["grid"] is not None
    assert len(start_data["civilians"]) == 6

    # 3. Step tick
    resp_tick = client.post("/api/v1/simulation/tick")
    assert resp_tick.status_code == status.HTTP_200_OK
    tick_data = resp_tick.json()
    assert tick_data["current_tick"] == 1
    assert tick_data["status"] == "running"
    assert len(tick_data["events"]) > 0

    # 4. Pause simulation
    resp_pause = client.post("/api/v1/simulation/pause")
    assert resp_pause.status_code == status.HTTP_200_OK
    assert resp_pause.json()["status"] == "paused"

    # 5. Tick while paused must be rejected with HTTP 400
    resp_reject = client.post("/api/v1/simulation/tick")
    assert resp_reject.status_code == status.HTTP_400_BAD_REQUEST
    assert "not running" in resp_reject.json()["detail"].lower()

    # 6. Resume simulation
    resp_resume = client.post("/api/v1/simulation/resume")
    assert resp_resume.status_code == status.HTTP_200_OK
    assert resp_resume.json()["status"] == "running"

    # 7. Advance tick again
    resp_tick2 = client.post("/api/v1/simulation/tick")
    assert resp_tick2.status_code == status.HTTP_200_OK
    assert resp_tick2.json()["current_tick"] == 2

    # 8. Reset simulation
    resp_reset = client.post("/api/v1/simulation/reset")
    assert resp_reset.status_code == status.HTTP_200_OK
    reset_data = resp_reset.json()
    assert reset_data["current_tick"] == 0
    assert reset_data["status"] == "running"


def test_api_start_simulation_validation_error(client: TestClient):
    """POST /api/v1/simulation/start rejects invalid grid dimensions with 422."""
    payload = {
        "grid_rows": 2,  # Below minimum 5
        "grid_cols": 20,
    }
    response = client.post("/api/v1/simulation/start", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
