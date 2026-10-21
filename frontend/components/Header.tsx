"use client";

import React from "react";

interface HeaderProps {
  appName?: string;
  phase?: string;
  isConnected: boolean;
  isLoading: boolean;
  simulationStatus?: string;
  currentTick?: number;
  activeScenario?: string | null;
  onRetry: () => void;
}

export function Header({
  appName = "RESQ-AI",
  phase = "Phase 8: Final Presentation & Benchmark Readiness",
  isConnected,
  isLoading,
  simulationStatus = "not_started",
  currentTick = 0,
  activeScenario = null,
  onRetry,
}: HeaderProps) {
  const getStatusBadge = () => {
    switch (simulationStatus) {
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>LIVE OPS (Tick {currentTick})</span>
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>PAUSED (Tick {currentTick})</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>COMPLETED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-400 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>STANDBY</span>
          </span>
        );
    }
  };

  const formatScenarioName = (id: string | null) => {
    if (!id) return "No Scenario Loaded";
    return id
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <header className="border-b border-white/[0.08] bg-[#07090E]/85 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/25 via-blue-500/15 to-emerald-500/25 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono font-extrabold text-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            ⚡
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight font-sans flex items-center gap-1.5 bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
                {appName}
              </h1>
              <span className="text-slate-600 font-normal text-sm hidden sm:inline">|</span>
              <span className="text-slate-300 font-medium text-xs sm:text-sm hidden sm:inline">
                Disaster Command Center
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-mono">
                {phase}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              AI-Powered Multi-Agent Autonomous Rescue &amp; Evacuation Operations
            </p>
          </div>
        </div>

        {/* Right: Live Telemetry & Connection Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Scenario Indicator */}
          {activeScenario && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/50 text-xs font-mono text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              <span className="text-slate-400">Scenario:</span>
              <span className="font-semibold">{formatScenarioName(activeScenario)}</span>
            </div>
          )}

          {/* Engine Lifecycle State Pill */}
          {getStatusBadge()}

          {/* Backend Health Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              {isLoading ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              ) : isConnected ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              )}
            </span>
            <span className="text-slate-300 font-mono text-[11px]">
              {isLoading
                ? "Connecting..."
                : isConnected
                ? "API Online"
                : "API Offline"}
            </span>
          </div>

          <button
            id="retry-connection-button"
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900/90 hover:bg-slate-800 hover:text-white active:bg-slate-950 disabled:opacity-50 border border-slate-700/80 rounded-full transition-all cursor-pointer shadow-xs"
            title="Recheck backend health status"
          >
            {isLoading ? "Checking..." : "Sync"}
          </button>
        </div>
      </div>
    </header>
  );
}
