"""Automated tests for health check endpoints."""

from fastapi import status
from fastapi.testclient import TestClient


def test_health_check_returns_ok(client: TestClient):
    """Test that GET /api/health responds with 200 OK and valid health schema."""
    response = client.get("/api/health")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert "timestamp" in data
    assert data["service"] == "resq-ai-backend"


def test_root_endpoint_returns_discovery(client: TestClient):
    """Test root endpoint provides service status and route links."""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["service"] == "RESQ-AI"
    assert data["status"] == "online"
    assert "/api/health" in data["health"]
