import React from "react";

interface HeaderProps {
  appName?: string;
  phase?: string;
  isConnected: boolean;
  isLoading: boolean;
  onRetry: () => void;
}

export function Header({
  appName = "RESQ-AI",
  phase = "Phase 1: Project Foundation & Architecture",
  isConnected,
  isLoading,
  onRetry,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                {appName}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/60 text-blue-300 border border-blue-700/50">
                {phase}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI-Powered Disaster Response &amp; Rescue Simulator
            </p>
          </div>
        </div>

        {/* Right: Telemetry & Connection Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              {isLoading ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              ) : isConnected ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              ) : (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLoading
                    ? "bg-amber-500"
                    : isConnected
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />
            </span>
            <span className="text-slate-300 font-medium">
              {isLoading
                ? "Connecting..."
                : isConnected
                ? "Backend Connected"
                : "Backend Disconnected"}
            </span>
          </div>

          <button
            id="retry-connection-button"
            onClick={onRetry}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50 border border-slate-700 rounded-md transition-colors cursor-pointer"
          >
            {isLoading ? "Checking..." : "Re-check"}
          </button>
        </div>
      </div>
    </header>
  );
}
