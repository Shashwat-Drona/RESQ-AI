# RESQ-AI API Contract (Phase 8)

This document specifies the complete REST API endpoints implemented in RESQ-AI for Phase 8 (Final Testing, Polish & Presentation Readiness). All endpoints communicate over HTTP using JSON payloads and standard status codes.

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
  "phase": "Phase 8: Final Testing, Polish & Presentation Readiness",
  "version": "1.0.0",
  "description": "AI-Powered Disaster Response & Rescue Simulator - Complete autonomous emergency operations, multi-agent coordination, and strategy benchmarking platform.",
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

---

## 5. Phase 4: Intelligent Rescue Prioritization & Civilian Triage

### `GET /api/v1/simulation/priorities`
Evaluates and returns the ranked active rescue queue and aggregate triage summary across all civilians in the active simulation. Incorporates urgency level, health deficit, trapped/injured status, active cell hazard exposure, and waiting time. Non-mutating read-only endpoint.

#### Success Response (`200 OK`)
```json
{
  "current_tick": 2,
  "queue": [
    {
      "rank": 1,
      "civilian_id": "civ_3",
      "coordinate": { "row": 0, "col": 0 },
      "status": "trapped",
      "urgency": "critical",
      "health": 18,
      "waiting_ticks": 2,
      "priority_score": 96.6,
      "hazard_state": "dangerous",
      "water_level": 2.1,
      "debris_severity": 0.0,
      "explanation": "Critical triage priority; Trapped by physical hazards; Exposed to deep water danger (2.1m); Severe health depletion (18%); Awaiting evacuation (2 ticks).",
      "score_breakdown": {
        "urgency_score": 40.0,
        "health_score": 24.6,
        "trapped_score": 15.0,
        "hazard_score": 15.0,
        "injured_score": 0.0,
        "waiting_score": 2.0
      }
    },
    {
      "rank": 2,
      "civilian_id": "civ_1",
      "coordinate": { "row": 4, "col": 4 },
      "status": "injured",
      "urgency": "high",
      "health": 65,
      "waiting_ticks": 2,
      "priority_score": 53.5,
      "hazard_state": "flooded",
      "water_level": 0.6,
      "debris_severity": 0.0,
      "explanation": "High urgency incident; Suffering physical trauma; In flooded roadway (0.6m); Declining health (65%).",
      "score_breakdown": {
        "urgency_score": 25.0,
        "health_score": 10.5,
        "trapped_score": 0.0,
        "hazard_score": 8.0,
        "injured_score": 8.0,
        "waiting_score": 2.0
      }
    }
  ],
  "summary": {
    "total_civilians": 8,
    "active_unrescued": 8,
    "rescued_count": 0,
    "critical_count": 2,
    "high_count": 3,
    "medium_count": 2,
    "low_count": 1,
    "trapped_count": 2,
    "injured_count": 4
  },
  "is_heuristic": true,
  "methodology": "RESQ-AI Multi-Factor Weighted Triage Heuristic"
}
```

#### Error Response (`400 Bad Request`)
Returned when simulation has not been initialized.
```json
{
  "detail": "Simulation has not been initialized. Start a scenario before requesting rescue priorities."
}
```

---

## 7. Autonomous Rescue Agents & Mission Dispatch

### `GET /api/v1/simulation/agents`
Retrieves all deployed rescue agents, current coordinates, operational availability status, patient aboard, and fleet summary. Strictly read-only; does not advance ticks.

#### Success Response (`200 OK`)
```json
{
  "current_tick": 4,
  "agents": [
    {
      "id": "agent_ground_1",
      "name": "Alpha-1 (Vehicle)",
      "type": "ground_responder",
      "coordinate": { "row": 2, "col": 3 },
      "status": "en_route",
      "movement_profile": "ground_responder",
      "current_mission_id": "mission_civ_1_1_agent_ground_1",
      "target_civilian_id": "civ_1",
      "carrying_civilian_id": null,
      "completed_rescues": 0,
      "speed_cells_per_tick": 1,
      "active_path": [
        { "row": 2, "col": 4 },
        { "row": 2, "col": 5 }
      ],
      "metadata": {
        "spawn_location": [0, 0],
        "unit_type": "ground_responder"
      }
    },
    {
      "id": "agent_foot_1",
      "name": "Bravo-1 (Foot)",
      "type": "foot_responder",
      "coordinate": { "row": 0, "col": 4 },
      "status": "idle",
      "movement_profile": "on_foot",
      "current_mission_id": null,
      "target_civilian_id": null,
      "carrying_civilian_id": null,
      "completed_rescues": 1,
      "speed_cells_per_tick": 1,
      "active_path": [],
      "metadata": {
        "spawn_location": [0, 4],
        "unit_type": "foot_responder"
      }
    }
  ],
  "summary": {
    "total_agents": 4,
    "available_agents": 2,
    "active_missions": 2,
    "completed_evacuations": 1,
    "failed_missions": 0
  }
}
```

---

### `GET /api/v1/simulation/missions`
Retrieves active, completed, and failed rescue missions, planned routes, and assignment explanations. Strictly read-only.

#### Success Response (`200 OK`)
```json
{
  "current_tick": 8,
  "missions": [
    {
      "id": "mission_civ_3_1_agent_foot_2",
      "agent_id": "agent_foot_2",
      "civilian_id": "civ_3",
      "target_coordinate": { "row": 10, "col": 4 },
      "shelter_id": "shelter_2",
      "shelter_coordinate": { "row": 0, "col": 4 },
      "status": "completed",
      "route": [
        { "row": 10, "col": 4 },
        { "row": 9, "col": 4 },
        { "row": 0, "col": 4 }
      ],
      "route_step_index": 10,
      "created_at_tick": 1,
      "completed_at_tick": 8,
      "explanation": "Civilian civ_3 safely evacuated into Evacuation Shelter B by Bravo-2 (Foot) at tick 8."
    }
  ],
  "summary": {
    "total_agents": 4,
    "available_agents": 3,
    "active_missions": 1,
    "completed_evacuations": 1,
    "failed_missions": 0
  }
}
```

---

### `GET /api/v1/simulation/events`
Retrieves operational event logs and autonomous dispatch notifications.

#### Success Response (`200 OK`)
```json
{
  "current_tick": 8,
  "events": [
    "--- Simulation Tick 8 ---",
    "Rescue Complete: Civilian civ_3 successfully evacuated to Evacuation Shelter B by Bravo-2 (Foot)!"
  ]
}
```

---

## 7. Strategy Evaluation & Baseline Benchmarking

### `POST /api/v1/simulation/evaluate`
Runs an empirical benchmark comparing the AI multi-factor triage coordinator against a naive FIFO baseline across identical scenarios and seeds in an isolated background sandbox.

#### Request Body
```json
{
  "scenario_id": "earthquake_district",
  "trials": 3,
  "max_ticks": 40,
  "seed": 42
}
```

#### Success Response (`200 OK`)
```json
{
  "scenario_id": "earthquake_district",
  "scenario_name": "Earthquake-Damaged District",
  "trials": 3,
  "max_ticks": 40,
  "base_seed": 42,
  "completed_at": "2026-10-19T18:00:00Z",
  "ai_strategy": {
    "strategy": "AI_TRIAGE",
    "avg_civilians_rescued": 3.0,
    "avg_unrescued_remaining": 3.0,
    "avg_critical_rescued": 1.0,
    "avg_rescue_ticks": 12.33,
    "avg_population_health": 78.43,
    "avg_blocked_missions": 0.0,
    "rescue_rate_pct": 50.0
  },
  "baseline_strategy": {
    "strategy": "BASELINE_FIFO",
    "avg_civilians_rescued": 3.0,
    "avg_unrescued_remaining": 3.0,
    "avg_critical_rescued": 0.67,
    "avg_rescue_ticks": 11.67,
    "avg_population_health": 76.51,
    "avg_blocked_missions": 0.0,
    "rescue_rate_pct": 50.0
  },
  "delta": {
    "delta_rescued": 0.0,
    "delta_critical_rescued": 0.33,
    "delta_avg_ticks": 0.66,
    "delta_avg_health": 1.92,
    "delta_blocked_missions": 0.0,
    "pct_change_rescued": 0.0
  },
  "analytical_conclusion": "Across 3 trials, AI Triage rescued 3.00 vs Baseline 3.00 (+0.0% survivors). Critically, AI Triage prioritized high-acuity victims, saving +0.33 critical civilians (+50.0%) and yielding higher mean population health (+1.9% HP).",
  "trials_detail": []
}
```

---

### `GET /api/v1/simulation/evaluate/latest`
Retrieves cached results from the most recent evaluation run, or returns `latest: null` if no benchmark has been executed yet.

#### Success Response (`200 OK`)
```json
{
  "latest": {
    "scenario_id": "earthquake_district",
    "scenario_name": "Earthquake-Damaged District",
    "trials": 3
  }
}
```


