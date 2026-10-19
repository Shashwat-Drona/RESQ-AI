/**
 * Type definitions matching RESQ-AI FastAPI backend contracts.
 */

export type DisasterType = "flood" | "earthquake";

export type SimulationStatus =
  | "not_started"
  | "running"
  | "paused"
  | "completed";

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
  metadata?: Record<string, unknown>;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}
