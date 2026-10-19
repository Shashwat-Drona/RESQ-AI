# RESQ-AI: AI-Powered Disaster Response & Rescue Simulator

> **College AI Project — Phase 5: Multi-Agent Rescue Coordination & Autonomous Dispatch**

RESQ-AI is an autonomous disaster response simulator modeling emergency operations (floods, earthquakes) across an urban grid. The system incorporates AI-driven rescue agents, dynamic road obstructions, civilian triage, shelter allocation, and resource logistics.

This repository is developed incrementally across 8 phases. **Phase 5** implements **Heterogeneous Rescue Agents, Autonomous Dispatch, Path Navigation via A*, and Complete Civilian Evacuation to Shelters**.

---

## 1. Phase 5 Scope & Capabilities

- **Heterogeneous Rescue Agents (`RescueAgent`, `AgentType`)**:
  - **Ground Responder (`ground_responder`)**: Emergency vehicle stationed at shelters operating on roads and open ground. Highly efficient on clear roadways, avoids deep floodwaters ($\ge 1.5$m) and heavy debris.
  - **Foot Responder (`foot_responder`)**: Search and rescue foot crew stationed at shelters capable of wading through shallow floodwaters ($< 1.0$m) to reach isolated residential sectors.
  - Movement semantics: 1 grid step per simulation tick, respecting exact terrain and hazard passability rules from `AStarPathfinder`.
- **Deterministic Autonomous Dispatch Service (`RescueCoordinator`)**:
  - Automatically queries the active civilian triage queue from `RescuePrioritizer` on every tick.
  - Evaluates candidate available agents (`status == IDLE`).
  - Assesses route feasibility and path cost using `AStarPathfinder.plan_route(...)`.
  - Unreachable high-priority targets do **not** block reachable lower-priority victims; the dispatcher defers unreachable candidates and continues down the queue.
  - Deterministic tie-breaking: minimum route travel cost, path length, and stable agent ID ascending.
  - Excludes already assigned, in-transit, or rescued civilians from duplicate mission dispatch.
- **Full Mission Lifecycle & Evacuation Loop (`RescueMission`, `MissionStatus`)**:
  - `ASSIGNED` $\to$ `EN_ROUTE` $\to$ `RESCUING` $\to$ `TRANSPORTING` $\to$ `COMPLETED` (or `FAILED` / `CANCELLED`).
  - Arrival at civilian: civilian transitioned to `IN_TRANSIT` aboard the responder; responder transitioned to `TRANSPORTING`.
  - In-transit and rescued civilians are protected from ground hazard environmental decay and do not accumulate waiting ticks.
  - Destination shelter: determined by finding the closest reachable shelter with available capacity (`current_occupancy < capacity`).
  - Arrival at shelter: civilian status becomes `RESCUED`, shelter `current_occupancy += 1`, simulation `rescued_count += 1`, and agent `completed_rescues += 1`.
  - Agent returns to `IDLE` state at the shelter, ready for subsequent mission assignments.
- **Collision Resolution & Dynamic Obstacle Replanning**:
  - Deterministic right-of-way resolution: if multiple agents intend to enter the same non-shelter cell on the same tick, the agent with lower lexicographical ID proceeds while the other yields and waits 1 tick.
  - Dynamic replanning: if advancing floodwater or seismic debris blocks the planned route ahead, the agent initiates an immediate A* replan. If an alternative route exists, the agent reroutes; if completely blocked, mission safely fails and target is released.
- **Simulation Lifecyle & Consistency**:
  - Strict tick order: Disasters Step $\to$ Civilians Deteriorate $\to$ Active Agents Advance / Evacuate $\to$ Idle Agents Dispatch $\to$ State Synchronized.
  - Non-mutating GET endpoints: `/simulation/agents`, `/simulation/missions`, `/simulation/events` never advance ticks.
  - Reset restores a clean initial fleet stationed at shelters with 0 missions and 0 completed rescues.
- **Interactive Command Center Dashboard**:
  - **City Grid View (`CityGridView`)**: Real-time rendering of vehicle responders (`🚑`), foot crews (`🏃`), civilian health states (`👤`, `🩹`, `⚠️`), carrying states (`+👤`), status halos, and active agent path waypoints (`◦`).
  - **Rescue Fleet Panel (`RescueAgentPanel`)**: Live telemetry of unit type, coordinates, operational status, target civilian, patient aboard, and completed rescue counts.
  - **Mission Dispatch Console (`MissionControlPanel`)**: Fleet statistics ribbon, active mission progress, filterable mission registry, destination waypoints, and operational explanations.

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
│   │   │       │   └── simulation.py        # Agents, Missions, Events & Lifecycle
│   │   │       └── router.py
│   │   ├── core/
│   │   │   └── config.py                    # Version 0.5.0 & Phase 5 configuration
│   │   ├── schemas/
│   │   │   ├── agent.py                     # RescueAgent, RescueMission, DispatchSummary
│   │   │   ├── environment.py               # CityGrid, GridCell, CivilianStatus (IN_TRANSIT)
│   │   │   ├── prioritization.py            # TriageItem, TriageSummary, PrioritiesResponse
│   │   │   ├── route.py                     # RouteRequest, RouteResponse, MovementProfile
│   │   │   └── simulation.py                # SimulationState, TickResult, ScenarioInfo
│   │   ├── services/
│   │   │   ├── simulation_service.py        # Service orchestrator
│   │   │   └── simulation/
│   │   │       ├── civilian_model.py        # Deterioration model (protects IN_TRANSIT)
│   │   │       ├── dispatcher.py            # Phase 5 Autonomous RescueCoordinator
│   │   │       ├── earthquake_model.py      # Seismic collapse & aftershocks
│   │   │       ├── engine.py                # SimulationEngine with fleet coordination
│   │   │       ├── flood_model.py           # Fluid diffusion & runoff model
│   │   │       ├── grid_generator.py        # Procedural synthetic city builder
│   │   │       ├── pathfinding.py           # A* Pathfinding engine & heuristic
│   │   │       ├── prioritization.py        # Multi-factor rescue prioritizer
│   │   │       └── scenarios.py             # Built-in scenario templates
│   │   └── main.py
│   └── tests/
│       ├── conftest.py
│       ├── test_agents.py                   # Agent schemas & fleet generation tests
│       ├── test_agents_api.py               # End-to-end API integration tests
│       ├── test_civilian_deterioration.py
│       ├── test_config.py
│       ├── test_dispatcher.py               # Autonomous movement, evacuation & replanning
│       ├── test_earthquake_model.py
│       ├── test_flood_model.py
│       ├── test_grid_generator.py
│       ├── test_health.py
│       ├── test_info.py
│       ├── test_pathfinding.py
│       ├── test_priorities_api.py
│       ├── test_prioritization.py
│       ├── test_route_api.py
│       ├── test_schemas.py
│       ├── test_simulation.py
│       ├── test_simulation_api.py
│       └── test_simulation_engine.py        # Multi-tick determinism & pause/reset tests
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx                         # Mission Control Dashboard
│   ├── components/
│   │   ├── CityGridView.tsx                 # 2D Grid with Agents, Civilians, & Routes
│   │   ├── ConfigCard.tsx
│   │   ├── ConnectionBanner.tsx
│   │   ├── Header.tsx
│   │   ├── MissionControlPanel.tsx          # Phase 5 Mission Dispatch & Evacuation Control
│   │   ├── ProjectStatusCard.tsx
│   │   ├── RescueAgentPanel.tsx             # Phase 5 Autonomous Fleet Telemetry
│   │   ├── RescuePriorityQueue.tsx          # Phase 4 Rescue Priority Queue & Triage
│   │   ├── RoutePlanner.tsx                 # Phase 3 A* Route Planner Controls
│   │   ├── SimulationControls.tsx
│   │   └── SimulationStateCard.tsx
│   ├── lib/
│   │   └── api.ts                           # Typed HTTP client with Agents & Missions APIs
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
*(All 99 tests pass with 100% success across agent schemas, autonomous dispatch, path execution, civilian extraction, shelter evacuation, collision avoidance, dynamic replanning, and simulation determinism).*

### Frontend Verification
From `frontend/`:
```powershell
npm run lint
npm run build
```
*(Zero ESLint warnings or errors; production build compiles cleanly).*

---

## 6. Verified PowerShell CLI Walkthrough Examples

The following live sequence has been verified against the running backend:

### 1. Start a Scenario
```powershell
$payload = @{ scenario_id = "earthquake_district"; seed = 202; grid_rows = 15; grid_cols = 15; num_civilians = 6; max_agents = 4 } | ConvertTo-Json
$state = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/start" -Method Post -ContentType "application/json" -Body $payload
Write-Host "Started scenario:" $state.scenario_id "Status:" $state.status
```

### 2. List Deployed Agents and Missions
```powershell
$agents = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/agents"
$missions = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/missions"
Write-Host "Fleet deployed:" $agents.summary.total_agents "Available:" $agents.summary.available_agents
```

### 3. View Civilian Triage Priorities
```powershell
$priorities = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/priorities"
$priorities.queue | Select-Object -First 3 | Format-Table rank, civilian_id, urgency, health, priority_score
```

### 4. Advance Simulation Tick by Tick
```powershell
$tick1 = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/tick" -Method Post
Write-Host "Simulation Tick:" $tick1.current_tick
$tick1.events | Where-Object { $_ -match "Dispatch" }
```

### 5. Observe an Agent Moving Toward a Civilian
```powershell
$agentBefore = ((Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/agents").agents)[0]
Write-Host "Tick 1 Location: ($($agentBefore.coordinate.row), $($agentBefore.coordinate.col)) Remaining steps: $($agentBefore.active_path.Count)"

$tick2 = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/tick" -Method Post
$agentAfter = ((Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/agents").agents)[0]
Write-Host "Tick 2 Location: ($($agentAfter.coordinate.row), $($agentAfter.coordinate.col)) Remaining steps: $($agentAfter.active_path.Count)"
```

### 6. Follow a Rescue Mission Through Complete Evacuation
```powershell
for ($t = 3; $t -le 15; $t++) {
    $tick = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/tick" -Method Post
    $rescues = $tick.events | Where-Object { $_ -match "Rescue Complete" }
    if ($rescues) {
        Write-Host "Evacuation Achieved at Tick" $t ":"
        $rescues | ForEach-Object { Write-Host "  " $_ }
        break
    }
}
$missions = (Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/missions").missions
$missions | Select-Object id, agent_id, civilian_id, status, completed_at_tick, explanation | Format-Table
```

### 7. Inspect Event Logs
```powershell
$events = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/events"
$events.events | Select-Object -Last 10
```

### 8. Reset and Verify Clean Initial State
```powershell
$reset = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/reset" -Method Post
Write-Host "Reset tick:" $reset.current_tick "rescued_count:" $reset.rescued_count
$missionsAfter = (Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/missions").missions
Write-Host "Active/historical missions after reset:" $missionsAfter.Count
```

---

## 7. Educational Simulation Disclaimer

> [!NOTE]
> The RESQ-AI multi-agent dispatch and triage engine is an educational simulation heuristic for disaster response modeling and emergency management research. It does not represent real-world clinical protocols or operational emergency services dispatch policies.

---

## 8. Planned Future Phases
- **Phase 6**: Decentralized Task Allocation & Market-Based Auction Mechanisms.
- **Phase 7**: Shelters, Depots & Resource Logistics (Fuel, Medical Supplies, Battery/Kit replenishment).
- **Phase 8**: Real-time Analytics, Simulation Replay Controller, and Survival Metrics.
