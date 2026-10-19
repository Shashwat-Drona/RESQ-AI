"""End-to-end API integration tests for Phase 5 agents, missions, and dispatch endpoints."""

from fastapi.testclient import TestClient
from app.main import app
from app.services.simulation_service import SimulationService

client = TestClient(app)


def setup_function():
    """Reset simulation engine before each test for test isolation."""
    SimulationService.reset_engine()


def test_api_agents_uninitialized():
    """Verify GET /simulation/agents before scenario initialization."""
    response = client.get("/api/v1/simulation/agents")
    assert response.status_code == 200
    data = response.json()
    assert data["current_tick"] == 0
    assert data["agents"] == []
    assert data["summary"]["total_agents"] == 0


def test_api_missions_uninitialized():
    """Verify GET /simulation/missions before scenario initialization."""
    response = client.get("/api/v1/simulation/missions")
    assert response.status_code == 200
    data = response.json()
    assert data["current_tick"] == 0
    assert data["missions"] == []
    assert data["summary"]["active_missions"] == 0


def test_api_events_uninitialized():
    """Verify GET /simulation/events before scenario initialization."""
    response = client.get("/api/v1/simulation/events")
    assert response.status_code == 200
    data = response.json()
    assert data["current_tick"] == 0
    assert isinstance(data["events"], list)


def test_api_fleet_lifecycle_and_tick_progression():
    """Verify agents deployed on start, advance on tick, and reset cleanly."""
    # 1. Start simulation
    start_payload = {
        "scenario_id": "flooded_neighborhood",
        "seed": 101,
        "grid_rows": 15,
        "grid_cols": 15,
        "num_civilians": 6,
        "max_agents": 4,
    }
    start_res = client.post("/api/v1/simulation/start", json=start_payload)
    assert start_res.status_code == 200
    state = start_res.json()
    assert len(state["agents"]) == 4
    assert state["active_agents"] == 4

    # 2. Query agents endpoint
    agents_res = client.get("/api/v1/simulation/agents")
    assert agents_res.status_code == 200
    agents_data = agents_res.json()
    assert agents_data["current_tick"] == 0
    assert len(agents_data["agents"]) == 4
    assert agents_data["summary"]["total_agents"] == 4
    assert agents_data["summary"]["available_agents"] == 4

    # Verify GET is read-only (tick does not advance)
    assert agents_data["current_tick"] == 0
    agents_res2 = client.get("/api/v1/simulation/agents")
    assert agents_res2.json()["current_tick"] == 0

    # 3. Advance tick 1
    tick_res = client.post("/api/v1/simulation/tick")
    assert tick_res.status_code == 200
    tick_data = tick_res.json()
    assert tick_data["current_tick"] == 1

    # 4. Query missions endpoint after tick (dispatch should have assigned missions)
    missions_res = client.get("/api/v1/simulation/missions")
    assert missions_res.status_code == 200
    missions_data = missions_res.json()
    assert missions_data["current_tick"] == 1
    assert len(missions_data["missions"]) > 0

    # 5. Query events endpoint
    events_res = client.get("/api/v1/simulation/events")
    assert events_res.status_code == 200
    events_data = events_res.json()
    assert events_data["current_tick"] == 1
    assert any("Simulation Tick 1" in e for e in events_data["events"])

    # 6. Reset simulation
    reset_res = client.post("/api/v1/simulation/reset")
    assert reset_res.status_code == 200
    reset_state = reset_res.json()
    assert reset_state["current_tick"] == 0
    assert reset_state["rescued_count"] == 0
    assert len(reset_state["missions"]) == 0
    for agent in reset_state["agents"]:
        assert agent["status"] == "idle"
        assert agent["completed_rescues"] == 0
