"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { ProjectStatusCard } from "@/components/ProjectStatusCard";
import { SimulationStateCard } from "@/components/SimulationStateCard";
import { ConfigCard } from "@/components/ConfigCard";
import { SimulationControls } from "@/components/SimulationControls";
import { CityGridView } from "@/components/CityGridView";
import { RoutePlanner } from "@/components/RoutePlanner";
import { RescuePriorityQueue } from "@/components/RescuePriorityQueue";
import {
  API_BASE_URL,
  getAppInfo,
  getDefaultConfig,
  getHealth,
  getRescuePriorities,
  getScenarios,
  getSimulationState,
} from "@/lib/api";
import {
  AppInfoResponse,
  Coordinate,
  HealthResponse,
  PrioritiesResponse,
  RouteResponse,
  ScenarioInfo,
  SimulationConfig,
  SimulationState,
} from "@/types/api";

export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfoResponse | null>(null);
  const [config, setConfig] = useState<SimulationConfig | null>(null);
  const [simulationState, setSimulationState] =
    useState<SimulationState | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);

  // Phase 3 Route Planning State
  const [currentRoute, setCurrentRoute] = useState<RouteResponse | null>(null);
  const [startCoord, setStartCoord] = useState<Coordinate>({ row: 0, col: 0 });
  const [goalCoord, setGoalCoord] = useState<Coordinate>({ row: 19, col: 19 });

  // Phase 4 Rescue Prioritization State
  const [priorities, setPriorities] = useState<PrioritiesResponse | null>(null);
  const [selectedCivilianCoord, setSelectedCivilianCoord] =
    useState<Coordinate | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const refreshPriorities = useCallback(async () => {
    try {
      const data = await getRescuePriorities();
      setPriorities(data);
    } catch {
      setPriorities(null);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const healthData = await getHealth();
      setHealth(healthData);

      const [infoData, configData, stateData, scenariosData] = await Promise.all([
        getAppInfo(),
        getDefaultConfig(),
        getSimulationState(),
        getScenarios().catch(() => []),
      ]);

      setAppInfo(infoData);
      setConfig(configData);
      setSimulationState(stateData);
      setScenarios(scenariosData);
      setLastChecked(new Date());
      void refreshPriorities();
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
  }, [refreshPriorities]);

  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const healthData = await getHealth();
        if (ignore) return;
        setHealth(healthData);

        const [infoData, configData, stateData, scenariosData] = await Promise.all([
          getAppInfo(),
          getDefaultConfig(),
          getSimulationState(),
          getScenarios().catch(() => []),
        ]);
        if (ignore) return;

        setAppInfo(infoData);
        setConfig(configData);
        setSimulationState(stateData);
        setScenarios(scenariosData);
        setLastChecked(new Date());
        void refreshPriorities();
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
  }, [refreshPriorities]);

  const isConnected = !!health && !error;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation & Telemetry Header */}
      <Header
        appName={appInfo?.name || "RESQ-AI"}
        phase={appInfo?.phase || "Phase 4: Intelligent Rescue Prioritization & Civilian Triage"}
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

        {/* Phase 2 Simulation Lifecycle Controls */}
        <SimulationControls
          scenarios={scenarios}
          simulationState={simulationState}
          onStateUpdate={(st) => {
            setSimulationState(st);
            setLastChecked(new Date());
            void refreshPriorities();
          }}
          isLoading={isLoading}
        />

        {/* Phase 3 Live 2D Grid & Route Visualizer */}
        <CityGridView
          grid={simulationState?.grid}
          route={currentRoute}
          startCoord={startCoord}
          goalCoord={goalCoord}
          highlightCoord={selectedCivilianCoord}
          onSetStart={(coord) => setStartCoord(coord)}
          onSetGoal={(coord) => setGoalCoord(coord)}
        />

        {/* Phase 4 Intelligent Rescue Priority Queue & Triage */}
        <RescuePriorityQueue
          priorities={priorities}
          isLoading={isLoading}
          selectedCivilianCoord={selectedCivilianCoord}
          onSelectCivilian={(coord) => setSelectedCivilianCoord(coord)}
          isSimulationActive={!!simulationState?.grid}
        />

        {/* Phase 3 A* Route Planner Controls */}
        <RoutePlanner
          gridRows={simulationState?.grid?.rows ?? 20}
          gridCols={simulationState?.grid?.cols ?? 20}
          startCoord={startCoord}
          goalCoord={goalCoord}
          onSetStart={(coord) => setStartCoord(coord)}
          onSetGoal={(coord) => setGoalCoord(coord)}
          onRouteCalculated={(route) => setCurrentRoute(route)}
          currentRoute={currentRoute}
          isSimulationActive={!!simulationState?.grid}
        />

        {/* Dashboard Telemetry Grid */}
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
                Phase 4 Rescue Prioritization &amp; Simulation Engine Pipeline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-factor deterministic triage scoring, dynamic physiological deterioration, 4-directional A* routing, and lifecycle controls.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span>REST JSON Protocol</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">SCENARIOS CATALOG</div>
              <div className="text-cyan-400 font-semibold mt-1">
                GET /api/v1/simulation/scenarios
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Built-in templates</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">SCENARIO INIT</div>
              <div className="text-emerald-400 font-semibold mt-1">
                POST /api/v1/simulation/start
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Seeded environment</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">TICK DISPATCHER</div>
              <div className="text-blue-400 font-semibold mt-1">
                POST /api/v1/simulation/tick
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Step disaster (+1)</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">A* ROUTE PLANNER</div>
              <div className="text-purple-400 font-semibold mt-1">
                POST /api/v1/simulation/route
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Dynamic heuristic path</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">RESCUE PRIORITIES</div>
              <div className="text-rose-400 font-semibold mt-1">
                GET /api/v1/simulation/priorities
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Ranked triage queue</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">STATE TELEMETRY</div>
              <div className="text-amber-400 font-semibold mt-1">
                GET /api/v1/simulation/state
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Grid, civs, shelters</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            RESQ-AI © 2026 — Disaster Response Simulator. Phase 4: Intelligent Rescue Prioritization &amp; Civilian Triage.
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
