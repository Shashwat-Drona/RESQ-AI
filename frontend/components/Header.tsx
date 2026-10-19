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
  phase = "Phase 6: Disaster Command Dashboard",
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>RUNNING (Tick {currentTick})</span>
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/80">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>PAUSED (Tick {currentTick})</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-700/80">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>COMPLETED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-800">
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
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-blue-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-extrabold text-lg shadow-inner">
            ⚡
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
                <span>{appName}</span>
                <span className="text-slate-500 font-normal text-sm hidden sm:inline">|</span>
                <span className="text-slate-300 font-medium text-xs sm:text-sm hidden sm:inline">
                  Disaster Command Center
                </span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/70">
                {phase}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI-Powered Multi-Agent Disaster Response &amp; Emergency Evacuation Simulator
            </p>
          </div>
        </div>

        {/* Right: Live Telemetry & Connection Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Scenario Indicator */}
          {activeScenario && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300">
              <span className="text-slate-500">Scenario:</span>
              <span className="font-semibold">{formatScenarioName(activeScenario)}</span>
            </div>
          )}

          {/* Engine Lifecycle State Pill */}
          {getStatusBadge()}

          {/* Backend Health Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              {isLoading ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              ) : isConnected ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
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
            className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 border border-slate-700/80 rounded-md transition-colors cursor-pointer"
            title="Recheck backend health status"
          >
            {isLoading ? "Checking..." : "Sync"}
          </button>
        </div>
      </div>
    </header>
  );
}
