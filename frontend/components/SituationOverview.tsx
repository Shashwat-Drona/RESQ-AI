"use client";

import React from "react";
import { DispatchSummary, TriageSummary } from "@/types/api";

interface SituationOverviewProps {
  triageSummary: TriageSummary | undefined;
  dispatchSummary: DispatchSummary | undefined;
  rescuedCount: number;
  isSimulationActive: boolean;
}

export function SituationOverview({
  triageSummary,
  dispatchSummary,
  rescuedCount,
  isSimulationActive,
}: SituationOverviewProps) {
  const activeUnrescued = triageSummary?.active_unrescued ?? (isSimulationActive ? 0 : null);
  const criticalCount = triageSummary?.critical_count ?? (isSimulationActive ? 0 : null);
  const activeMissions = dispatchSummary?.active_missions ?? (isSimulationActive ? 0 : null);
  const availableAgents = dispatchSummary?.available_agents ?? (isSimulationActive ? 0 : null);
  const totalRescued = rescuedCount ?? dispatchSummary?.completed_evacuations ?? 0;
  const failedMissions = dispatchSummary?.failed_missions ?? 0;

  return (
    <section className="rounded-2xl glass-panel p-5 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3.5 border-b border-slate-200 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse shadow-[0_0_6px_rgba(2,132,199,0.8)]" />
          <h2 className="text-sm font-bold text-slate-900 tracking-wide">
            EMERGENCY SITUATION OVERVIEW
          </h2>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Global Incident Metrics &amp; Telemetry
          </span>
        </div>
        <span className="text-[11px] text-sky-700 font-mono px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 font-bold">
          {isSimulationActive ? "● Real-Time Feed" : "Standby Mode"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 relative z-10">
        {/* Card 1: Civilians Awaiting Rescue */}
        <div className="p-4 rounded-xl glass-card flex flex-col justify-between group hover:border-slate-400">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold group-hover:text-slate-700 transition-colors">Awaiting Rescue</span>
            <span className="text-sm p-1 rounded-md bg-slate-100 text-slate-700">👥</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              {activeUnrescued !== null ? activeUnrescued : "—"}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Pending extraction</p>
          </div>
        </div>

        {/* Card 2: Critical Priority Incidents */}
        <div className="p-4 rounded-xl glass-card bg-rose-50/40 border-rose-200/80 flex flex-col justify-between group hover:border-rose-400 hover:shadow-xs">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold group-hover:text-rose-700 transition-colors">Critical Triage</span>
            <span className="text-sm p-1 rounded-md bg-rose-100 text-rose-700">🚨</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 tracking-tight">
              {criticalCount !== null ? criticalCount : "—"}
            </div>
            <p className="text-[10px] text-rose-600/80 mt-1 font-mono font-medium">Immediate danger</p>
          </div>
        </div>

        {/* Card 3: Active Rescue Missions */}
        <div className="p-4 rounded-xl glass-card bg-sky-50/40 border-sky-200/80 flex flex-col justify-between group hover:border-sky-400 hover:shadow-xs">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-xs font-bold group-hover:text-sky-700 transition-colors">Active Missions</span>
            <span className="text-sm p-1 rounded-md bg-sky-100 text-sky-700">⚡</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-sky-600 tracking-tight">
              {activeMissions !== null ? activeMissions : "—"}
            </div>
            <p className="text-[10px] text-sky-600/80 mt-1 font-mono font-medium">En route / extracting</p>
          </div>
        </div>

        {/* Card 4: Available Rescue Agents */}
        <div className="p-4 rounded-xl glass-card bg-emerald-50/40 border-emerald-200/80 flex flex-col justify-between group hover:border-emerald-400 hover:shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold group-hover:text-emerald-700 transition-colors">Ready Fleet</span>
            <span className="text-sm p-1 rounded-md bg-emerald-100 text-emerald-700">🚑</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 tracking-tight">
              {availableAgents !== null ? availableAgents : "—"}
            </div>
            <p className="text-[10px] text-emerald-600/80 mt-1 font-mono font-medium">Units stationed</p>
          </div>
        </div>

        {/* Card 5: Completed Evacuations */}
        <div className="p-4 rounded-xl glass-card bg-emerald-50/50 border-emerald-300/80 flex flex-col justify-between group hover:border-emerald-500 hover:shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold group-hover:text-emerald-800 transition-colors">Safely Sheltered</span>
            <span className="text-sm p-1 rounded-md bg-emerald-100 text-emerald-700">🏆</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 tracking-tight">
              {isSimulationActive ? totalRescued : "—"}
            </div>
            <p className="text-[10px] text-emerald-700/80 mt-1 font-mono font-medium">Delivered to safety</p>
          </div>
        </div>

        {/* Card 6: Blocked or Failed Missions */}
        <div className="p-4 rounded-xl glass-card bg-amber-50/40 border-amber-200/80 flex flex-col justify-between group hover:border-amber-400 hover:shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold group-hover:text-amber-700 transition-colors">Blocked / Alerts</span>
            <span className="text-sm p-1 rounded-md bg-amber-100 text-amber-700">⚠️</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 tracking-tight">
              {isSimulationActive ? failedMissions : "—"}
            </div>
            <p className="text-[10px] text-amber-600/80 mt-1 font-mono font-medium">Impassable / rerouted</p>
          </div>
        </div>
      </div>
    </section>
  );
}
