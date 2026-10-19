"use client";

import React, { useState } from "react";
import { DispatchSummary, MissionStatus, RescueMission } from "@/types/api";

interface MissionControlPanelProps {
  missions: RescueMission[] | undefined;
  summary: DispatchSummary | undefined;
  isLoading: boolean;
  isSimulationActive: boolean;
}

export function MissionControlPanel({
  missions,
  summary,
  isLoading,
  isSimulationActive,
}: MissionControlPanelProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  if (!isSimulationActive || !missions) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <span className="text-purple-400 font-mono text-sm">09 /</span>
          <h3 className="text-base font-semibold text-slate-100">
            Autonomous Mission Dispatch &amp; Evacuation Control
          </h3>
        </div>
        <div className="mt-6 text-center py-8">
          <div className="text-slate-400 text-sm font-medium">Mission Dispatch Standby</div>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Start a simulation scenario above to initiate automated triage dispatching and follow live civilian evacuation missions.
          </p>
        </div>
      </section>
    );
  }

  const filteredMissions = missions.filter((m) => {
    if (filter === "active") {
      return (
        m.status === "assigned" ||
        m.status === "en_route" ||
        m.status === "rescuing" ||
        m.status === "transporting"
      );
    }
    if (filter === "completed") {
      return m.status === "completed";
    }
    return true;
  });

  const getMissionStatusBadge = (status: MissionStatus) => {
    switch (status) {
      case "assigned":
      case "en_route":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-950/80 text-sky-300 border border-sky-700/80">
            <span>En Route</span>
          </span>
        );
      case "rescuing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-700/80">
            <span>Extracting</span>
          </span>
        );
      case "transporting":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950/80 text-purple-300 border border-purple-700/80">
            <span>Evacuating</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-700/80">
            <span>Evacuated</span>
          </span>
        );
      case "failed":
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-700/80">
            <span>Failed</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400 font-mono text-sm">09 /</span>
            <h3 className="text-base font-semibold text-slate-100">
              Autonomous Mission Dispatch &amp; Evacuation Control
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time execution log of autonomous multi-agent rescue assignments and civilian shelter delivery.
          </p>
        </div>

        {isLoading && (
          <span className="text-xs font-mono text-purple-400 animate-pulse">
            Syncing missions...
          </span>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              filter === "all"
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({missions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              filter === "active"
                ? "bg-purple-950 text-purple-200 border border-purple-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Active ({summary?.active_missions ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setFilter("completed")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              filter === "completed"
                ? "bg-emerald-950 text-emerald-200 border border-emerald-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Rescued ({summary?.completed_evacuations ?? 0})
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Ribbon */}
      {summary && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fleet Strength</span>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              {summary.total_agents}
            </div>
            <span className="text-[10px] text-slate-500">Deployed units</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Available Units</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {summary.available_agents}
            </div>
            <span className="text-[10px] text-slate-500">Ready for dispatch</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Active Missions</span>
            <div className="text-lg font-bold font-mono text-sky-400 mt-0.5">
              {summary.active_missions}
            </div>
            <span className="text-[10px] text-slate-500">Underway</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Evacuations</span>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
              {summary.completed_evacuations}
            </div>
            <span className="text-[10px] text-slate-500">Safely sheltered</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Blocked / Failed</span>
            <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              {summary.failed_missions}
            </div>
            <span className="text-[10px] text-slate-500">Hazard impediments</span>
          </div>
        </div>
      )}

      {/* Missions List */}
      <div className="mt-5 space-y-3">
        {filteredMissions.length === 0 ? (
          <div className="p-6 text-center rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs text-slate-500">
            No missions matching current filter.
          </div>
        ) : (
          filteredMissions.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-200">
                    {m.id}
                  </span>
                  {getMissionStatusBadge(m.status)}
                </div>
                <p className="text-slate-300 text-[11px]">
                  {m.explanation}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                  <span>Unit: <strong className="text-cyan-300">{m.agent_id}</strong></span>
                  <span>Target: <strong className="text-amber-300">{m.civilian_id}</strong> at ({m.target_coordinate.row}, {m.target_coordinate.col})</span>
                  {m.shelter_id && (
                    <span>Shelter: <strong className="text-emerald-300">{m.shelter_id}</strong></span>
                  )}
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/60 text-right font-mono text-[11px]">
                <span className="text-slate-400">
                  Dispatched: Tick {m.created_at_tick}
                </span>
                {m.completed_at_tick !== null && m.completed_at_tick !== undefined ? (
                  <span className="text-emerald-400 font-bold">
                    Completed: Tick {m.completed_at_tick}
                  </span>
                ) : (
                  <span className="text-cyan-400">
                    Route Waypoints: {m.route.length}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
