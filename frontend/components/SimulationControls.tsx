"use client";

import React, { useState } from "react";
import {
  pauseSimulation,
  resetSimulation,
  resumeSimulation,
  startSimulation,
  stepTick,
} from "@/lib/api";
import { ScenarioInfo, SimulationState } from "@/types/api";

interface SimulationControlsProps {
  scenarios: ScenarioInfo[];
  simulationState: SimulationState | null;
  onStateUpdate: (state: SimulationState) => void;
  isLoading: boolean;
}

export function SimulationControls({
  scenarios,
  simulationState,
  onStateUpdate,
  isLoading,
}: SimulationControlsProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>(
    "flooded_neighborhood"
  );
  const [seed, setSeed] = useState<number>(42);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const status = simulationState?.status || "not_started";
  const isRunning = status === "running";
  const isPaused = status === "paused";

  const handleStart = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const newState = await startSimulation({
        scenario_id: selectedScenario,
        seed: Number(seed),
      });
      onStateUpdate(newState);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleTick = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const result = await stepTick();
      onStateUpdate(result.state);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseResume = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const newState = isRunning
        ? await pauseSimulation()
        : await resumeSimulation();
      onStateUpdate(newState);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const newState = await resetSimulation();
      onStateUpdate(newState);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-sm">04 /</span>
            <h3 className="text-base font-semibold text-slate-100">
              Disaster Engine Controls &amp; Scenarios
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Initialize deterministic disaster environments and advance simulation ticks.
          </p>
        </div>

        {/* Current Lifecycle Status Pill */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Status:</span>
          <span
            className={`px-2.5 py-1 rounded border uppercase font-medium ${
              isRunning
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                : isPaused
                ? "bg-amber-950/60 text-amber-400 border-amber-800/60"
                : "bg-slate-950 text-slate-400 border-slate-800"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Control Panel Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Scenario Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Scenario Template
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            disabled={isLoading || actionLoading}
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name} ({sc.disaster_type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Seed Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Random Seed (Reproducibility)
          </label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
            disabled={isLoading || actionLoading}
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleStart}
            disabled={isLoading || actionLoading}
            className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {actionLoading ? "Processing..." : "Start Scenario"}
          </button>

          <button
            onClick={handleTick}
            disabled={!isRunning || actionLoading}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors cursor-pointer"
          >
            Step Tick (+1)
          </button>

          <button
            onClick={handlePauseResume}
            disabled={status === "not_started" || actionLoading}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            {isRunning ? "Pause" : "Resume"}
          </button>

          <button
            onClick={handleReset}
            disabled={status === "not_started" || actionLoading}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
