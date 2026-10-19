"""Automated tests for simulation state endpoint."""

from fastapi import status
from fastapi.testclient import TestClient


def test_get_simulation_state_is_not_started(client: TestClient):
    """Test GET /api/v1/simulation/state returns 'not_started' and zero active incidents."""
    response = client.get("/api/v1/simulation/state")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["status"] == "not_started"
    assert data["current_tick"] == 0
    assert data["active_incidents"] == 0
    assert data["active_agents"] == 0
    assert data["rescued_count"] == 0
    assert "config" in data
    assert data["config"]["grid_rows"] == 20
    assert data["config"]["grid_cols"] == 20
