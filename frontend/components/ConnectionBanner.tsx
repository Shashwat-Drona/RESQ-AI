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
      <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-rose-600 text-lg">⚠️</span>
            <div>
              <h3 className="font-bold text-rose-800">
                Backend Connection Unavailable
              </h3>
              <p className="mt-1 text-slate-700 text-xs">{error}</p>
              <div className="mt-3 p-2.5 rounded-lg bg-white border border-rose-200 text-xs font-mono text-slate-700 shadow-2xs">
                <span className="text-slate-500">Target API:</span> {apiUrl}
                <br />
                <span className="text-slate-500">Run backend in terminal:</span>{" "}
                <code className="text-emerald-700 font-bold">
                  python -m uvicorn app.main:app --app-dir backend --reload
                </code>
              </div>
            </div>
          </div>
          <button
            onClick={onRetry}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            {isLoading ? "Retrying..." : "Retry Connection"}
          </button>
        </div>
      </div>
    );
  }

  if (health) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-800 font-bold">
              API Online:
            </span>
            <span className="text-slate-700">
              Service <code className="text-emerald-700 font-bold">{health.service}</code> running in{" "}
              <span className="text-slate-900 uppercase font-mono font-semibold">{health.environment}</span> mode
            </span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Server Time: {new Date(health.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
