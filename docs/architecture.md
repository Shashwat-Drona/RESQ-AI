# RESQ-AI Architecture Specification

## 1. System Overview

**RESQ-AI** is an AI-powered Disaster Response and Rescue Simulator designed to model urban disaster scenarios (such as floods and earthquakes) and coordinate multi-agent emergency response operations.

The system is developed through an incremental 8-phase lifecycle:
- **Phase 1: Project Foundation & Architecture (Current)**: Decoupled client-server setup, baseline data contracts, API definitions, testing pipeline, and initial state orchestration.
- **Phase 2: Disaster Grid & Environment Simulation**: Dynamic terrain generation, flood water propagation, seismic obstacle creation, and road blockages.
- **Phase 3: Civilian Incident Generation & Urgency Modeling**: Affected civilian clusters, severity triage, injury degradation timers, and evacuation requests.
- **Phase 4: Rescue Agents & Capability Matrix**: Drones, boats, ambulances, and heavy rescue units with speed, capacity, and terrain constraints.
- **Phase 5: Pathfinding & Route Navigation**: A*, Dijkstra, and dynamic rerouting around flooded/collapsed road segments.
- **Phase 6: Multi-Agent Rescue Coordination & AI Dispatch**: Centralized dispatch heuristic / decentralized auction mechanism for optimal task assignment.
- **Phase 7: Shelters, Depots & Resource Logistics**: Medical supplies, fuel limitations, triage shelters, and resource replenishment loops.
- **Phase 8: Comprehensive Telemetry, Replay & Evaluation**: Real-time visualization, analytics, simulation replay, and performance metrics (survival rate, response time).

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Frontend ["Next.js (App Router, TypeScript, Tailwind)"]
        UI["Operations Dashboard UI"]
        StateHook["Simulation & Health Hooks"]
        ApiClient["REST API Client (lib/api.ts)"]
    end

    subgraph Backend ["FastAPI Backend (Python 3.12)"]
        Router["FastAPI Application & Routers"]
        ConfigModule["Settings & CORS (core/config.py)"]
        SimService["Simulation Service (services/simulation_service.py)"]
        DataModels["Data Contracts & Validation (schemas/simulation.py)"]
        PersistenceSpec["Planned Persistence (models/persistence.py)"]
    end

    subgraph Storage ["Planned Persistence (Phase 2+)"]
        SQLite[("SQLite Database: resq_ai.db")]
    end

    UI --> StateHook
    StateHook --> ApiClient
    ApiClient -->|HTTP / JSON (CORS)| Router
    Router --> ConfigModule
    Router --> SimService
    SimService --> DataModels
    PersistenceSpec -.-> SQLite
```

---

## 3. Component Responsibilities

### 3.1 Frontend (`/frontend`)
The frontend serves as the tactical incident control center:
- **Rendering**: Clean, restrained emergency-operations dashboard inspired by modern dispatch interfaces (dark navy surfaces, high-contrast indicators, responsive grid).
- **Communication Layer (`lib/api.ts`)**: Strongly typed client that talks to FastAPI via configurable `NEXT_PUBLIC_API_BASE_URL`.
- **Fault-Tolerant UX**: Real-time status reporting, network error handling, connection retry triggers, and clean loading state transitions.
- **Separation of Concerns**: UI components remain pure and decoupled from low-level fetch mechanics.

### 3.2 Backend (`/backend`)
The backend provides deterministic simulation services, contracts, and future execution loops:
- **`app/core/config.py`**: Centralized configuration management using `pydantic-settings`. Loads environment variables from `.env` with strict defaults.
- **`app/schemas/`**: Pydantic v2 schemas defining simulation invariants:
  - `Coordinate`: Positive zero-indexed (row, col) coordinates.
  - `DisasterType`: `flood` and `earthquake` scenarios.
  - `SimulationStatus`: `not_started`, `running`, `paused`, `completed`.
  - `SimulationConfig`: Grid dimensions (min 5x5, max 100x100), agent limits, and tick interval.
  - `SimulationState`: Telemetry packet describing the world state.
- **`app/services/simulation_service.py`**: Business logic encapsulation separating routing from state calculation.
- **`app/api/`**: Modular route handlers with validated responses, CORS headers, and structured error responses.

---

## 4. Planned Data Persistence Strategy (Phase 2+)

In Phase 1, data persistence is defined in architectural specification (`app/models/persistence.py`), deliberately omitting unnecessary database overhead until dynamic sessions are introduced.

For Phase 2+, SQLite will store:
1. **`simulation_runs`**: Session metadata, chosen disaster type, seed, grid size, run duration, and total rescued count.
2. **`simulation_ticks`**: Time-series telemetry of each tick, enabling forward/backward replay and timeline analysis.
3. **`incidents` & `shelters`**: Evacuation shelter capacities and casualty triage progress.

---

## 5. Security & Network Considerations
- **CORS Protection**: The backend enforces explicit origin matching (`http://localhost:3000`), configurable via `CORS_ORIGINS`.
- **Validation Security**: Malformed grid dimensions or negative intervals are rejected at the Pydantic layer before reaching service logic.
- **Zero Secrets**: No third-party API keys or external services are needed.
