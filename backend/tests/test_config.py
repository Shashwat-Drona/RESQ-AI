"""Automated tests for simulation configuration endpoint and validation."""

from fastapi import status
from fastapi.testclient import TestClient


def test_get_default_config(client: TestClient):
    """Test GET /api/v1/config returns valid default parameters."""
    response = client.get("/api/v1/config")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["grid_rows"] == 20
    assert data["grid_cols"] == 20
    assert data["max_agents"] == 5
    assert data["disaster_type"] in ["flood", "earthquake"]
    assert data["tick_interval_seconds"] > 0


def test_validate_config_success(client: TestClient):
    """Test POST /api/v1/config/validate accepts valid configuration."""
    payload = {
        "grid_rows": 30,
        "grid_cols": 30,
        "max_agents": 10,
        "disaster_type": "earthquake",
        "tick_interval_seconds": 0.5,
    }
    response = client.post("/api/v1/config/validate", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["grid_rows"] == 30
    assert data["disaster_type"] == "earthquake"


def test_validate_config_rejection_of_invalid_dimensions(client: TestClient):
    """Test POST /api/v1/config/validate rejects grid dimensions below minimum."""
    payload = {
        "grid_rows": 2,  # min is 5
        "grid_cols": 20,
        "max_agents": 5,
        "disaster_type": "flood",
        "tick_interval_seconds": 1.0,
    }
    response = client.post("/api/v1/config/validate", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    error_data = response.json()
    assert "error" in error_data
    assert "details" in error_data


def test_validate_config_rejection_of_invalid_disaster(client: TestClient):
    """Test POST /api/v1/config/validate rejects unsupported disaster type."""
    payload = {
        "grid_rows": 20,
        "grid_cols": 20,
        "max_agents": 5,
        "disaster_type": "alien_invasion",  # invalid
        "tick_interval_seconds": 1.0,
    }
    response = client.post("/api/v1/config/validate", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
