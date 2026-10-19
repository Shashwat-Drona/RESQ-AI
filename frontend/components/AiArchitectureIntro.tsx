"use client";

import React, { useState } from "react";

export function AiArchitectureIntro() {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  return (
    <section className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 items-center justify-center text-emerald-400 text-xs font-bold font-mono">
            AI
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Autonomous Multi-Agent Disaster Operations &amp; Evacuation Engine</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Phase 6 Verified
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous coordination architecture combining deterministic triage heuristics, dynamic A* navigation, and real-time evacuation logistics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-950/60 border border-slate-800 transition-colors cursor-pointer"
        >
          {isOpen ? "Hide Architecture" : "View Architecture"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                01 / A* Pathfinding
              </span>
              <h3 className="font-semibold text-slate-200 mt-1">Hazard-Aware Routing</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                4-directional search with profile-specific edge costs (`ground_responder` vs `on_foot`).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
                02 / Explainable Triage
              </span>
              <h3 className="font-semibold text-slate-200 mt-1">Multi-Factor Scoring</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Transparent urgency, health deficit, entrapment, and hazard exposure evaluation.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">
                03 / Environmental Physics
              </span>
              <h3 className="font-semibold text-slate-200 mt-1">Disaster Progression</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Hydraulic flood diffusion and seismic debris deposition with scheduled aftershocks.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                04 / Multi-Agent Dispatch
              </span>
              <h3 className="font-semibold text-slate-200 mt-1">Autonomous Coordination</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Deterministic target assignment, right-of-way yielding, and dynamic obstacle rerouting.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
                05 / Evacuation Logistics
              </span>
              <h3 className="font-semibold text-slate-200 mt-1">Shelter Evacuation</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Civilian patient transport, decay protection in-transit, and shelter capacity tracking.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">ℹ️</span>
              <span>
                <strong>Academic Simulation Notice:</strong> The triage engine and multi-agent coordination models are educational research heuristics. They do not constitute validated clinical triage or certified emergency response protocols.
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-500 hidden sm:inline">
              Deterministic Seeded Model
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
