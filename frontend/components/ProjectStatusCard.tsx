import React from "react";
import { AppInfoResponse } from "@/types/api";

interface ProjectStatusCardProps {
  info: AppInfoResponse | null;
  isLoading: boolean;
}

export function ProjectStatusCard({ info, isLoading }: ProjectStatusCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-sm">📌</span>
            <h2 className="text-base font-semibold text-slate-100">
              Project Foundation Status
            </h2>
          </div>
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
            {isLoading ? "Fetching..." : info?.phase || "Phase 1: Foundation"}
          </span>
        </div>

        <p className="mt-4 text-xs text-slate-300 leading-relaxed">
          {isLoading
            ? "Loading project metadata..."
            : info?.description ||
              "AI-Powered Disaster Response & Rescue Simulator - Multi-agent emergency operations platform."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="text-slate-400 text-[11px] uppercase tracking-wider">
              Project Scope
            </div>
            <div className="mt-1 font-semibold text-slate-200">Phase 1 / 8</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Foundation &amp; Architecture
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="text-slate-400 text-[11px] uppercase tracking-wider">
              API Version
            </div>
            <div className="mt-1 font-mono font-semibold text-slate-200">
              {info?.version || "v0.1.0"}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">FastAPI &amp; Pydantic v2</div>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">
            Planned Scenarios
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(info?.supported_disasters || ["flood", "earthquake"]).map(
              (disaster) => (
                <span
                  key={disaster}
                  className="px-2.5 py-1 text-xs font-mono uppercase rounded bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {disaster}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">OpenAPI Documentation:</span>
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 hover:text-blue-300 font-mono transition-colors underline underline-offset-2"
        >
          /docs ↗
        </a>
      </div>
    </div>
  );
}
