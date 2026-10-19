# RESQ-AI: AI-Powered Disaster Response & Rescue Simulator

> **College AI Project — Phase 3: A* Pathfinding & Dynamic Route Planning**

RESQ-AI is an autonomous disaster response simulator modeling emergency operations (floods, earthquakes) across an urban grid. The system incorporates AI-driven rescue agents, dynamic road obstructions, civilian triage, shelter allocation, and resource logistics.

This repository is developed incrementally across 8 phases. **Phase 3** implements a deterministic, hazard-aware **A* Pathfinding and Dynamic Route Planning** engine integrated into the simulation lifecycle and interactive mission-control frontend.

---

## 1. Phase 3 Scope & Capabilities

- **Optimal 4-Directional A* Pathfinding (`AStarPathfinder`)**:
  - Independent, reusable algorithmic core operating over grid coordinates.
  - Strictly 4-directional cardinal movement (Up, Down, Left, Right); no diagonal moves permitted.
  - Manhattan distance heuristic ($|r_1 - r_2| + |c_1 - c_2|$), mathematically proven **admissible** and **consistent** given a minimum step cost $\ge 1.0$.
  - Efficient priority queue (`heapq`) with stable monotonic tie-breaking guaranteeing deterministic route selection.
  - Zero-cost, 1-step route handling when start equals goal on traversable cells.
  - Meaningful, human-readable explanations when routes are blocked or unreachable.
- **Movement Profiles & Hazard-Aware Costs**:
  - **`ground_responder` (Rescue Vehicles)**:
    - Safe Road: cost `1.0`
    - Safe Open Ground: cost `1.2`
    - Shelter Cell: cost `1.0`
    - Flooded Water ($< 1.5$m) or Dangerous Water ($\ge 1.5$m): **Impassable** (vehicles avoid water hazards).
    - Debris Blocked / Buildings: **Impassable**.
  - **`on_foot` (Pedestrian Responders)**:
    - Safe Road: cost `1.0`
    - Safe Open Ground: cost `1.0`
    - Shelter Cell: cost `1.0`
    - Shallow Flooding ($< 1.5$m): **Passable with depth penalty** ($\text{cost} = 3.0 + 2.0 \times \text{water\_level}$).
    - Dangerous Water ($\ge 1.5$m) or Debris Blocked / Buildings: **Impassable**.
- **Dynamic Replanning**:
  - Route planning requests (`POST /api/v1/simulation/route`) dynamically inspect the **current active simulation grid**.
  - As flood waters spread or earthquake aftershocks produce new debris over simulation ticks, re-requesting the route automatically navigates around new hazards or reports unreachable status.
  - Route calculation is strictly read-only: does **not** advance ticks or mutate simulation state.
- **Interactive Mission Control UI**:
  - Live 2D grid visualizer (`CityGridView`) displaying roads, buildings, open grounds, shelters, flooded cells, debris piles, start/goal markers, and highlighted A* path.
  - Interactive route planner panel (`RoutePlanner`) with start/goal coordinate inputs, profile switcher, live telemetry (found status, path steps, total cost, expanded nodes), and coordinate inspection.

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Dark Mission Control theme)
- **Linting**: ESLint (`eslint-config-next`)

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Server**: Uvicorn
- **Validation**: Pydantic v2 & Pydantic Settings
- **Testing**: Pytest & HTTPX (`fastapi.testclient.TestClient`)

---

## 3. Project Directory Structure

```text
RESQ-AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── config.py
│   │   │       │   ├── health.py
│   │   │       │   ├── info.py
│   │   │       │   └── simulation.py        # Lifecycle & Route Planning endpoints
│   │   │       └── router.py
│   │   ├── core/
│   │   │   └── config.py                    # App configuration & settings
│   │   ├── schemas/
│   │   │   ├── environment.py               # CityGrid, GridCell, TerrainType, HazardState
│   │   │   ├── route.py                     # RouteRequest, RouteResponse, MovementProfile
│   │   │   └── simulation.py                # SimulationState, TickResult, ScenarioInfo
│   │   ├── services/
│   │   │   ├── simulation_service.py        # Service orchestrator
│   │   │   └── simulation/
│   │   │       ├── earthquake_model.py      # Seismic collapse & aftershocks
│   │   │       ├── engine.py                # SimulationEngine lifecycle manager
│   │   │       ├── flood_model.py           # Fluid diffusion & runoff model
│   │   │       ├── grid_generator.py        # Procedural synthetic city builder
│   │   │       ├── pathfinding.py           # A* Pathfinding engine & heuristic
│   │   │       └── scenarios.py             # Built-in scenario templates
│   │   └── main.py
│   └── tests/
│       ├── conftest.py                      # Engine state reset fixture
│       ├── test_config.py
│       ├── test_earthquake_model.py
│       ├── test_flood_model.py
│       ├── test_grid_generator.py
│       ├── test_health.py
│       ├── test_info.py
│       ├── test_pathfinding.py              # A* algorithm unit tests
│       ├── test_route_api.py                # Route API & dynamic replanning tests
│       ├── test_schemas.py
│       ├── test_simulation.py
│       ├── test_simulation_api.py
│       └── test_simulation_engine.py
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx                         # Mission Control Console
│   ├── components/
│   │   ├── CityGridView.tsx                 # 2D Grid & Path Overlay Visualizer
│   │   ├── ConfigCard.tsx
│   │   ├── ConnectionBanner.tsx
│   │   ├── Header.tsx
│   │   ├── ProjectStatusCard.tsx
│   │   ├── RoutePlanner.tsx                 # A* Route Planning Controls
│   │   ├── SimulationControls.tsx
│   │   └── SimulationStateCard.tsx
│   ├── lib/
│   │   └── api.ts                           # Typed HTTP client
│   └── types/
│       └── api.ts                           # TypeScript schema mirrors
├── docs/
│   ├── api-contract.md
│   └── architecture.md
└── README.md
```

---

## 4. Getting Started & Execution

### Prerequisites
- Python 3.12+ (in `backend/.venv`)
- Node.js 18+ & npm (in `frontend/`)

---

### Terminal 1: Backend Setup & Execution

```powershell
# Navigate to the backend directory
cd c:\Users\Lenovo\Codes\RESQ-AI\backend

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# Run the FastAPI server with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend endpoints will be available at:
- Root API: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

---

### Terminal 2: Frontend Setup & Execution

```powershell
# Navigate to the frontend directory
cd c:\Users\Lenovo\Codes\RESQ-AI\frontend

# Run Next.js development server
npm run dev -- --port 3000
```

Frontend mission control dashboard will be available at:
- `http://localhost:3000`

---

## 5. Testing & Verification

### Backend Automated Test Suite
From the project root:
```powershell
.\backend\.venv\Scripts\pytest.exe backend/tests -v
```
*(All 55 tests pass with 100% success across pathfinding optimality, heuristic admissibility, hazard costs, route APIs, dynamic replanning, simulation lifecycle, and environment models).*

### Frontend Verification
From `frontend/`:
```powershell
npm run lint
npm run build
```
*(Zero ESLint warnings or errors; production build compiles cleanly).*

---

## 6. Practical PowerShell Testing Examples

### 1. Initialize Scenario and Request an A* Route
```powershell
# Start scenario
$body = @{ scenario_id = "flooded_neighborhood"; seed = 101 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/start -Method Post -Body $body -ContentType "application/json"

# Request optimal ground responder route
$routeBody = @{
    start = @{ row = 0; col = 0 }
    goal = @{ row = 5; col = 5 }
    movement_profile = "ground_responder"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/route -Method Post -Body $routeBody -ContentType "application/json"
Write-Host "Found: $($res.found) | Length: $($res.path_length) | Cost: $($res.total_cost) | Nodes: $($res.expanded_nodes)"
```

### 2. Observe Dynamic Route Replanning Across Ticks
```powershell
# Advance simulation by 3 ticks to expand flood water
1..3 | ForEach-Object {
    Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/tick -Method Post | Out-Null
}

# Request the route again: algorithm dynamically discovers alternate detours around newly flooded cells
$resAfterTick = Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/route -Method Post -Body $routeBody -ContentType "application/json"
Write-Host "Updated Route Found: $($resAfterTick.found) | Cost: $($resAfterTick.total_cost)"
```

### 3. Test Blocked / Unreachable Destination
```powershell
# Request route to a building cell (e.g. row 1, col 1 in standard procedural block)
$blockedBody = @{
    start = @{ row = 0; col = 0 }
    goal = @{ row = 1; col = 1 }
    movement_profile = "ground_responder"
} | ConvertTo-Json

$blockedRes = Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/route -Method Post -Body $blockedBody -ContentType "application/json"
Write-Host "Found: $($blockedRes.found) | Reason: $($blockedRes.reason)"
```

---

## 7. Known Limitations & Simplifications (Phase 3)

- **Static Planning Scope**: Phase 3 calculates optimal routes and displays them visually. Autonomous agent movement along these paths is explicitly scheduled for Phase 4.
- **Single In-Memory Session**: The server maintains one active in-memory simulation engine for local development.
- **No Diagonal Movement**: Movement is strictly 4-directional to maintain realistic urban street navigation and predictable obstacle avoidance.

---

## 8. Planned Future Phases
- **Phase 4**: Heterogeneous Rescue Agent Fleet (Ambulances, Boats, Drones) & Autonomous Path Following.
- **Phase 5**: Dynamic Multi-Agent Collision Avoidance & Priority Traffic Protocols.
- **Phase 6**: Task Allocation & AI Dispatch Heuristics (Civilian Triage Assignment).
- **Phase 7**: Shelters, Depots & Resource Logistics (Fuel, Medical Supplies).
- **Phase 8**: Real-time Analytics, Simulation Replay Controller, and Survival Metrics.
