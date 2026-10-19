"""Pytest fixtures and configuration."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Create a test client instance for the FastAPI application."""
    with TestClient(app) as test_client:
        yield test_client
