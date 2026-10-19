"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { ProjectStatusCard } from "@/components/ProjectStatusCard";
import { SimulationStateCard } from "@/components/SimulationStateCard";
import { ConfigCard } from "@/components/ConfigCard";
import {
  API_BASE_URL,
  getAppInfo,
  getDefaultConfig,
  getHealth,
  getSimulationState,
} from "@/lib/api";
import {
  AppInfoResponse,
  HealthResponse,
  SimulationConfig,
  SimulationState,
} from "@/types/api";

export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfoResponse | null>(null);
  const [config, setConfig] = useState<SimulationConfig | null>(null);
  const [simulationState, setSimulationState] =
    useState<SimulationState | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const healthData = await getHealth();
      setHealth(healthData);

      const [infoData, configData, stateData] = await Promise.all([
        getAppInfo(),
        getDefaultConfig(),
        getSimulationState(),
      ]);

      setAppInfo(infoData);
      setConfig(configData);
      setSimulationState(stateData);
      setLastChecked(new Date());
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to establish communication with RESQ-AI backend.";
      setError(msg);
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const healthData = await getHealth();
        if (ignore) return;
        setHealth(healthData);

        const [infoData, configData, stateData] = await Promise.all([
          getAppInfo(),
          getDefaultConfig(),
          getSimulationState(),
        ]);
        if (ignore) return;

        setAppInfo(infoData);
        setConfig(configData);
        setSimulationState(stateData);
        setLastChecked(new Date());
      } catch (err: unknown) {
        if (ignore) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to establish communication with RESQ-AI backend.";
        setError(msg);
        setHealth(null);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void init();

    return () => {
      ignore = true;
    };
  }, []);

  const isConnected = !!health && !error;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation & Telemetry Header */}
      <Header
        appName={appInfo?.name || "RESQ-AI"}
        phase={appInfo?.phase || "Phase 1: Project Foundation & Architecture"}
        isConnected={isConnected}
        isLoading={isLoading}
        onRetry={loadData}
      />

      {/* Main Mission Control Console */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Connection & Alert Banner */}
        <ConnectionBanner
          health={health}
          error={error}
          apiUrl={API_BASE_URL}
          onRetry={loadData}
          isLoading={isLoading}
        />

        {/* Phase 1 Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectStatusCard info={appInfo} isLoading={isLoading} />
          <SimulationStateCard state={simulationState} isLoading={isLoading} />
          <ConfigCard config={config} isLoading={isLoading} />
        </div>

        {/* Tactical Architecture & Contract Inspector */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Phase 1 Foundation Architecture &amp; Data Pipeline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified end-to-end communication between Next.js client and FastAPI server.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span>REST JSON Protocol</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">HEALTH ENDPOINT</div>
              <div className="text-emerald-400 font-semibold mt-1">
                GET /api/health
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Status check &amp; ping</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">INFO CONTRACT</div>
              <div className="text-blue-400 font-semibold mt-1">
                GET /api/v1/info
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Application metadata</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">CONFIG CONTRACT</div>
              <div className="text-purple-400 font-semibold mt-1">
                GET /api/v1/config
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Default 20x20 parameters</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">STATE CONTRACT</div>
              <div className="text-amber-400 font-semibold mt-1">
                GET /api/v1/simulation/state
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Initial standby state</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            RESQ-AI © 2026 — Disaster Response Simulator. Phase 1 Foundation.
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>API: {API_BASE_URL}</span>
            {lastChecked && (
              <span>Synced: {lastChecked.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
