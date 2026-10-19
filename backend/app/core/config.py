"""Core application settings and configuration."""

from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings loaded from environment or defaults."""

    app_name: str = "RESQ-AI"
    app_version: str = "0.5.0"
    phase: str = "Phase 5: Multi-Agent Rescue Coordination & Autonomous Dispatch"
    description: str = (
        "AI-Powered Disaster Response & Rescue Simulator - Multi-agent emergency operations platform."
    )
    environment: str = "development"
    debug: bool = True

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS settings - default allowed frontend origins
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Planned database configuration (SQLite for Phase 2+)
    database_url: str = "sqlite:///./resq_ai.db"

    # Default simulation configuration values
    default_grid_rows: int = 20
    default_grid_cols: int = 20
    default_max_agents: int = 5
    default_disaster_type: str = "flood"
    default_tick_interval_seconds: float = 1.0

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
