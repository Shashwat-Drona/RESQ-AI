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

export type MovementProfile = "ground_responder" | "on_foot";

export interface Coordinate {
  row: number;
  col: number;
}

export interface RouteRequest {
  start: Coordinate;
  goal: Coordinate;
  movement_profile?: MovementProfile;
}

export interface RouteResponse {
  found: boolean;
  start: Coordinate;
  goal: Coordinate;
  path: Coordinate[];
  path_length: number;
  total_cost: number;
  expanded_nodes: number;
  movement_profile: MovementProfile;
  reason?: string | null;
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
  waiting_ticks?: number;
  metadata?: Record<string, unknown>;
}

export interface ScoreBreakdown {
  urgency_score: number;
  health_score: number;
  trapped_score: number;
  hazard_score: number;
  injured_score: number;
  waiting_score: number;
}

export interface TriageItem {
  rank: number;
  civilian_id: string;
  coordinate: Coordinate;
  status: CivilianStatus;
  urgency: UrgencyLevel;
  health: number;
  waiting_ticks: number;
  priority_score: number;
  hazard_state: HazardState;
  water_level: number;
  debris_severity: number;
  explanation: string;
  score_breakdown: ScoreBreakdown;
}

export interface TriageSummary {
  total_civilians: number;
  active_unrescued: number;
  rescued_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  trapped_count: number;
  injured_count: number;
}

export interface PrioritiesResponse {
  current_tick: number;
  queue: TriageItem[];
  summary: TriageSummary;
  is_heuristic: boolean;
  methodology: string;
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
