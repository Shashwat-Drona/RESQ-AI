"""Data persistence design and metadata specification.

In Phase 1, RESQ-AI does not require an active database connection because all
endpoints expose foundational metadata and default configuration.
In Phase 2+, SQLite will persist simulation sessions, tick telemetry, and incident history.
"""

from typing import Dict, Any


class PersistencePlan:
    """Documents the planned SQLite entity relational model for Phase 2+."""

    DATABASE_ENGINE = "sqlite"
    DEFAULT_SQLITE_PATH = "sqlite:///./resq_ai.db"

    PLANNED_TABLES: Dict[str, Dict[str, Any]] = {
        "simulation_runs": {
            "description": "Records individual disaster simulation executions",
            "columns": [
                "id (INTEGER PRIMARY KEY)",
                "created_at (DATETIME)",
                "disaster_type (VARCHAR(32))",
                "grid_rows (INTEGER)",
                "grid_cols (INTEGER)",
                "max_agents (INTEGER)",
                "status (VARCHAR(32))",
                "final_tick (INTEGER)",
                "total_rescued (INTEGER)",
            ],
        },
        "simulation_ticks": {
            "description": "Time-series telemetry of simulation ticks for replay and metrics",
            "columns": [
                "id (INTEGER PRIMARY KEY)",
                "run_id (INTEGER FOREIGN KEY -> simulation_runs.id)",
                "tick_number (INTEGER)",
                "timestamp (DATETIME)",
                "active_incidents_json (TEXT)",
                "agent_positions_json (TEXT)",
                "metrics_json (TEXT)",
            ],
        },
        "shelters": {
            "description": "Static evacuation safe zones with resource capacities",
            "columns": [
                "id (INTEGER PRIMARY KEY)",
                "name (VARCHAR(64))",
                "row (INTEGER)",
                "col (INTEGER)",
                "capacity (INTEGER)",
                "current_occupancy (INTEGER)",
            ],
        },
    }
