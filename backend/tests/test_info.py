"""Automated tests for system information endpoint."""

from fastapi import status
from fastapi.testclient import TestClient


def test_get_app_info_returns_phase_metadata(client: TestClient):
    """Test that GET /api/v1/info returns application name and Phase metadata."""
    response = client.get("/api/v1/info")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["name"] == "RESQ-AI"
    assert "Phase" in data["phase"]
    assert "disaster" in data["description"].lower()
    assert "flood" in data["supported_disasters"]
    assert "earthquake" in data["supported_disasters"]
