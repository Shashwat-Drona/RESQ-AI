# RESQ-AI: AI-Powered Disaster Response & Rescue Simulator

> **College AI Project — Phase 4: Intelligent Rescue Prioritization & Civilian Triage**

RESQ-AI is an autonomous disaster response simulator modeling emergency operations (floods, earthquakes) across an urban grid. The system incorporates AI-driven rescue agents, dynamic road obstructions, civilian triage, shelter allocation, and resource logistics.

This repository is developed incrementally across 8 phases. **Phase 4** implements a transparent, deterministic **Rescue Prioritization and Civilian Triage** engine, dynamic physiological deterioration, hazard exposure tracking, and an interactive **Rescue Priority Queue** in the mission-control dashboard.

---

## 1. Phase 4 Scope & Capabilities

- **Transparent Multi-Factor Triage Scoring (`RescuePrioritizer`)**:
  - Independent, testable scoring service calculating composite priority scores:
    $$\text{Score} = S_{\text{urgency}} + S_{\text{health}} + S_{\text{trapped}} + S_{\text{hazard}} + S_{\text{injured}} + S_{\text{waiting}}$$
  - **Urgency Weights**: `CRITICAL` (+40.0), `HIGH` (+25.0), `MEDIUM` (+15.0), `LOW` (+5.0).
  - **Health Deficit**: $(100 - \text{health}) \times 0.30$ (up to +30.0 for near-zero health).
  - **Trapped Bonus**: +15.0 for physically trapped civilians.
  - **Hazard Exposure**: +15.0 for dangerous water ($\ge 1.5$m); up to +12.0 for structural debris; up to +10.0 for flooded roadways.
  - **Injury Status**: +8.0 for injured trauma.
  - **Waiting Time**: +1.0 per tick awaiting rescue, **strictly capped at 10.0** to prevent waiting time from eclipsing acute life-threatening emergencies.
  - **Deterministic Tie-Breaking**: Priority score (desc), urgency level (desc: CRITICAL > HIGH > MEDIUM > LOW), health percentage (asc: lower health first), and civilian ID (asc: stable alphabetical ordering).
  - Full component breakdown and clear rationale explanations for each civilian in the queue.
- **Dynamic Physiological Health Deterioration (`CivilianDeteriorationModel`)**:
  - Updated on each simulation tick (`SimulationEngine.step()`):
    - Deep flooding ($\ge 1.5$m) / Dangerous hazard: $-8$ HP/tick, status becomes `TRAPPED`, urgency escalates to `CRITICAL`.
    - Structural debris ($\ge 2.0$): $-5$ HP/tick, status becomes `TRAPPED`, urgency escalates to `HIGH`.
    - Flooded roadways: $-3$ HP/tick, status becomes `INJURED`, urgency escalates to `MEDIUM`.
    - Safe sector with injuries: $-1$ HP/tick ongoing trauma decay.
    - Safe sector uninjured: $0$ HP decay (stable).
    - Threshold escalation: health $\le 25 \implies \text{CRITICAL}$; health $\le 50 \implies \text{HIGH}$.
    - Health clamped strictly in $[0, 100]$.
    - Rescued civilians in shelters never deteriorate and do not increment waiting time.
- **Dedicated Priorities API**:
  - `GET /api/v1/simulation/priorities`: Returns ranked active rescue queue, component score breakdowns, explanations, and aggregate triage summary counts.
  - Strictly read-only and non-mutating: does not advance ticks or alter civilian health.
- **Interactive Rescue Priority Queue Frontend (`RescuePriorityQueue`)**:
  - Live triage metrics ribbon (Total, Unrescued, Critical, High, Medium, Low, Trapped, Rescued).
  - Priority cards with status badges, urgency icons, visual health meters (green/amber/red), score badges, and expandable score breakdowns.
  - Click-to-highlight: clicking any civilian in the queue highlights their exact location on the 2D City Grid with a dedicated marker (`👤`).

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
│   │   │       │   └── simulation.py        # Lifecycle, Route & Priority endpoints
│   │   │       └── router.py
│   │   ├── core/
│   │   │   └── config.py                    # App configuration & settings
│   │   ├── schemas/
│   │   │   ├── environment.py               # CityGrid, GridCell, TerrainType, HazardState, Civilian
│   │   │   ├── prioritization.py            # TriageItem, TriageSummary, PrioritiesResponse, ScoreBreakdown
│   │   │   ├── route.py                     # RouteRequest, RouteResponse, MovementProfile
│   │   │   └── simulation.py                # SimulationState, TickResult, ScenarioInfo
│   │   ├── services/
│   │   │   ├── simulation_service.py        # Service orchestrator
│   │   │   └── simulation/
│   │   │       ├── civilian_model.py        # Civilian physiological deterioration & urgency escalation
│   │   │       ├── earthquake_model.py      # Seismic collapse & aftershocks
│   │   │       ├── engine.py                # SimulationEngine lifecycle manager
│   │   │       ├── flood_model.py           # Fluid diffusion & runoff model
│   │   │       ├── grid_generator.py        # Procedural synthetic city builder
│   │   │       ├── pathfinding.py           # A* Pathfinding engine & heuristic
│   │   │       ├── prioritization.py        # Multi-factor rescue prioritizer & triage service
│   │   │       └── scenarios.py             # Built-in scenario templates
│   │   └── main.py
│   └── tests/
│       ├── conftest.py                      # Engine state reset fixture
│       ├── test_civilian_deterioration.py   # Health decay & threshold unit tests
│       ├── test_config.py
│       ├── test_earthquake_model.py
│       ├── test_flood_model.py
│       ├── test_grid_generator.py
│       ├── test_health.py
│       ├── test_info.py
│       ├── test_pathfinding.py              # A* algorithm unit tests
│       ├── test_priorities_api.py           # Priorities API integration tests
│       ├── test_prioritization.py           # Multi-factor triage scoring unit tests
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
│   │   ├── CityGridView.tsx                 # 2D Grid, Path Overlay & Civilian Marker
│   │   ├── ConfigCard.tsx
│   │   ├── ConnectionBanner.tsx
│   │   ├── Header.tsx
│   │   ├── ProjectStatusCard.tsx
│   │   ├── RescuePriorityQueue.tsx          # Phase 4 Rescue Priority Queue & Triage Summary
│   │   ├── RoutePlanner.tsx                 # Phase 3 A* Route Planner Controls
│   │   ├── SimulationControls.tsx
│   │   └── SimulationStateCard.tsx
│   ├── lib/
│   │   └── api.ts                           # Typed HTTP client with getRescuePriorities()
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
*(All 82 tests pass with 100% success across rescue prioritization, tie-breaking, health deterioration, A* pathfinding, dynamic replanning, simulation lifecycle, and environment models).*

### Frontend Verification
From `frontend/`:
```powershell
npm run lint
npm run build
```
*(Zero ESLint warnings or errors; production build compiles cleanly).*

---

## 6. Practical PowerShell Testing Examples

### 1. Initialize Scenario and Inspect Triage Priorities
```powershell
# Start scenario
$body = @{ scenario_id = "flooded_neighborhood"; seed = 101 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/start -Method Post -Body $body -ContentType "application/json"

# Request rescue priority queue
$priorities = Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/priorities -Method Get
Write-Host "Unrescued Civilians: $($priorities.summary.active_unrescued) | Critical: $($priorities.summary.critical_count)"

# Display top-ranked civilian
$top = $priorities.queue[0]
Write-Host "Rank #1: $($top.civilian_id) | Urgency: $($top.urgency) | Score: $($top.priority_score) | Health: $($top.health)%"
Write-Host "Rationale: $($top.explanation)"
```

### 2. Observe Health Deterioration and Triage Escalation Over Ticks
```powershell
# Advance simulation by 3 ticks
1..3 | ForEach-Object {
    Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/tick -Method Post | Out-Null
}

# Request updated priorities: health declines and urgencies escalate
$updated = Invoke-RestMethod -Uri http://localhost:8000/api/v1/simulation/priorities -Method Get
$topUpdated = $updated.queue[0]
Write-Host "After 3 Ticks - Rank #1: $($topUpdated.civilian_id) | Score: $($topUpdated.priority_score) | Health: $($topUpdated.health)%"
```

---

## 7. Educational Simulation Disclaimer

> [!NOTE]
> The RESQ-AI triage engine is an educational simulation heuristic for disaster response modeling and multi-agent AI research. It is **not** a validated clinical triage system (such as START or SALT) and does not represent real-world medical certainty or diagnoses.

---

## 8. Planned Future Phases
- **Phase 5**: Heterogeneous Rescue Agents (Ambulances, Boats, Drones) & Autonomous Path Execution.
- **Phase 6**: AI Dispatch & Multi-Agent Task Allocation (Auction-based / Centralized dispatch to top triage targets).
- **Phase 7**: Shelters, Depots & Resource Logistics (Fuel, Medical Kits, Triage Capacity).
- **Phase 8**: Real-time Analytics, Simulation Replay Controller, and Survival Metrics.
