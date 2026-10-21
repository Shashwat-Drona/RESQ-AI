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
  phase = "Phase 8: Presentation & Benchmark",
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span>LIVE OPS (Tick {currentTick})</span>
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>PAUSED (Tick {currentTick})</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            <span>COMPLETED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
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
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-mono font-extrabold text-lg shadow-sm">
            ⚡
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight font-sans flex items-center gap-1.5 text-slate-900">
                {appName}
              </h1>
              <span className="text-slate-300 font-normal text-sm hidden sm:inline">|</span>
              <span className="text-slate-600 font-medium text-xs sm:text-sm hidden sm:inline">
                Disaster Command Center
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                {phase}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              AI-Powered Multi-Agent Autonomous Rescue &amp; Evacuation Operations
            </p>
          </div>
        </div>

        {/* Right: Live Telemetry & Connection Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Scenario Indicator */}
          {activeScenario && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs">
              <span className="text-slate-400">Scenario:</span>
              <span className="font-semibold text-slate-900">{formatScenarioName(activeScenario)}</span>
            </div>
          )}

          {/* Engine Lifecycle State Pill */}
          {getStatusBadge()}

          {/* Backend Health Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <span className="relative flex h-2 w-2">
              {isLoading ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              ) : isConnected ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
              )}
            </span>
            <span className="font-mono text-[11px] font-medium">
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
            className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 border border-slate-300 rounded-full transition-all cursor-pointer shadow-2xs"
            title="Recheck backend health status"
          >
            {isLoading ? "Checking..." : "Sync"}
          </button>
        </div>
      </div>
    </header>
  );
}
