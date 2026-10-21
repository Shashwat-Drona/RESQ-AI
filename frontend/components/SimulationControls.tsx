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
        } catch (err: unknown) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
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
    <section className="rounded-2xl glass-panel p-5 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(2,132,199,0.8)]" />
            <h2 className="text-sm font-bold text-slate-900 tracking-wide">
              TACTICAL SIMULATION CONTROLS
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure disaster scenario, execute single ticks, or run autonomous dispatch playback.
          </p>
        </div>

        {/* Status & Tick Pill */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">Current Tick:</span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200">
            {currentTick}
          </span>
          <span
            className={`px-3 py-1 rounded-full border uppercase text-[11px] font-bold ${
              isRunning
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs"
                : isPaused
                ? "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 hover:text-rose-800 cursor-pointer font-mono font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control Panel Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Scenario Selector */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Scenario Template
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            disabled={isLoading || actionLoading || isAutoPlaying}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer transition-all shadow-2xs"
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Seed (Reproducible)
          </label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
            disabled={isLoading || actionLoading || isAutoPlaying}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all shadow-2xs"
          />
        </div>

        {/* Action Buttons Toolbar */}
        <div className="md:col-span-6 flex flex-wrap gap-2">
          {/* Start Scenario Button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading || actionLoading}
            className="flex-1 min-w-[125px] px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {actionLoading ? "Processing..." : "Start Scenario"}
          </button>

          {/* Step Tick Button */}
          <button
            type="button"
            onClick={handleTick}
            disabled={!isRunning || actionLoading || isAutoPlaying}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-sky-300 disabled:border-slate-200 disabled:text-slate-400 text-sky-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Advance exactly one simulation tick"
          >
            <span>Step Tick</span>
            <span className="font-mono text-[10px] bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 text-sky-700 font-bold">+1</span>
          </button>

          {/* Continuous Auto-Play Button */}
          <button
            type="button"
            onClick={toggleAutoPlay}
            disabled={!isRunning || actionLoading}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              isAutoPlaying
                ? "bg-rose-50 text-rose-700 border-rose-300 shadow-xs animate-pulse"
                : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
            }`}
            title="Automatically advance simulation ticks sequentially via backend requests"
          >
            <span>{isAutoPlaying ? "⏹ Stop Play" : "▶ Auto Play"}</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={handlePauseResume}
            disabled={status === "not_started" || actionLoading || isAutoPlaying}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-300 transition-all cursor-pointer shadow-2xs"
          >
            {isRunning ? "Pause" : "Resume"}
          </button>

          {/* Reset Button with Confirmation */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              disabled={status === "not_started" || actionLoading || isAutoPlaying}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              Reset
            </button>

            {showResetConfirm && (
              <div className="absolute right-0 bottom-full mb-2 w-64 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xl z-20 text-xs">
                <div className="font-bold text-slate-900">Reset to Tick 0?</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  This will restore the initial seeded environment and clear active missions.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmReset}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-500 cursor-pointer shadow-xs"
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
        <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-purple-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span>Auto Playback Active (requesting tick every {autoPlaySpeed / 1000}s)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Speed:</span>
            {[1000, 1500, 2000].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setAutoPlaySpeed(speed)}
                className={`px-2.5 py-0.5 rounded-md text-[10px] cursor-pointer transition-colors ${
                  autoPlaySpeed === speed
                    ? "bg-purple-600 text-white font-bold shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
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
