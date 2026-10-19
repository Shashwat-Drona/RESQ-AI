"""Health check response schemas."""

from datetime import datetime, timezone
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Structured health check payload."""

    status: str = Field(default="ok", description="Operational status of the service")
    service: str = Field(default="resq-ai-backend", description="Backend service identifier")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Current server UTC timestamp",
    )
    environment: str = Field(default="development", description="Runtime environment")
