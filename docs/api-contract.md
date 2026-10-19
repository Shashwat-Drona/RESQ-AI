# RESQ-AI API Contract (Phase 1)

This document specifies the REST API endpoints implemented in Phase 1 of RESQ-AI. All endpoints communicate over HTTP using JSON payloads and standard status codes.

---

## Base URLs
- Local Backend: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 1. System Health

### `GET /api/health`
Checks whether the backend process is running and responsive.

#### Headers
- None required

#### Success Response (`200 OK`)
```json
{
  "status": "ok",
  "service": "resq-ai-backend",
  "timestamp": "2026-10-19T06:38:00.123456Z",
  "environment": "development"
}
```

---

## 2. System Information

### `GET /api/v1/info`
Returns current project metadata, active phase identifier, and capability highlights.

#### Success Response (`200 OK`)
```json
{
  "name": "RESQ-AI",
  "phase": "Phase 1: Project Foundation & Architecture",
  "version": "0.1.0",
  "description": "AI-Powered Disaster Response & Rescue Simulator - Multi-agent emergency operations platform.",
  "supported_disasters": [
    "flood",
    "earthquake"
  ],
  "docs_url": "/docs"
}
```

---

## 3. Simulation Configuration

### `GET /api/v1/config`
Retrieves default simulation configuration parameters.

#### Success Response (`200 OK`)
```json
{
  "grid_rows": 20,
  "grid_cols": 20,
  "max_agents": 5,
  "disaster_type": "flood",
  "tick_interval_seconds": 1.0
}
```

---

### `POST /api/v1/config/validate`
Validates a candidate simulation configuration against system limits.

#### Request Body
```json
{
  "grid_rows": 30,
  "grid_cols": 30,
  "max_agents": 10,
  "disaster_type": "earthquake",
  "tick_interval_seconds": 0.5
}
```

#### Success Response (`200 OK`)
Returns the validated configuration object.

#### Error Response (`422 Unprocessable Entity`)
Occurs when grid dimensions are `< 5`, agent limit is `< 1`, or disaster type is invalid.
```json
{
  "error": "Validation Error",
  "message": "The request payload or parameters failed validation.",
  "details": [
    {
      "type": "greater_than_equal",
      "loc": ["body", "grid_rows"],
      "msg": "Input should be greater than or equal to 5",
      "input": 2
    }
  ]
}
```

---

## 4. Simulation State

### `GET /api/v1/simulation/state`
Returns the current simulation lifecycle status. In Phase 1, this returns the initial `not_started` state without active agents or fake incidents.

#### Success Response (`200 OK`)
```json
{
  "status": "not_started",
  "current_tick": 0,
  "config": {
    "grid_rows": 20,
    "grid_cols": 20,
    "max_agents": 5,
    "disaster_type": "flood",
    "tick_interval_seconds": 1.0
  },
  "active_incidents": 0,
  "active_agents": 0,
  "rescued_count": 0,
  "message": "Simulation engine initialized in standby. No active simulation session is running.",
  "updated_at": "2026-10-19T06:38:00.123456Z",
  "metadata": {
    "phase": 1,
    "engine_mode": "idle",
    "future_features": [
      "pathfinding",
      "civilian_urgency",
      "shelter_allocation",
      "resource_constraints"
    ]
  }
}
```
