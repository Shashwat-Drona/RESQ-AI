/**
 * Type definitions matching RESQ-AI FastAPI backend contracts for Phase 2.
 */

export type DisasterType = "flood" | "earthquake";

export type SimulationStatus =
  | "not_started"
  | "running"
  | "paused"
  | "completed";

export type TerrainType = "road" | "building" | "open_ground" | "shelter";

export type HazardState = "safe" | "flooded" | "debris_blocked" | "dangerous";

export type CivilianStatus = "waiting" | "injured" | "trapped" | "rescued";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export interface Coordinate {
  row: number;
  col: number;
}

export interface GridCell {
  coordinate: Coordinate;
  terrain: TerrainType;
  hazard: HazardState;
  water_level: number;
  debris_severity: number;
  traversable: boolean;
  elevation: number;
}

export interface Civilian {
  id: string;
  coordinate: Coordinate;
  status: CivilianStatus;
  urgency: UrgencyLevel;
  health: number;
  metadata?: Record<string, unknown>;
}

export interface Shelter {
  id: string;
  name: string;
  coordinate: Coordinate;
  capacity: number;
  current_occupancy: number;
}

export interface CityGrid {
  rows: number;
  cols: number;
  cells: GridCell[][];
}

export interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  disaster_type: DisasterType;
  default_seed: number;
  recommended_rows: number;
  recommended_cols: number;
  civilian_count: number;
}

export interface StartSimulationRequest {
  scenario_id?: string;
  disaster_type?: DisasterType;
  seed?: number;
  grid_rows?: number;
  grid_cols?: number;
  max_agents?: number;
  num_civilians?: number;
}

export interface TickResult {
  current_tick: number;
  status: SimulationStatus;
  events: string[];
  state: SimulationState;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  environment: string;
}

export interface AppInfoResponse {
  name: string;
  phase: string;
  version: string;
  description: string;
  supported_disasters: string[];
  docs_url: string;
}

export interface SimulationConfig {
  grid_rows: number;
  grid_cols: number;
  max_agents: number;
  disaster_type: DisasterType;
  tick_interval_seconds: number;
  seed?: number;
  scenario_id?: string;
}

export interface SimulationState {
  status: SimulationStatus;
  current_tick: number;
  config: SimulationConfig;
  active_incidents: number;
  active_agents: number;
  rescued_count: number;
  message: string;
  updated_at: string;
  grid?: CityGrid | null;
  civilians?: Civilian[];
  shelters?: Shelter[];
  scenario_id?: string | null;
  tick_events?: string[];
  metadata?: Record<string, unknown>;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}
