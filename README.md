# RESQ-AI: AI-Powered Disaster Response & Rescue Simulator

> **College AI Project — Phase 7: Evaluation Against a Baseline Strategy**

RESQ-AI is an autonomous disaster response simulator modeling emergency operations (floods, earthquakes) across an urban grid. The system incorporates AI-driven rescue agents, dynamic road obstructions, civilian triage, shelter allocation, and resource logistics.

This repository is developed incrementally across 8 phases. **Phase 7** introduces an empirical, deterministic **Strategy Evaluation Engine** comparing the AI multi-factor triage rescue coordinator against a simple, naive baseline (greedy FIFO ordering by civilian ID) across identical disaster scenarios, initial states, and random seeds.

---

## 1. Phase 7 Architecture & Strategy Evaluation Engine

- **Heterogeneous Rescue Agents (`RescueAgent`, `AgentType`)**:
  - **Ground Responder (`ground_responder`)**: Emergency vehicle stationed at shelters operating on roads and open ground. Highly efficient on clear roadways, avoids deep floodwaters ($\ge 1.5$m) and heavy debris.
  - **Foot Responder (`foot_responder`)**: Search and rescue foot crew stationed at shelters capable of wading through shallow floodwaters ($< 1.0$m) to reach isolated residential sectors.
  - Movement semantics: 1 grid step per simulation tick, respecting exact terrain and hazard passability rules from `AStarPathfinder`.
- **Dual Dispatch Strategies (`DispatchStrategy`)**:
  - **AI Strategy (`AI_TRIAGE`)**: Prioritizes civilians using a multi-factor score (vulnerability, injury acuity, health deterioration velocity, environmental hazard exposure, and waiting time). Evaluates nearest available idle agent via A* pathfinding. Distant or trapped high-acuity victims are actively triaged before low-risk victims.
  - **Baseline Strategy (`BASELINE_FIFO`)**: A deliberately simple, naive benchmark. Selects the next eligible unrescued civilian using strict alphanumeric ordering by civilian ID (`c.id`), and assigns the closest available idle agent who can reach them via standard A* pathfinding. Does **not** incorporate triage priority, health urgency, or hazard proximity into civilian selection.
  - **Fair Comparison Guarantee**: Both strategies share the identical simulation engine, city grid generation, flood diffusion, earthquake collapse rules, agent movement profiles, collision avoidance, and shelter capacity limits.
- **Empirical Simulation Evaluator (`SimulationEvaluator`)**:
  - Runs paired deterministic trials over identical seeds and scenarios (`earthquake_district`, `flash_flood_riverside`).
  - Executes completely isolated engine copies in background memory without mutating or advancing the user's active dashboard simulation.
  - Measures key emergency management dimensions:
    - **Civilians Rescued**: Total survivors successfully evacuated to safe shelters.
    - **Critical Civilians Rescued**: High-acuity victims saved before terminal health collapse.
    - **Average Rescue Ticks**: Mean simulation steps required per completed extraction.
    - **Mean Population Health**: Final percentage health across all surviving civilians.
    - **Blocked / Failed Missions**: Instances where dynamic hazards severed all viable paths.
    - **Rescue Velocity**: Percentage of available victims evacuated within the trial horizon.
- **Full Mission Lifecycle & Evacuation Loop (`RescueMission`, `MissionStatus`)**:
  - `ASSIGNED` $\to$ `EN_ROUTE` $\to$ `RESCUING` $\to$ `TRANSPORTING` $\to$ `COMPLETED` (or `FAILED` / `CANCELLED`).
  - Arrival at civilian: civilian transitioned to `IN_TRANSIT` aboard the responder; responder transitioned to `TRANSPORTING`.
  - In-transit and rescued civilians are protected from ground hazard environmental decay and do not accumulate waiting ticks.
  - Destination shelter: determined by finding the closest reachable shelter with available capacity (`current_occupancy < capacity`).
  - Arrival at shelter: civilian status becomes `RESCUED`, shelter `current_occupancy += 1`, simulation `rescued_count += 1`, and agent `completed_rescues += 1`.
  - Agent returns to `IDLE` state at the shelter, ready for subsequent mission assignments.
- **Disaster Command Center Dashboard & Evaluation Panel**:
  - **Evaluation Suite (`StrategyEvaluationPanel`)**: Section 09 in the dashboard. Allows running 1 to 5 trials on demand across any scenario. Renders side-by-side KPI cards with net delta badges, a strategy definition breakdown, an automated analytical conclusion box, a multi-dimensional metric comparison matrix, and per-trial execution breakdowns.
  - **Interactive City Map & Tactical Cell Inspector (`CityGridView`)**: Tactical 2D matrix rendering roads, buildings, open terrain, shelters (`⌂`), shallow/deep water, seismic debris, civilian status (`👤`, `🩹`, `⚠️`), ground vehicles (`🚑`), foot responders (`🏃`), patient aboard badges (`+👤`), status halos, active waypoints (`◦`), and an integrated side Inspector.
  - **Autonomous Fleet Telemetry & Mission Control**: Live responder telemetry, filterable missions (`All`, `Active`, `Rescued`, `Blocked`), click-to-inspect tracking, and dynamic replanning.
  - **Civilian Triage Queue & Event Timeline**: Real-time triage queue with urgency indicators, multi-criteria sorting, search, and a reverse-chronological event timeline.

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
│   │   │       │   └── simulation.py        # Lifecycle, Agents, Missions, Events & Evaluation
│   │   │       └── router.py
│   │   ├── core/
│   │   │   └── config.py                    # Version 0.7.0 & Phase 7 configuration
│   │   ├── schemas/
│   │   │   ├── agent.py                     # RescueAgent, RescueMission, DispatchSummary
│   │   │   ├── environment.py               # CityGrid, GridCell, CivilianStatus (IN_TRANSIT)
│   │   │   ├── evaluation.py                # DispatchStrategy, StrategyMetrics, EvaluationResponse
│   │   │   ├── prioritization.py            # TriageItem, TriageSummary, PrioritiesResponse
│   │   │   ├── route.py                     # RouteRequest, RouteResponse, MovementProfile
│   │   │   └── simulation.py                # SimulationState, TickResult, ScenarioInfo
│   │   ├── services/
│   │   │   ├── simulation_service.py        # Service orchestrator (includes evaluate)
│   │   │   └── simulation/
│   │   │       ├── civilian_model.py        # Deterioration model (protects IN_TRANSIT)
│   │   │       ├── dispatcher.py            # AI Triage & Naive Baseline FIFO Dispatchers
│   │   │       ├── earthquake_model.py      # Seismic collapse & aftershocks
│   │   │       ├── engine.py                # SimulationEngine with fleet coordination
│   │   │       ├── evaluator.py             # Isolated deterministic Strategy Evaluator
│   │   │       ├── flood_model.py           # Fluid diffusion & shelter floodwall model
│   │   │       ├── grid_generator.py        # Procedural synthetic city builder
│   │   │       ├── pathfinding.py           # A* Pathfinding engine & heuristic
│   │   │       ├── prioritization.py        # Multi-factor rescue prioritizer
│   │   │       └── scenarios.py             # Built-in scenario templates
│   │   └── main.py
│   └── tests/
│       ├── conftest.py
│       ├── test_agents.py
│       ├── test_agents_api.py
│       ├── test_civilian_deterioration.py
│       ├── test_config.py
│       ├── test_dispatcher.py
│       ├── test_earthquake_model.py
│       ├── test_evaluation.py               # Baseline dispatch, metrics, determinism & isolation
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
│       └── test_simulation_engine.py
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx                         # Mission Control Dashboard with Evaluation Section
│   ├── components/
│   │   ├── CityGridView.tsx                 # 2D Grid with Agents, Civilians, & Routes
│   │   ├── ConfigCard.tsx
│   │   ├── ConnectionBanner.tsx
│   │   ├── Header.tsx
│   │   ├── MissionControlPanel.tsx          # Mission Dispatch & Evacuation Control
│   │   ├── ProjectStatusCard.tsx
│   │   ├── RescueAgentPanel.tsx             # Autonomous Fleet Telemetry
│   │   ├── RescuePriorityQueue.tsx          # Rescue Priority Queue & Triage Breakdown
│   │   ├── RoutePlanner.tsx                 # A* Route Planner Controls
│   │   ├── SimulationControls.tsx
│   │   ├── SimulationStateCard.tsx
│   │   └── StrategyEvaluationPanel.tsx      # Phase 7 AI vs Baseline Evaluation Suite
│   ├── lib/
│   │   └── api.ts                           # Typed HTTP client with Evaluation APIs
│   └── types/
│       └── api.ts                           # TypeScript evaluation schemas
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
*(All 105 tests pass with 100% success across baseline strategy, evaluation metrics, determinism, isolation, agent schemas, autonomous dispatch, path execution, civilian extraction, shelter evacuation, collision avoidance, dynamic replanning, and simulation engine).*

### Frontend Verification
From `frontend/`:
```powershell
npm run lint
npm run build
```
*(Zero ESLint warnings or errors; production build compiles cleanly with Next.js 16 App Router).*

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

### 7. Run AI vs Baseline Evaluation Benchmark (Phase 7)
```powershell
$evalPayload = @{
    scenario_id = "earthquake_district"
    trials = 3
    max_ticks = 40
    seed = 42
} | ConvertTo-Json

$evalResult = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/evaluate" -Method Post -ContentType "application/json" -Body $evalPayload
Write-Host "Evaluation Complete!"
Write-Host "Scenarios evaluated:" $evalResult.scenario_name "Trials:" $evalResult.trials
Write-Host "AI Rescued:" $evalResult.ai_strategy.avg_civilians_rescued "Baseline Rescued:" $evalResult.baseline_strategy.avg_civilians_rescued
Write-Host "AI Critical Rescued:" $evalResult.ai_strategy.avg_critical_rescued "Baseline Critical Rescued:" $evalResult.baseline_strategy.avg_critical_rescued
Write-Host "AI Avg Health:" $evalResult.ai_strategy.avg_population_health "% Baseline Avg Health:" $evalResult.baseline_strategy.avg_population_health "%"
Write-Host "Conclusion:" $evalResult.analytical_conclusion
```

### 8. Fetch Cached Latest Evaluation
```powershell
$latest = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/evaluate/latest"
Write-Host "Cached run completed at:" $latest.completed_at
```

### 9. Reset and Verify Active State Untouched by Evaluation
```powershell
$reset = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simulation/reset" -Method Post
Write-Host "Reset tick:" $reset.current_tick "rescued_count:" $reset.rescued_count
```

---

## 7. Educational Simulation Disclaimer

> [!NOTE]
> The RESQ-AI multi-agent dispatch and triage engine is an educational simulation heuristic for disaster response modeling and emergency management research. It does not represent real-world clinical protocols or operational emergency services dispatch policies.

---

## 8. Planned Future Phases
- **Phase 8**: Real-time Analytics, Simulation Replay Controller, and Survival Metrics.
