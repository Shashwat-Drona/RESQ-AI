"use client";

import React, { useState } from "react";

export function AiArchitectureIntro() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <section className="rounded-xl border border-slate-200 bg-white/95 shadow-xs p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-300 items-center justify-center text-emerald-700 text-xs font-bold font-mono">
            AI
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span>Autonomous Multi-Agent Disaster Operations &amp; Evacuation Engine</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Phase 8 Complete
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomous coordination architecture combining deterministic triage heuristics, dynamic A* navigation, and real-time evacuation logistics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          {isOpen ? "Hide Architecture" : "View Architecture"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3.5 border-t border-slate-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
              <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">
                01 / A* Pathfinding
              </span>
              <h3 className="font-semibold text-slate-900 mt-1">Hazard-Aware Routing</h3>
              <p className="text-[11px] text-slate-600 mt-1">
                4-directional search with profile-specific edge costs (`ground_responder` vs `on_foot`).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200">
              <span className="text-[10px] font-mono font-bold text-rose-700 uppercase">
                02 / Explainable Triage
              </span>
              <h3 className="font-semibold text-slate-900 mt-1">Multi-Factor Scoring</h3>
              <p className="text-[11px] text-slate-600 mt-1">
                Transparent urgency, health deficit, entrapment, and hazard exposure evaluation.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200">
              <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">
                03 / Environmental Physics
              </span>
              <h3 className="font-semibold text-slate-900 mt-1">Disaster Progression</h3>
              <p className="text-[11px] text-slate-600 mt-1">
                Hydraulic flood diffusion and seismic debris deposition with scheduled aftershocks.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-sky-50/50 border border-sky-200">
              <span className="text-[10px] font-mono font-bold text-sky-700 uppercase">
                04 / Multi-Agent Dispatch
              </span>
              <h3 className="font-semibold text-slate-900 mt-1">Autonomous Coordination</h3>
              <p className="text-[11px] text-slate-600 mt-1">
                Deterministic target assignment, right-of-way yielding, and dynamic obstacle rerouting.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200">
              <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">
                05 / Evacuation Logistics
              </span>
              <h3 className="font-semibold text-slate-900 mt-1">Shelter Evacuation</h3>
              <p className="text-[11px] text-slate-600 mt-1">
                Civilian patient transport, decay protection in-transit, and shelter capacity tracking.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">ℹ️</span>
              <span>
                <strong>Academic Simulation Notice:</strong> The triage engine and multi-agent coordination models are educational research heuristics. They do not constitute validated clinical triage or certified emergency response protocols.
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
              Deterministic Seeded Model
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
