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
      {/* Background ambient glow highlight */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3.5 border-b border-white/[0.07] relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <h2 className="text-sm font-bold text-slate-100 tracking-wide">
            EMERGENCY SITUATION OVERVIEW
          </h2>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Global Incident Metrics &amp; Telemetry
          </span>
        </div>
        <span className="text-[11px] text-cyan-400 font-mono px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-800/40">
          {isSimulationActive ? "● Real-Time Feed" : "Standby Mode"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 relative z-10">
        {/* Card 1: Civilians Awaiting Rescue */}
        <div className="p-4 rounded-xl glass-card flex flex-col justify-between group hover:border-slate-500/50">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium group-hover:text-slate-200 transition-colors">Awaiting Rescue</span>
            <span className="text-sm p-1 rounded-md bg-slate-800/60 text-slate-300">👥</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {activeUnrescued !== null ? activeUnrescued : "—"}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">Pending extraction</p>
          </div>
        </div>

        {/* Card 2: Critical Priority Incidents */}
        <div className="p-4 rounded-xl glass-card flex flex-col justify-between group hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold group-hover:text-rose-300 transition-colors">Critical Triage</span>
            <span className="text-sm p-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">🚨</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400 tracking-tight">
              {criticalCount !== null ? criticalCount : "—"}
            </div>
            <p className="text-[10px] text-rose-300/80 mt-1 font-mono">Immediate danger</p>
          </div>
        </div>

        {/* Card 3: Active Rescue Missions */}
        <div className="p-4 rounded-xl glass-card flex flex-col justify-between group hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-semibold group-hover:text-cyan-300 transition-colors">Active Missions</span>
            <span className="text-sm p-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">⚡</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300 tracking-tight">
              {activeMissions !== null ? activeMissions : "—"}
            </div>
            <p className="text-[10px] text-cyan-400/80 mt-1 font-mono">En route / extracting</p>
          </div>
        </div>

        {/* Card 4: Available Rescue Agents */}
        <div className="p-4 rounded-xl glass-card flex flex-col justify-between group hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold group-hover:text-emerald-300 transition-colors">Ready Fleet</span>
            <span className="text-sm p-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">🚑</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              {availableAgents !== null ? availableAgents : "—"}
            </div>
            <p className="text-[10px] text-emerald-400/80 mt-1 font-mono">Units stationed</p>
          </div>
        </div>

        {/* Card 5: Completed Evacuations */}
        <div className="p-4 rounded-xl glass-card flex flex-col justify-between group hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-semibold group-hover:text-emerald-200 transition-colors">Safely Sheltered</span>
            <span className="text-sm p-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">🏆</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300 tracking-tight">
              {isSimulationActive ? totalRescued : "—"}
            </div>
            <p className="text-[10px] text-emerald-300/80 mt-1 font-mono">Delivered to safety</p>
          </div>
        </div>

        {/* Card 6: Blocked or Failed Missions */}
        <div className="p-4 rounded-xl glass-card flex flex-col justify-between group hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold group-hover:text-amber-300 transition-colors">Blocked / Alerts</span>
            <span className="text-sm p-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">⚠️</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 tracking-tight">
              {isSimulationActive ? failedMissions : "—"}
            </div>
            <p className="text-[10px] text-amber-300/80 mt-1 font-mono">Impassable / rerouted</p>
          </div>
        </div>
      </div>
    </section>
  );
}
