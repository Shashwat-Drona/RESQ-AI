# RESQ-AI: AI-Powered Disaster Response & Rescue Simulator

> **College AI Project — Phase 1: Project Foundation & Architecture**

RESQ-AI is an autonomous disaster response simulator modeling emergency response scenarios (floods, earthquakes) across an urban grid. The system incorporates AI-driven rescue agents, dynamic road obstructions, civilian triage, shelter allocation, and resource logistics.

This repository is developed incrementally across 8 phases. **Phase 1** establishes the clean client-server architecture, API contracts, Pydantic domain models, automated test suites, and frontend operations dashboard.

---

## 1. Phase 1 Scope & Features

- **Decoupled Architecture**: Independent Next.js frontend and FastAPI backend.
- **Strict Data Contracts**: Validated Pydantic models for coordinates, disaster scenarios, simulation configurations, and operational state.
- **Foundation REST API**:
  - `GET /api/health`: System health and runtime status.
  - `GET /api/v1/info`: Application metadata and phase tracking.
  - `GET /api/v1/config`: Baseline simulation parameters.
  - `POST /api/v1/config/validate`: Bounds and validity validation.
  - `GET /api/v1/simulation/state`: Explicit `not_started` initial state.
- **Emergency Operations Frontend**: Dark navy mission control interface with live backend health telemetry, loading states, error boundaries, and connection retry capability.
- **Automated Backend Testing**: 100% passing Pytest suite for contracts and endpoints.
- **CORS & Environment Config**: Local origins whitelist and non-secret configuration templates.

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Dark Emergency Operations theme)
- **Linting**: ESLint (`eslint-config-next`)

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Server**: Uvicorn
- **Validation**: Pydantic v2 & Pydantic Settings
- **Testing**: Pytest & HTTPX (`fastapi.testclient.TestClient`)

### Persistence (Planned for Phase 2+)
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
│   │   │   ├── health.py
│   │   │   ├── info.py
│   │   │   └── simulation.py
│   │   ├── services/
│   │   │   └── simulation_service.py
│   │   └── main.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_config.py
│   │   ├── test_health.py
│   │   ├── test_info.py
│   │   ├── test_schemas.py
│   │   └── test_simulation.py
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ConfigCard.tsx
│   │   ├── ConnectionStatus.tsx
│   │   ├── Header.tsx
│   │   └── StateCard.tsx
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

## 4. Prerequisites

- **Python**: 3.11 or 3.12
- **Node.js**: v20+ with npm
- **PowerShell** (Windows) or Bash (macOS/Linux)

---

## 5. Getting Started (Windows PowerShell)

Open two separate PowerShell terminal windows.

### Terminal 1: Backend Setup & Execution

```powershell
# Navigate to the project root
cd c:\Users\Lenovo\Codes\RESQ-AI

# Create virtual environment (if not already created)
python -m venv backend\.venv

# Activate virtual environment
.\backend\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend\requirements.txt

# Create local environment file from example
Copy-Item backend\.env.example backend\.env

# Run FastAPI development server
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend will be available at:
- Root: `http://localhost:8000`
- Health check: `http://localhost:8000/api/health`
- Swagger UI docs: `http://localhost:8000/docs`

---

### Terminal 2: Frontend Setup & Execution

```powershell
# Navigate to the frontend directory
cd c:\Users\Lenovo\Codes\RESQ-AI\frontend

# Install dependencies (if not already installed)
npm install

# Create local environment file from example
Copy-Item .env.example .env.local

# Run Next.js development server
npm run dev
```
Frontend will be available at:
- `http://localhost:3000`

---

## 6. Running Tests

### Backend Test Suite
From the project root:
```powershell
.\backend\.venv\Scripts\pytest.exe backend/tests -v
```

### Frontend Build & Lint Verification
From `frontend/`:
```powershell
npm run lint
npm run build
```

---

## 7. Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `RESQ-AI` | Project name |
| `DEBUG` | `True` | Debug mode |
| `PORT` | `8000` | Port for Uvicorn |
| `CORS_ORIGINS` | `http://localhost:3000` | Permitted frontend origins |
| `DATABASE_URL` | `sqlite:///./resq_ai.db` | Planned SQLite database path |

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | FastAPI server base URL |

---

## 8. Known Limitations (Phase 1)
- The simulation engine is not running in Phase 1; `/api/v1/simulation/state` intentionally reports `status: "not_started"`.
- The interactive map grid, agent pathfinding animations, and disaster propagation will be added in Phase 2 through Phase 6.
- SQLite persistence tables are defined in architectural blueprints, ready for activation in Phase 2.

---

## 9. Planned Future Phases
- **Phase 2**: 2D Grid Environment, Flood/Earthquake Terrain Generation, Road Collapses.
- **Phase 3**: Civilian Distress Beacon Generation, Urgency Countdown, Triage Levels.
- **Phase 4**: Heterogeneous Rescue Agent Fleet (Boats, Drones, Ambulances).
- **Phase 5**: A* / Dynamic Navigation around Damaged Obstacles.
- **Phase 6**: Task Allocation & Heuristic Dispatch AI.
- **Phase 7**: Shelter Capacity Management & Medical Depot Restock.
- **Phase 8**: Real-time Analytics, Replay Controller, and Survival Metrics.
