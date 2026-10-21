import React from "react";
import { AppInfoResponse } from "@/types/api";

interface ProjectStatusCardProps {
  info: AppInfoResponse | null;
  isLoading: boolean;
}

export function ProjectStatusCard({ info, isLoading }: ProjectStatusCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 shadow-xs p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-sm">📌</span>
            <h2 className="text-base font-semibold text-slate-900">
              Project Foundation Status
            </h2>
          </div>
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-sky-50 text-sky-700 border border-sky-200">
            {isLoading ? "Fetching..." : info?.phase || "Phase 1: Foundation"}
          </span>
        </div>

        <p className="mt-4 text-xs text-slate-600 leading-relaxed">
          {isLoading
            ? "Loading project metadata..."
            : info?.description ||
              "AI-Powered Disaster Response & Rescue Simulator - Multi-agent emergency operations platform."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[11px] uppercase tracking-wider font-medium">
              Project Scope
            </div>
            <div className="mt-1 font-semibold text-slate-900">Phase 1 / 8</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Foundation &amp; Architecture
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[11px] uppercase tracking-wider font-medium">
              API Version
            </div>
            <div className="mt-1 font-mono font-semibold text-slate-900">
              {info?.version || "v0.1.0"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">FastAPI &amp; Pydantic v2</div>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
            Planned Scenarios
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(info?.supported_disasters || ["flood", "earthquake"]).map(
              (disaster) => (
                <span
                  key={disaster}
                  className="px-2.5 py-1 text-xs font-mono uppercase rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold"
                >
                  {disaster}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
        <span className="text-slate-500">OpenAPI Documentation:</span>
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="text-sky-600 hover:text-sky-700 font-mono transition-colors underline underline-offset-2 font-medium"
        >
          /docs ↗
        </a>
      </div>
    </div>
  );
}
