import React from "react";
import { HealthResponse } from "@/types/api";

interface ConnectionBannerProps {
  health: HealthResponse | null;
  error: string | null;
  apiUrl: string;
  onRetry: () => void;
  isLoading: boolean;
}

export function ConnectionBanner({
  health,
  error,
  apiUrl,
  onRetry,
  isLoading,
}: ConnectionBannerProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-rose-400 text-lg">⚠️</span>
            <div>
              <h3 className="font-semibold text-rose-300">
                Backend Connection Unavailable
              </h3>
              <p className="mt-1 text-slate-300 text-xs">{error}</p>
              <div className="mt-3 p-2.5 rounded bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400">
                <span className="text-slate-500">Target API:</span> {apiUrl}
                <br />
                <span className="text-slate-500">Run backend in terminal:</span>{" "}
                <code className="text-emerald-400">
                  python -m uvicorn app.main:app --app-dir backend --reload
                </code>
              </div>
            </div>
          </div>
          <button
            onClick={onRetry}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded transition-colors whitespace-nowrap"
          >
            {isLoading ? "Retrying..." : "Retry Connection"}
          </button>
        </div>
      </div>
    );
  }

  if (health) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-300 font-medium">
              API Online:
            </span>
            <span className="text-slate-300">
              Service <code className="text-emerald-400">{health.service}</code> running in{" "}
              <span className="text-slate-200 uppercase font-mono">{health.environment}</span> mode
            </span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Server Time: {new Date(health.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
