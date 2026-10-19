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

export type CivilianStatus = "waiting" | "injured" | "trapped" | "in_transit" | "rescued";

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
  agents?: RescueAgent[];
  missions?: RescueMission[];
  metadata?: Record<string, unknown>;
}

export type AgentType = "ground_responder" | "foot_responder";

export type AgentStatus =
  | "idle"
  | "en_route"
  | "rescuing"
  | "transporting"
  | "unavailable";

export type MissionStatus =
  | "assigned"
  | "en_route"
  | "rescuing"
  | "transporting"
  | "completed"
  | "failed"
  | "cancelled";

export interface RescueMission {
  id: string;
  agent_id: string;
  civilian_id: string;
  target_coordinate: Coordinate;
  shelter_id?: string | null;
  shelter_coordinate?: Coordinate | null;
  status: MissionStatus;
  route: Coordinate[];
  route_step_index: number;
  created_at_tick: number;
  completed_at_tick?: number | null;
  explanation: string;
}

export interface RescueAgent {
  id: string;
  name: string;
  type: AgentType;
  coordinate: Coordinate;
  status: AgentStatus;
  movement_profile: MovementProfile;
  current_mission_id?: string | null;
  target_civilian_id?: string | null;
  carrying_civilian_id?: string | null;
  completed_rescues: number;
  speed_cells_per_tick: number;
  active_path: Coordinate[];
  metadata?: Record<string, unknown>;
}

export interface DispatchSummary {
  total_agents: number;
  available_agents: number;
  active_missions: number;
  completed_evacuations: number;
  failed_missions: number;
}

export interface AgentsResponse {
  current_tick: number;
  agents: RescueAgent[];
  summary: DispatchSummary;
}

export interface MissionsResponse {
  current_tick: number;
  missions: RescueMission[];
  summary: DispatchSummary;
}

export interface EventsResponse {
  current_tick: number;
  events: string[];
}

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

