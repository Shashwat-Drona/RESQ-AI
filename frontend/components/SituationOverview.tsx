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
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-xs font-bold tracking-wider uppercase">
            KPI Telemetry
          </span>
          <span className="text-slate-500">•</span>
          <h2 className="text-sm font-semibold text-slate-100">
            Emergency Situation Overview
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {isSimulationActive ? "Real-Time Telemetry" : "Engine Inactive"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Civilians Awaiting Rescue */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium">Unrescued</span>
            <span className="text-sm">👥</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-100">
              {activeUnrescued !== null ? activeUnrescued : "—"}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Civilians awaiting extraction</p>
          </div>
        </div>

        {/* Card 2: Critical Priority Incidents */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-medium">Critical Triage</span>
            <span className="text-sm">🚨</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-rose-400">
              {criticalCount !== null ? criticalCount : "—"}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Urgent life hazards</p>
          </div>
        </div>

        {/* Card 3: Active Rescue Missions */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[11px] font-medium">Active Missions</span>
            <span className="text-sm">⚡</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-sky-400">
              {activeMissions !== null ? activeMissions : "—"}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">En route or extracting</p>
          </div>
        </div>

        {/* Card 4: Available Rescue Agents */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-medium">Available Units</span>
            <span className="text-sm">🚑</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {availableAgents !== null ? availableAgents : "—"}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Stationed &amp; ready</p>
          </div>
        </div>

        {/* Card 5: Completed Evacuations */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-[11px] font-medium">Safely Sheltered</span>
            <span className="text-sm">🏆</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-emerald-300">
              {isSimulationActive ? totalRescued : "—"}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Delivered to safe shelter</p>
          </div>
        </div>

        {/* Card 6: Blocked or Failed Missions */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-medium">Blocked / Failed</span>
            <span className="text-sm">⚠️</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-amber-400">
              {isSimulationActive ? failedMissions : "—"}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Impassable hazards</p>
          </div>
        </div>
      </div>
    </section>
  );
}
