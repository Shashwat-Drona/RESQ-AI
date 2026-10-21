"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { AiArchitectureIntro } from "@/components/AiArchitectureIntro";
import { SituationOverview } from "@/components/SituationOverview";
import { ProjectStatusCard } from "@/components/ProjectStatusCard";
import { SimulationStateCard } from "@/components/SimulationStateCard";
import { ConfigCard } from "@/components/ConfigCard";
import { SimulationControls } from "@/components/SimulationControls";
import { CityGridView } from "@/components/CityGridView";
import { RoutePlanner } from "@/components/RoutePlanner";
import { RescuePriorityQueue } from "@/components/RescuePriorityQueue";
import { RescueAgentPanel } from "@/components/RescueAgentPanel";
import { MissionControlPanel } from "@/components/MissionControlPanel";
import { EventTimeline } from "@/components/EventTimeline";
import { StrategyEvaluationPanel } from "@/components/StrategyEvaluationPanel";
import {
  API_BASE_URL,
  getAppInfo,
  getDefaultConfig,
  getHealth,
  getLatestEvaluation,
  getRescueAgents,
  getRescueMissions,
  getRescuePriorities,
  getScenarios,
  getSimulationEvents,
  getSimulationState,
} from "@/lib/api";
import {
  AppInfoResponse,
  Coordinate,
  DispatchSummary,
  EvaluationResponse,
  HealthResponse,
  PrioritiesResponse,
  RescueAgent,
  RescueMission,
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
  const [selectedCivilianId, setSelectedCivilianId] = useState<string | null>(null);

  // Phase 5 Autonomous Fleet & Mission Dispatch State
  const [agents, setAgents] = useState<RescueAgent[]>([]);
  const [missions, setMissions] = useState<RescueMission[]>([]);
  const [dispatchSummary, setDispatchSummary] = useState<DispatchSummary | undefined>(undefined);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  // Phase 5 / 6 Event Timeline
  const [events, setEvents] = useState<string[]>([]);

  // Phase 7 Baseline Strategy Evaluation State
  const [latestEvaluation, setLatestEvaluation] = useState<EvaluationResponse | null>(null);

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

  const refreshFleetAndMissions = useCallback(async () => {
    try {
      const [agentsRes, missionsRes, eventsRes] = await Promise.all([
        getRescueAgents(),
        getRescueMissions(),
        getSimulationEvents().catch(() => ({ events: [], count: 0, current_tick: 0 })),
      ]);
      setAgents(agentsRes.agents);
      setMissions(missionsRes.missions);
      setDispatchSummary(agentsRes.summary);
      setEvents(eventsRes.events || []);
    } catch {
      setAgents([]);
      setMissions([]);
      setDispatchSummary(undefined);
      setEvents([]);
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
      void refreshFleetAndMissions();
      void getLatestEvaluation().then(setLatestEvaluation).catch(() => {});
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
  }, [refreshPriorities, refreshFleetAndMissions]);

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
        void refreshFleetAndMissions();
        void getLatestEvaluation().then(setLatestEvaluation).catch(() => {});
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
  }, [refreshPriorities, refreshFleetAndMissions]);

  const handleSelectCivilian = (coord: Coordinate, civilianId?: string) => {
    setSelectedCivilianCoord(coord);
    if (civilianId) {
      setSelectedCivilianId(civilianId);
    } else {
      // Find matching civilian from state if any
      const match = simulationState?.civilians?.find(
        (c) => c.coordinate.row === coord.row && c.coordinate.col === coord.col
      );
      setSelectedCivilianId(match?.id ?? null);
    }
  };

  const handleSelectMission = (mission: RescueMission) => {
    if (selectedMissionId === mission.id) {
      setSelectedMissionId(null);
    } else {
      setSelectedMissionId(mission.id);
      setSelectedAgentId(mission.agent_id);
      setSelectedCivilianCoord(mission.target_coordinate);
      setSelectedCivilianId(mission.civilian_id);
    }
  };

  // View / Navigation State
  type ActiveView = "operations" | "routing" | "evaluation" | "architecture" | "all";
  type OpsDrawerTab = "triage" | "fleet" | "missions" | "events";

  const [activeView, setActiveView] = useState<ActiveView>("operations");
  const [opsDrawerTab, setOpsDrawerTab] = useState<OpsDrawerTab>("triage");

  const isConnected = !!health && !error;
  const isSimulationActive = !!simulationState?.grid;

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation & Telemetry Header */}
      <Header
        appName={appInfo?.name || "RESQ-AI"}
        phase="Phase 8: Final Presentation & Benchmark Readiness"
        isConnected={isConnected}
        isLoading={isLoading}
        onRetry={loadData}
        simulationStatus={simulationState?.status}
        currentTick={simulationState?.current_tick}
        activeScenario={
          scenarios.find((s) => s.id === simulationState?.scenario_id)?.name ??
          simulationState?.scenario_id ??
          null
        }
      />

      {/* Main Mission Control Console */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Connection & Alert Banner */}
        <ConnectionBanner
          health={health}
          error={error}
          apiUrl={API_BASE_URL}
          onRetry={loadData}
          isLoading={isLoading}
        />

        {/* Top-Level Workspace Navigation Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-2.5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveView("operations")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeView === "operations"
                  ? "bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_16px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <span>🚨</span>
              <span>Live Operations</span>
              {isSimulationActive && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView("routing")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeView === "routing"
                  ? "bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_16px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <span>🧭</span>
              <span>A* Route Planner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("evaluation")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeView === "evaluation"
                  ? "bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_16px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <span>📊</span>
              <span>Strategy Evaluation</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60">
                AI vs Baseline
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("architecture")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeView === "architecture"
                  ? "bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_16px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <span>ℹ️</span>
              <span>Architecture &amp; Specs</span>
            </button>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setActiveView(activeView === "all" ? "operations" : "all")}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer ${
                activeView === "all"
                  ? "bg-cyan-950/80 text-cyan-300 border-cyan-600 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
              title="Toggle all sections on a single scrollable page"
            >
              {activeView === "all" ? "✕ Close All View" : "📜 Show All Sections"}
            </button>
          </div>
        </div>

        {/* VIEW 1: LIVE OPERATIONS (Default Streamlined Command Center) */}
        {(activeView === "operations" || activeView === "all") && (
          <div className="space-y-6">
            {/* Situation Overview KPI Ribbon */}
            <SituationOverview
              triageSummary={priorities?.summary}
              dispatchSummary={dispatchSummary}
              rescuedCount={priorities?.summary?.rescued_count ?? dispatchSummary?.completed_evacuations ?? 0}
              isSimulationActive={isSimulationActive}
            />

            {/* Tactical Simulation Controls */}
            <SimulationControls
              scenarios={scenarios}
              simulationState={simulationState}
              onStateUpdate={(st) => {
                setSimulationState(st);
                setLastChecked(new Date());
                void refreshPriorities();
                void refreshFleetAndMissions();
              }}
              isLoading={isLoading}
            />

            {/* Tactical City Map (Full Width with generous space for 20x20 Grid & Inspector) */}
            <CityGridView
              grid={simulationState?.grid}
              route={currentRoute}
              startCoord={startCoord}
              goalCoord={goalCoord}
              highlightCoord={selectedCivilianCoord}
              agents={agents}
              civilians={simulationState?.civilians}
              selectedAgentId={selectedAgentId}
              selectedCivilianId={selectedCivilianId}
              onSelectAgent={(id) => setSelectedAgentId(id === selectedAgentId ? null : id)}
              onSelectCivilian={(civId) => {
                const match = simulationState?.civilians?.find((c) => c.id === civId);
                if (match) handleSelectCivilian(match.coordinate, civId);
              }}
              onSetStart={(coord) => setStartCoord(coord)}
              onSetGoal={(coord) => setGoalCoord(coord)}
            />

            {/* Operations Console: Full-Width Tabbed Operational Stream */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <h2 className="text-sm font-bold text-slate-100 tracking-wide">
                    EMERGENCY OPERATIONS FEEDS
                  </h2>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <p className="text-xs text-slate-400 hidden sm:inline">
                    Select an operational stream to monitor civilian triage, fleet telemetry, active missions, or incident logs.
                  </p>
                </div>

                {/* Operations Tabs */}
                <div className="flex items-center gap-1.5 glass-panel p-1.5 rounded-2xl flex-wrap">
                  <button
                    type="button"
                    onClick={() => setOpsDrawerTab("triage")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      opsDrawerTab === "triage"
                        ? "bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_14px_rgba(6,182,212,0.25)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>🎯</span>
                    <span>Civilian Triage Queue</span>
                    {priorities?.queue && priorities.queue.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono border border-rose-500/30">
                        {priorities.queue.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpsDrawerTab("fleet")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      opsDrawerTab === "fleet"
                        ? "bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_14px_rgba(6,182,212,0.25)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>🚑</span>
                    <span>Rescue Fleet</span>
                    {agents.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                        {agents.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpsDrawerTab("missions")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      opsDrawerTab === "missions"
                        ? "bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_14px_rgba(6,182,212,0.25)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>⚡</span>
                    <span>Missions</span>
                    {missions.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                        {missions.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpsDrawerTab("events")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      opsDrawerTab === "events"
                        ? "bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_14px_rgba(6,182,212,0.25)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>📡</span>
                    <span>Event Stream</span>
                    {events.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                        {events.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Active Tab Panel (Full Width - Zero Cramping) */}
              <div className="w-full">
                {opsDrawerTab === "triage" && (
                  <RescuePriorityQueue
                    priorities={priorities}
                    isLoading={isLoading}
                    selectedCivilianCoord={selectedCivilianCoord}
                    selectedCivilianId={selectedCivilianId}
                    onSelectCivilian={handleSelectCivilian}
                    isSimulationActive={isSimulationActive}
                  />
                )}

                {opsDrawerTab === "fleet" && (
                  <RescueAgentPanel
                    agents={agents}
                    selectedAgentId={selectedAgentId}
                    onSelectAgent={(id) => setSelectedAgentId(id === selectedAgentId ? null : id)}
                    isLoading={isLoading}
                    isSimulationActive={isSimulationActive}
                  />
                )}

                {opsDrawerTab === "missions" && (
                  <MissionControlPanel
                    missions={missions}
                    summary={dispatchSummary}
                    isLoading={isLoading}
                    isSimulationActive={isSimulationActive}
                    selectedMissionId={selectedMissionId}
                    onSelectMission={handleSelectMission}
                  />
                )}

                {opsDrawerTab === "events" && (
                  <EventTimeline
                    events={events}
                    currentTick={simulationState?.current_tick ?? 0}
                    isLoading={isLoading}
                    isSimulationActive={isSimulationActive}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DEDICATED A* ROUTE PLANNER */}
        {activeView === "routing" && (
          <div className="space-y-6">
            <RoutePlanner
              gridRows={simulationState?.grid?.rows ?? 20}
              gridCols={simulationState?.grid?.cols ?? 20}
              startCoord={startCoord}
              goalCoord={goalCoord}
              onSetStart={(coord) => setStartCoord(coord)}
              onSetGoal={(coord) => setGoalCoord(coord)}
              onRouteCalculated={(route) => setCurrentRoute(route)}
              currentRoute={currentRoute}
              isSimulationActive={isSimulationActive}
            />

            <CityGridView
              grid={simulationState?.grid}
              route={currentRoute}
              startCoord={startCoord}
              goalCoord={goalCoord}
              highlightCoord={selectedCivilianCoord}
              agents={agents}
              civilians={simulationState?.civilians}
              selectedAgentId={selectedAgentId}
              selectedCivilianId={selectedCivilianId}
              onSelectAgent={(id) => setSelectedAgentId(id === selectedAgentId ? null : id)}
              onSelectCivilian={(civId) => {
                const match = simulationState?.civilians?.find((c) => c.id === civId);
                if (match) handleSelectCivilian(match.coordinate, civId);
              }}
              onSetStart={(coord) => setStartCoord(coord)}
              onSetGoal={(coord) => setGoalCoord(coord)}
            />
          </div>
        )}

        {/* VIEW 3: STRATEGY EVALUATION & BENCHMARK */}
        {activeView === "evaluation" && (
          <div className="space-y-6">
            <StrategyEvaluationPanel
              scenarios={scenarios}
              initialEvaluation={latestEvaluation}
            />
          </div>
        )}

        {/* VIEW 4: ARCHITECTURE & SYSTEM TELEMETRY */}
        {(activeView === "architecture" || activeView === "all") && (
          <div className="space-y-6">
            <AiArchitectureIntro />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProjectStatusCard info={appInfo} isLoading={isLoading} />
              <SimulationStateCard state={simulationState} isLoading={isLoading} />
              <ConfigCard config={config} isLoading={isLoading} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090B10] py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            RESQ-AI &copy; 2026 — Disaster Response Simulator. Phase 8: Final Presentation &amp; Benchmark Readiness.
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
