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

  const isConnected = !!health && !error;
  const isSimulationActive = !!simulationState?.grid;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation & Telemetry Header */}
      <Header
        appName={appInfo?.name || "RESQ-AI"}
        phase="Phase 7: Strategy Evaluation & Baseline Benchmark"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Connection & Alert Banner */}
        <ConnectionBanner
          health={health}
          error={error}
          apiUrl={API_BASE_URL}
          onRetry={loadData}
          isLoading={isLoading}
        />

        {/* Academic / Demo Introduction Banner */}
        <AiArchitectureIntro />

        {/* Section 01: High-Level Situation Overview KPI Dashboard */}
        <SituationOverview
          triageSummary={priorities?.summary}
          dispatchSummary={dispatchSummary}
          rescuedCount={priorities?.summary?.rescued_count ?? dispatchSummary?.completed_evacuations ?? 0}
          isSimulationActive={isSimulationActive}
        />

        {/* Section 02: Simulation Controls & Scenario Selector */}
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

        {/* Section 03: Live 2D Tactical City Grid, Responders, & Route Visualizer */}
        <CityGridView
          grid={simulationState?.grid}
          route={currentRoute}
          startCoord={startCoord}
          goalCoord={goalCoord}
          highlightCoord={selectedCivilianCoord}
          agents={agents}
          civilians={simulationState?.civilians}
          selectedAgentId={selectedAgentId}
          onSelectAgent={(id) => setSelectedAgentId(id === selectedAgentId ? null : id)}
          onSetStart={(coord) => setStartCoord(coord)}
          onSetGoal={(coord) => setGoalCoord(coord)}
        />

        {/* Section 04: Autonomous Rescue Fleet Telemetry */}
        <RescueAgentPanel
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={(id) => setSelectedAgentId(id === selectedAgentId ? null : id)}
          isLoading={isLoading}
          isSimulationActive={isSimulationActive}
        />

        {/* Section 05: Autonomous Mission Dispatch & Evacuation Control */}
        <MissionControlPanel
          missions={missions}
          summary={dispatchSummary}
          isLoading={isLoading}
          isSimulationActive={isSimulationActive}
          selectedMissionId={selectedMissionId}
          onSelectMission={handleSelectMission}
        />

        {/* Section 06: Intelligent Rescue Priority Queue & Triage */}
        <RescuePriorityQueue
          priorities={priorities}
          isLoading={isLoading}
          selectedCivilianCoord={selectedCivilianCoord}
          selectedCivilianId={selectedCivilianId}
          onSelectCivilian={handleSelectCivilian}
          isSimulationActive={isSimulationActive}
        />

        {/* Section 07: Live Incident Event Timeline */}
        <EventTimeline
          events={events}
          currentTick={simulationState?.current_tick ?? 0}
          isLoading={isLoading}
          isSimulationActive={isSimulationActive}
        />

        {/* Section 08: Manual A* Route Planner & Movement Profile Evaluator */}
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

        {/* Section 09: Empirical Strategy Evaluation & Baseline Benchmark */}
        <StrategyEvaluationPanel
          scenarios={scenarios}
          initialEvaluation={latestEvaluation}
        />

        {/* Section 10: System Telemetry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectStatusCard info={appInfo} isLoading={isLoading} />
          <SimulationStateCard state={simulationState} isLoading={isLoading} />
          <ConfigCard config={config} isLoading={isLoading} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            RESQ-AI &copy; 2026 — Disaster Response Simulator. Phase 7: Strategy Evaluation &amp; Baseline Benchmark.
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
