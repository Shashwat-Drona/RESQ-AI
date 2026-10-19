/**
 * RESQ-AI Backend API Client.
 *
 * Communicates with the FastAPI server over HTTP/REST.
 */

import {
  AppInfoResponse,
  HealthResponse,
  SimulationConfig,
  SimulationState,
} from "@/types/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

class ApiClientError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      // Ensure we don't cache stale state
      cache: "no-store",
    });

    if (!res.ok) {
      let errorDetails: unknown = null;
      try {
        errorDetails = await res.json();
      } catch {
        errorDetails = await res.text();
      }

      throw new ApiClientError(
        `API request failed: ${res.status} ${res.statusText} at ${endpoint}`,
        res.status,
        errorDetails
      );
    }

    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    // Handle network / CORS connection failures
    const message =
      error instanceof Error ? error.message : "Unknown network connection failure";
    throw new ApiClientError(
      `Cannot connect to backend server at ${API_BASE_URL}. Ensure the FastAPI service is running. (${message})`
    );
  }
}

/**
 * Fetch backend health status.
 */
export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

/**
 * Fetch application info and phase metadata.
 */
export async function getAppInfo(): Promise<AppInfoResponse> {
  return request<AppInfoResponse>("/api/v1/info");
}

/**
 * Fetch default simulation configuration parameters.
 */
export async function getDefaultConfig(): Promise<SimulationConfig> {
  return request<SimulationConfig>("/api/v1/config");
}

/**
 * Fetch initial simulation state.
 */
export async function getSimulationState(): Promise<SimulationState> {
  return request<SimulationState>("/api/v1/simulation/state");
}

/**
 * Validate candidate simulation configuration.
 */
export async function validateConfig(
  config: SimulationConfig
): Promise<SimulationConfig> {
  return request<SimulationConfig>("/api/v1/config/validate", {
    method: "POST",
    body: JSON.stringify(config),
  });
}
