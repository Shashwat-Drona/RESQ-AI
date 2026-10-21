"use client";

import React, { useState } from "react";
import { DispatchSummary, MissionStatus, RescueMission } from "@/types/api";

interface MissionControlPanelProps {
  missions: RescueMission[] | undefined;
  summary: DispatchSummary | undefined;
  isLoading: boolean;
  isSimulationActive: boolean;
  selectedMissionId?: string | null;
  onSelectMission?: (mission: RescueMission) => void;
}

type MissionFilter = "all" | "active" | "completed" | "failed";

export function MissionControlPanel({
  missions,
  summary,
  isLoading,
  isSimulationActive,
  selectedMissionId,
  onSelectMission,
}: MissionControlPanelProps) {
  const [filter, setFilter] = useState<MissionFilter>("all");

  if (!isSimulationActive || !missions) {
    return (
      <section className="rounded-2xl glass-panel p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
          <span className="text-sm">⚡</span>
          <h3 className="text-base font-bold text-slate-900">
            Autonomous Mission Dispatch &amp; Evacuation Control
          </h3>
        </div>
        <div className="mt-6 text-center py-8">
          <div className="text-slate-700 text-sm font-semibold">Mission Dispatch Standby</div>
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
    if (filter === "failed") {
      return m.status === "failed" || m.status === "cancelled";
    }
    return true;
  });

  const getMissionStatusBadge = (status: MissionStatus) => {
    switch (status) {
      case "assigned":
      case "en_route":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-300">
            <span aria-hidden="true">🚑</span>
            <span>En Route</span>
          </span>
        );
      case "rescuing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-300">
            <span aria-hidden="true">⏱️</span>
            <span>Extracting</span>
          </span>
        );
      case "transporting":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-300">
            <span aria-hidden="true">🏥</span>
            <span>Evacuating</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-300">
            <span aria-hidden="true">✅</span>
            <span>Evacuated</span>
          </span>
        );
      case "failed":
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-300">
            <span aria-hidden="true">⚠️</span>
            <span>Blocked / Failed</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="rounded-2xl glass-panel p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">
              AUTONOMOUS MISSION DISPATCH &amp; EVACUATION CONTROL
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time execution log of autonomous multi-agent rescue assignments and civilian shelter delivery. Click a mission to inspect unit and target.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isLoading && (
            <span className="text-xs font-mono text-purple-700 animate-pulse font-medium">
              Syncing missions...
            </span>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All ({missions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                filter === "active"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Active ({summary?.active_missions ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setFilter("completed")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                filter === "completed"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Rescued ({summary?.completed_evacuations ?? 0})
            </button>
            {summary && summary.failed_missions > 0 && (
              <button
                type="button"
                onClick={() => setFilter("failed")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  filter === "failed"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-rose-600 hover:text-rose-800"
                }`}
              >
                Blocked ({summary.failed_missions})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate Metrics Ribbon */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl glass-card">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Fleet Strength</span>
            <div className="text-xl font-bold font-mono text-sky-700 mt-0.5">
              {summary.total_agents}
            </div>
            <span className="text-[10px] text-slate-400">Deployed units</span>
          </div>

          <div className="p-3 rounded-xl glass-card">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Available Units</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
              {summary.available_agents}
            </div>
            <span className="text-[10px] text-slate-400">Ready for dispatch</span>
          </div>

          <div className="p-3 rounded-xl glass-card">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Missions</span>
            <div className="text-xl font-bold font-mono text-sky-700 mt-0.5">
              {summary.active_missions}
            </div>
            <span className="text-[10px] text-slate-400">Underway</span>
          </div>

          <div className="p-3 rounded-xl glass-card">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Evacuations</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
              {summary.completed_evacuations}
            </div>
            <span className="text-[10px] text-slate-400">Safely sheltered</span>
          </div>

          <div className="p-3 rounded-xl glass-card col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Blocked / Failed</span>
            <div className="text-xl font-bold font-mono text-rose-600 mt-0.5">
              {summary.failed_missions}
            </div>
            <span className="text-[10px] text-slate-400">Hazard impediments</span>
          </div>
        </div>
      )}

      {/* Missions List */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {filteredMissions.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            No missions matching current filter &quot;{filter}&quot;.
          </div>
        ) : (
          filteredMissions.map((m) => {
            const isSelected = selectedMissionId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => onSelectMission?.(m)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs ${
                  isSelected
                    ? "bg-purple-50 border-purple-400 ring-2 ring-purple-300 shadow-sm"
                    : "bg-white border-slate-200 hover:border-purple-300 hover:shadow-2xs"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900">
                      {m.id}
                    </span>
                    {getMissionStatusBadge(m.status)}
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-purple-100 text-purple-800 border border-purple-300 font-bold">
                        Inspecting
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    {m.explanation}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                    <span>Unit: <strong className="text-sky-700">{m.agent_id}</strong></span>
                    <span>Target: <strong className="text-amber-700">{m.civilian_id}</strong> at ({m.target_coordinate.row}, {m.target_coordinate.col})</span>
                    {m.shelter_id && (
                      <span>Shelter: <strong className="text-emerald-700">{m.shelter_id}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 text-right font-mono text-[11px] shrink-0">
                  <span className="text-slate-500">
                    Dispatched: Tick {m.created_at_tick}
                  </span>
                  {m.completed_at_tick !== null && m.completed_at_tick !== undefined ? (
                    <span className="text-emerald-700 font-bold">
                      Completed: Tick {m.completed_at_tick}
                    </span>
                  ) : (
                    <span className="text-sky-700 font-bold">
                      Waypoints: {m.route.length} steps
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
