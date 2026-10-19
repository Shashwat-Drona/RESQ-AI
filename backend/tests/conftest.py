"""Pytest fixtures and configuration."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.simulation_service import SimulationService


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Create a test client instance for the FastAPI application."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def reset_engine_isolation():
    """Ensure active SimulationEngine is reset to clean standby state before each test."""
    SimulationService.reset_engine()
    yield
    SimulationService.reset_engine()
