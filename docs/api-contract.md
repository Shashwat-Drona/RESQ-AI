# RESQ-AI API Contract (Phase 2)

This document specifies the REST API endpoints implemented in RESQ-AI for Phase 2. All endpoints communicate over HTTP using JSON payloads and standard status codes.

---

## Base URLs
- Local Backend: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 1. System Health & Info

### `GET /api/health`
Checks whether the backend process is running and responsive.

#### Success Response (`200 OK`)
```json
{
  "status": "ok",
  "service": "resq-ai-backend",
  "timestamp": "2026-10-19T13:40:00.123456Z",
  "environment": "development"
}
```

---

### `GET /api/v1/info`
Returns current project metadata, active phase identifier, and capability highlights.

#### Success Response (`200 OK`)
```json
{
  "name": "RESQ-AI",
  "phase": "Phase 2: Disaster Environment & Simulation Engine",
  "version": "0.2.0",
  "description": "AI-Powered Disaster Response & Rescue Simulator - Multi-agent emergency operations platform.",
  "supported_disasters": [
    "flood",
    "earthquake"
  ],
  "docs_url": "/docs"
}
```

---

## 2. Simulation Configuration

### `GET /api/v1/config`
Retrieves default simulation configuration parameters.

#### Success Response (`200 OK`)
```json
{
  "grid_rows": 20,
  "grid_cols": 20,
  "max_agents": 5,
  "disaster_type": "flood",
  "tick_interval_seconds": 1.0,
  "seed": 42,
  "scenario_id": null
}
```

---

### `POST /api/v1/config/validate`
Validates a candidate simulation configuration against system limits.

#### Request Body
```json
{
  "grid_rows": 25,
  "grid_cols": 25,
  "max_agents": 8,
  "disaster_type": "flood",
  "tick_interval_seconds": 1.0
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

## 3. Scenarios Catalog

### `GET /api/v1/simulation/scenarios`
Returns pre-configured disaster scenarios available for initialization.

#### Success Response (`200 OK`)
```json
[
  {
    "id": "flooded_neighborhood",
    "name": "Flooded Neighborhood",
    "description": "River overflow and broken storm levees cause progressive water inundation across low-lying residential streets.",
    "disaster_type": "flood",
    "default_seed": 101,
    "recommended_rows": 20,
    "recommended_cols": 20,
    "civilian_count": 8
  },
  {
    "id": "earthquake_district",
    "name": "Earthquake-Damaged District",
    "description": "A high-magnitude seismic tremor collapses multi-story buildings, depositing heavy rubble and blocking crucial road intersections.",
    "disaster_type": "earthquake",
    "default_seed": 202,
    "recommended_rows": 20,
    "recommended_cols": 20,
    "civilian_count": 10
  },
  {
    "id": "severe_mixed_district",
    "name": "Severe Mixed-Obstacle Scenario",
    "description": "Severe disaster featuring seismic building collapses alongside ruptured high-pressure water mains.",
    "disaster_type": "flood",
    "default_seed": 303,
    "recommended_rows": 20,
    "recommended_cols": 20,
    "civilian_count": 12
  }
]
```

---

## 4. Simulation Lifecycle & Environment

### `GET /api/v1/simulation/state`
Returns the current simulation lifecycle status and full environment state (2D grid, civilians, shelters).

#### Success Response (`200 OK` - Not Started)
```json
{
  "status": "not_started",
  "current_tick": 0,
  "config": {
    "grid_rows": 20,
    "grid_cols": 20,
    "max_agents": 5,
    "disaster_type": "flood",
    "tick_interval_seconds": 1.0,
    "seed": 42,
    "scenario_id": null
  },
  "active_incidents": 0,
  "active_agents": 0,
  "rescued_count": 0,
  "message": "Simulation engine initialized in standby. No active simulation session is running.",
  "updated_at": "2026-10-19T13:40:00.123456Z",
  "grid": null,
  "civilians": [],
  "shelters": [],
  "scenario_id": null,
  "tick_events": [],
  "metadata": {
    "phase": 2,
    "engine_mode": "idle"
  }
}
```

---

### `POST /api/v1/simulation/start`
Initializes a fresh synthetic city environment and starts the disaster engine.

#### Request Body
```json
{
  "scenario_id": "flooded_neighborhood",
  "seed": 101,
  "grid_rows": 20,
  "grid_cols": 20,
  "num_civilians": 8
}
```

#### Success Response (`200 OK`)
Returns the complete initialized `SimulationState`, with `status: "running"`, populated `grid`, `civilians`, and `shelters`.

---

### `POST /api/v1/simulation/tick`
Advances a running simulation by exactly one tick step.

#### Success Response (`200 OK`)
```json
{
  "current_tick": 1,
  "status": "running",
  "events": [
    "--- Simulation Tick 1 ---",
    "Flood surge breach initiated at (0, 0) [Initial depth: 1.20m].",
    "Road at (0, 1) became flooded (0.45m)."
  ],
  "state": {
    "status": "running",
    "current_tick": 1,
    "active_incidents": 8,
    "rescued_count": 0,
    "message": "Simulation is active and running."
  }
}
```

#### Error Response (`400 Bad Request`)
Returned when attempting to advance ticks on a paused or idle simulation.
```json
{
  "detail": "Simulation is not running (current status: 'paused')."
}
```

---

### `POST /api/v1/simulation/pause`
Pauses a running simulation without destroying environmental state.

#### Success Response (`200 OK`)
Returns `SimulationState` with `status: "paused"`.

---

### `POST /api/v1/simulation/resume`
Resumes a paused simulation.

#### Success Response (`200 OK`)
Returns `SimulationState` with `status: "running"`.

---

### `POST /api/v1/simulation/reset`
Restores the initial seeded scenario at tick 0 with clean terrain and original civilian placements.

#### Success Response (`200 OK`)
Returns `SimulationState` with `current_tick: 0` and `status: "running"`.

---

## 4. Phase 3: Pathfinding & Route Planning

### `POST /api/v1/simulation/route`
Computes an optimal 4-directional A* route between two coordinates in the active city grid, taking into account terrain and dynamic hazards for the specified movement profile. Does not advance simulation ticks or mutate state.

#### Request Body
```json
{
  "start": { "row": 0, "col": 0 },
  "goal": { "row": 15, "col": 15 },
  "movement_profile": "ground_responder"
}
```

- `start` (object, required): Start `Coordinate` (`row >= 0`, `col >= 0`).
- `goal` (object, required): Goal `Coordinate` (`row >= 0`, `col >= 0`).
- `movement_profile` (string, optional, default `"ground_responder"`): Selected responder capabilities:
  - `"ground_responder"`: Conventional rescue vehicle (avoids dangerous water $\ge 1.5$m, buildings, debris).
  - `"on_foot"`: Responder on foot (can wade shallow flood waters with elevated cost, avoids dangerous water, buildings, debris).

#### Success Response (`200 OK`) - Route Found
```json
{
  "found": true,
  "start": { "row": 0, "col": 0 },
  "goal": { "row": 15, "col": 15 },
  "path": [
    { "row": 0, "col": 0 },
    { "row": 0, "col": 1 },
    { "row": 1, "col": 1 }
  ],
  "path_length": 2,
  "total_cost": 2.0,
  "expanded_nodes": 12,
  "movement_profile": "ground_responder",
  "reason": null
}
```

#### Success Response (`200 OK`) - Route Blocked / Unreachable
```json
{
  "found": false,
  "start": { "row": 0, "col": 0 },
  "goal": { "row": 2, "col": 2 },
  "path": [],
  "path_length": 0,
  "total_cost": 0.0,
  "expanded_nodes": 45,
  "movement_profile": "ground_responder",
  "reason": "Destination is completely blocked by buildings or hazards."
}
```

#### Error Response (`400 Bad Request`)
Returned when simulation has not been initialized or active grid is unavailable.
```json
{
  "detail": "Simulation grid is not initialized. Please start a scenario first."
}
```

#### Error Response (`422 Unprocessable Content`)
Returned when coordinates are outside the grid dimensions or coordinates fail schema validation.
```json
{
  "detail": "Start coordinate (25, 25) is outside grid dimensions (20x20)."
}
```

