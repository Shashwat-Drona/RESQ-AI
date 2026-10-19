"""Application metadata and project info response schema."""

from typing import List
from pydantic import BaseModel, Field


class AppInfoResponse(BaseModel):
    """Structured response describing application name, phase, and description."""

    name: str = Field(..., description="Project name")
    phase: str = Field(..., description="Current active project phase")
    version: str = Field(..., description="Semantic version")
    description: str = Field(..., description="Brief project overview")
    supported_disasters: List[str] = Field(
        default=["flood", "earthquake"],
        description="Disaster types planned/supported by the simulator",
    )
    docs_url: str = Field(default="/docs", description="Interactive API documentation path")
