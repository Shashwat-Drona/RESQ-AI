"use client";

import React, { useEffect, useRef, useState } from "react";
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

  // Auto-play state
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<number>(1500); // 1.5s interval
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const status = simulationState?.status || "not_started";
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const currentTick = simulationState?.current_tick || 0;

  // Cleanup auto-play timer on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, []);

  const handleStart = async () => {
    if (isAutoPlaying) toggleAutoPlay();
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
    if (actionLoading) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const result = await stepTick();
      onStateUpdate(result.state);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      if (isAutoPlaying) toggleAutoPlay();
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    } else {
      if (!isRunning) return;
      setIsAutoPlaying(true);
      autoPlayTimerRef.current = setInterval(async () => {
        try {
          const result = await stepTick();
          onStateUpdate(result.state);
          if (result.state.status !== "running") {
            setIsAutoPlaying(false);
            if (autoPlayTimerRef.current) {
              clearInterval(autoPlayTimerRef.current);
              autoPlayTimerRef.current = null;
            }
          }
        } catch {
          setIsAutoPlaying(false);
          if (autoPlayTimerRef.current) {
            clearInterval(autoPlayTimerRef.current);
            autoPlayTimerRef.current = null;
          }
        }
      }, autoPlaySpeed);
    }
  };

  const handlePauseResume = async () => {
    if (isAutoPlaying) toggleAutoPlay();
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

  const confirmReset = async () => {
    setShowResetConfirm(false);
    if (isAutoPlaying) toggleAutoPlay();
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
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Tactical Simulation Controls
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure disaster scenario, execute single ticks, or run autonomous dispatch playback.
          </p>
        </div>

        {/* Status & Tick Pill */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Simulation Tick:</span>
          <span className="px-2.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-bold border border-slate-800">
            {currentTick}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded border uppercase text-[11px] font-bold ${
              isRunning
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-700/80"
                : isPaused
                ? "bg-amber-950/80 text-amber-400 border-amber-700/80"
                : "bg-slate-950 text-slate-400 border-slate-800"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3.5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300 flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-rose-200 cursor-pointer font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control Panel Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Scenario Selector */}
        <div className="md:col-span-4">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Scenario Template
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            disabled={isLoading || actionLoading || isAutoPlaying}
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name} ({sc.disaster_type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Seed Input */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Seed (Reproducible)
          </label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
            disabled={isLoading || actionLoading || isAutoPlaying}
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Action Buttons Toolbar */}
        <div className="md:col-span-6 flex flex-wrap gap-2">
          {/* Start Scenario Button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading || actionLoading}
            className="flex-1 min-w-[120px] px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {actionLoading ? "Processing..." : "Start Scenario"}
          </button>

          {/* Step Tick Button */}
          <button
            type="button"
            onClick={handleTick}
            disabled={!isRunning || actionLoading || isAutoPlaying}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Advance exactly one simulation tick"
          >
            <span>Step Tick</span>
            <span className="font-mono text-[10px] bg-blue-800 px-1 rounded">+1</span>
          </button>

          {/* Continuous Auto-Play Button */}
          <button
            type="button"
            onClick={toggleAutoPlay}
            disabled={!isRunning || actionLoading}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              isAutoPlaying
                ? "bg-rose-950 text-rose-200 border-rose-700 animate-pulse"
                : "bg-purple-950/80 text-purple-300 border-purple-700 hover:bg-purple-900/60"
            }`}
            title="Automatically advance simulation ticks sequentially via backend requests"
          >
            <span>{isAutoPlaying ? "⏹ Stop Playback" : "▶ Auto Play"}</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={handlePauseResume}
            disabled={status === "not_started" || actionLoading || isAutoPlaying}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            {isRunning ? "Pause" : "Resume"}
          </button>

          {/* Reset Button with Confirmation */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              disabled={status === "not_started" || actionLoading || isAutoPlaying}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Reset
            </button>

            {showResetConfirm && (
              <div className="absolute right-0 bottom-full mb-2 w-64 p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl z-20 text-xs">
                <div className="font-bold text-slate-200">Reset to Tick 0?</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  This will restore the initial seeded environment and clear active missions.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmReset}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Play Speed Controls */}
      {isAutoPlaying && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-purple-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>Auto Playback Active (Requesting tick every {autoPlaySpeed / 1000}s)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Speed:</span>
            {[1000, 1500, 2000].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setAutoPlaySpeed(speed)}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                  autoPlaySpeed === speed
                    ? "bg-purple-800 text-white font-bold"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200"
                }`}
              >
                {speed / 1000}s
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
