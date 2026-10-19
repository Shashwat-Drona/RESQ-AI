# RESQ-AI: AI-Powered Disaster Response & Rescue Simulator

> **College AI Project — Phase 2: Disaster Environment & Simulation Engine**

RESQ-AI is an autonomous disaster response simulator modeling emergency response scenarios (floods, earthquakes) across an urban grid. The system incorporates AI-driven rescue agents, dynamic road obstructions, civilian triage, shelter allocation, and resource logistics.

This repository is developed incrementally across 8 phases. **Phase 2** establishes the deterministic 2D synthetic city environment, procedural road and building networks, numerical flood propagation, structural earthquake collapse and aftershocks, affected civilians, evacuation shelters, and complete simulation lifecycle controls.

---

## 1. Phase 2 Scope & Capabilities

- **Synthetic City Grid (`CityGrid`)**:
  - Configurable grid dimensions (5x5 to 100x100).
  - Explicit terrain classifications: `ROAD`, `BUILDING`, `OPEN_GROUND`, `SHELTER`.
  - Dynamic hazard conditions: `SAFE`, `FLOODED`, `DEBRIS_BLOCKED`, `DANGEROUS`.
  - Realistic traversability constraints: buildings and deep water / debris piles are strictly non-traversable for road vehicles.
- **Deterministic Procedural Generation**:
  - Reproducible road grid networks, urban building blocks, open staging grounds, and safe elevated shelters.
  - Reproducible random seed (`seed: int`) guaranteeing identical layout generation.
- **Disaster Mechanics**:
  - **Flood Propagation**: Inflow sources inject water; gravity and elevation head drive diffusion to 4-way orthogonal neighbors; solid buildings act as flood barriers; depth is bounded [0.0, 5.0m]; water >= 1.5m triggers impassable danger.
  - **Earthquake Damage**: Seismic epicenter produces structural rubble spilling onto roads; distinct scheduled aftershocks deposit secondary debris; shelters are seismically reinforced.
- **Civilians & Shelters**:
  - Civilians with unique IDs, coordinates, triage status (`waiting`, `injured`, `trapped`, `rescued`), and urgency levels (`low`, `medium`, `high`, `critical`).
  - Shelters with designated capacity and occupancy tracking on elevated ground.
- **Complete Simulation Lifecycle API**:
  - `GET /api/v1/simulation/scenarios`: Catalog of built-in scenarios.
  - `GET /api/v1/simulation/state`: Idempotent state inspection (includes grid, civilians, shelters).
  - `POST /api/v1/simulation/start`: Initialize seeded scenario and start engine.
  - `POST /api/v1/simulation/tick`: Advance disaster by exactly one tick step (rejects if not running).
  - `POST /api/v1/simulation/pause`: Pause running simulation.
  - `POST /api/v1/simulation/resume`: Resume paused simulation.
  - `POST /api/v1/simulation/reset`: Restore initial seeded state at tick 0.
- **Built-in Scenarios**:
  1. `flooded_neighborhood`: River surge and broken levees flooding residential streets.
  2. `earthquake_district`: High-magnitude tremor collapsing structures and choking intersections.
  3. `severe_mixed_district`: Compound hazard combining building debris and ruptured water mains.

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Dark Emergency Operations theme)
- **Linting**: ESLint (`eslint-config-next`)

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Server**: Uvicorn
- **Validation**: Pydantic v2 & Pydantic Settings
- **Testing**: Pytest & HTTPX (`fastapi.testclient.TestClient`)

### Persistence (Planned for Phase 3+)
- **Database**: SQLite (`resq_ai.db`)

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
│   │   │       │   └── simulation.py
│   │   │       └── router.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── models/
│   │   │   └── persistence.py
│   │   ├── schemas/
│   │   │   ├── environment.py       # Terrain, Hazard, GridCell, Civilian, Shelter, CityGrid
│   │   │   ├── health.py
│   │   │   ├── info.py
│   │   │   └── simulation.py        # Lifecycle requests, TickResult, ScenarioInfo, SimulationState
│   │   ├── services/
│   │   │   ├── simulation_service.py
│   │   │   └── simulation/
│   │   │       ├── earthquake_model.py # Seismic collapse, debris, aftershocks
│   │   │       ├── engine.py           # SimulationEngine lifecycle manager
│   │   │       ├── flood_model.py      # Fluid diffusion & runoff model
│   │   │       ├── grid_generator.py   # Procedural synthetic city builder
│   │   │       └── scenarios.py        # Built-in scenario templates
│   │   └── main.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_config.py
│   │   ├── test_earthquake_model.py
│   │   ├── test_flood_model.py
│   │   ├── test_grid_generator.py
│   │   ├── test_health.py
│   │   ├── test_info.py
│   │   ├── test_schemas.py
│   │   ├── test_simulation.py
│   │   ├── test_simulation_api.py
│   │   └── test_simulation_engine.py
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ConfigCard.tsx
│   │   ├── ConnectionBanner.tsx
│   │   ├── Header.tsx
│   │   ├── ProjectStatusCard.tsx
│   │   ├── SimulationControls.tsx
│   │   └── SimulationStateCard.tsx
│   ├── lib/
│   │   └── api.ts
│   ├── types/
│   │   └── api.ts
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── api-contract.md
│   └── architecture.md
├── .gitignore
└── README.md
```

---

## 4. Getting Started (Windows PowerShell)

Open two separate PowerShell terminal windows.

### Terminal 1: Backend Setup & Execution

```powershell
# Navigate to the project root
cd c:\Users\Lenovo\Codes\RESQ-AI

# Activate virtual environment
.\backend\.venv\Scripts\Activate.ps1

# Start FastAPI development server
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend will be available at:
- Root: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

---

### Terminal 2: Frontend Setup & Execution

```powershell
# Navigate to the frontend directory
cd c:\Users\Lenovo\Codes\RESQ-AI\frontend

# Run Next.js development server
npm run dev -- --port 3000
```
Frontend dashboard will be available at:
- `http://localhost:3000`

---

## 5. Practical PowerShell Testing Examples

You can test the simulation engine directly from PowerShell:

```powershell
# 1. Inspect available built-in scenarios
Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/scenarios | ConvertTo-Json

# 2. Start Flooded Neighborhood scenario
$body = @{ scenario_id = "flooded_neighborhood"; seed = 101 } | ConvertTo-Json
$state = Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/start -Method Post -Body $body -ContentType "application/json"
$state.status # returns "running"
$state.current_tick # returns 0

# 3. Advance simulation by one tick
$tickResult = Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/tick -Method Post
$tickResult.current_tick # returns 1
$tickResult.events # returns narrative events describing flood spreading

# 4. Pause simulation
Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/pause -Method Post

# 5. Attempting to tick while paused is rejected with 400
try {
    Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/tick -Method Post
} catch {
    Write-Host "Correctly rejected: $($_.Exception.Message)"
}

# 6. Resume and reset
Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/resume -Method Post
Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/reset -Method Post
```

---

## 6. Running Tests

### Backend Automated Test Suite
From the project root:
```powershell
.\backend\.venv\Scripts\pytest.exe backend/tests -v
```
*(All 35 tests pass with 100% coverage across environment models, flood diffusion, earthquake rubble, scenarios, engine lifecycle, and API endpoints).*

### Frontend Lint & Production Build Verification
From `frontend/`:
```powershell
npm run lint
npm run build
```

---

## 7. Known Limitations & Simplifications (Phase 2)
- **Single Active Session**: The engine maintains one in-memory active simulation at a time in local development.
- **Synthetic Physics**: Flood propagation models cellular gravity head diffusion rather than Navier-Stokes hydrodynamic equations; earthquakes generate static rubble and scheduled aftershocks.
- **Rescue Responders & Pathfinding**: Rescue units and A* routing are part of subsequent phases (Phase 3 & Phase 4). Civilians are modeled at their hazard locations and their health degrades in deep flooding, ready for responder agents.

---

## 8. Planned Future Phases
- **Phase 3**: Civilian Distress Beacon Generation, Urgency Countdown, Triage Levels.
- **Phase 4**: Heterogeneous Rescue Agent Fleet (Boats, Drones, Ambulances).
- **Phase 5**: A* / Dynamic Navigation around Damaged Obstacles.
- **Phase 6**: Task Allocation & Heuristic Dispatch AI.
- **Phase 7**: Shelter Capacity Management & Medical Depot Restock.
- **Phase 8**: Real-time Analytics, Replay Controller, and Survival Metrics.
