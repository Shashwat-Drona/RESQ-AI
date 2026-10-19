"use client";

import React, { useState } from "react";
import { Coordinate, PrioritiesResponse, TriageItem } from "@/types/api";

interface RescuePriorityQueueProps {
  priorities: PrioritiesResponse | null;
  isLoading: boolean;
  selectedCivilianCoord?: Coordinate | null;
  onSelectCivilian?: (coord: Coordinate) => void;
  isSimulationActive: boolean;
}

export function RescuePriorityQueue({
  priorities,
  isLoading,
  selectedCivilianCoord,
  onSelectCivilian,
  isSimulationActive,
}: RescuePriorityQueueProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  if (!isSimulationActive || !priorities) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <span className="text-rose-400 font-mono text-sm">07 /</span>
          <h3 className="text-base font-semibold text-slate-100">
            Rescue Priority Queue &amp; Civilian Triage
          </h3>
        </div>
        <div className="mt-6 text-center py-8">
          <div className="text-slate-400 text-sm font-medium">Triage Queue Standby</div>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Start a simulation scenario above to assess affected civilians, evaluate dynamic environmental hazards, and compute deterministic rescue priorities.
          </p>
        </div>
      </section>
    );
  }

  const { queue, summary } = priorities;

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-700/80 shadow-xs">
            <span>🚨</span>
            <span>Critical</span>
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-950/80 text-amber-300 border border-amber-700/80">
            <span>⚠️</span>
            <span>High</span>
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-yellow-950/60 text-yellow-300 border border-yellow-700/60">
            <span>⚡</span>
            <span>Medium</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-blue-950/60 text-blue-300 border border-blue-800/60">
            <span>ℹ️</span>
            <span>Low</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "trapped":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-red-950/90 text-red-200 border border-red-800">
            Trapped
          </span>
        );
      case "injured":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-amber-950/70 text-amber-200 border border-amber-800">
            Injured
          </span>
        );
      case "rescued":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-700">
            Rescued
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-slate-800 text-slate-300 border border-slate-700">
            Waiting
          </span>
        );
    }
  };

  const getHealthBarColor = (health: number) => {
    if (health >= 60) return "bg-emerald-500";
    if (health >= 30) return "bg-amber-500";
    return "bg-rose-500 animate-pulse";
  };

  const isSelected = (item: TriageItem) =>
    selectedCivilianCoord?.row === item.coordinate.row &&
    selectedCivilianCoord?.col === item.coordinate.col;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
      {/* Header and Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-rose-400 font-mono text-sm">07 /</span>
            <h3 className="text-base font-semibold text-slate-100">
              Rescue Priority Queue &amp; Civilian Triage
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic multi-factor triage heuristic. Click any civilian to highlight coordinate on the city grid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <span
              className="w-2.5 h-2.5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin"
              title="Updating triage queue"
            />
          )}
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            Tick {priorities.current_tick} Triage
          </span>
          <span className="text-[10px] text-slate-500 italic">
            Simulation Heuristic
          </span>
        </div>
      </div>

      {/* Triage Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div className="text-[9px] uppercase tracking-wider text-slate-400">Total</div>
          <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
            {summary.total_civilians}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div className="text-[9px] uppercase tracking-wider text-cyan-400">Unrescued</div>
          <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
            {summary.active_unrescued}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-900/50">
          <div className="text-[9px] uppercase tracking-wider text-rose-400">Critical</div>
          <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
            {summary.critical_count}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-900/50">
          <div className="text-[9px] uppercase tracking-wider text-amber-400">High</div>
          <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
            {summary.high_count}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-yellow-900/50">
          <div className="text-[9px] uppercase tracking-wider text-yellow-400">Medium</div>
          <div className="text-base font-bold font-mono text-yellow-400 mt-0.5">
            {summary.medium_count}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-blue-900/50">
          <div className="text-[9px] uppercase tracking-wider text-blue-400">Low</div>
          <div className="text-base font-bold font-mono text-blue-400 mt-0.5">
            {summary.low_count}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-red-900/50">
          <div className="text-[9px] uppercase tracking-wider text-red-400">Trapped</div>
          <div className="text-base font-bold font-mono text-red-400 mt-0.5">
            {summary.trapped_count}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-900/50">
          <div className="text-[9px] uppercase tracking-wider text-emerald-400">Rescued</div>
          <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
            {summary.rescued_count}
          </div>
        </div>
      </div>

      {/* Priority Queue List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 pb-1">
          <span>Ranked Active Rescue Candidates ({queue.length})</span>
          <span className="text-[11px] text-slate-500">
            Sorted by Score ↓ &bull; Urgency ↓ &bull; Health ↑
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="p-6 text-center rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
            🎉 All civilians have been evacuated safely to shelters!
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {queue.map((item) => {
              const selected = isSelected(item);
              const isExpanded = expandedItemId === item.civilian_id;

              return (
                <div
                  key={item.civilian_id}
                  onClick={() => onSelectCivilian?.(item.coordinate)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selected
                      ? "bg-slate-900 border-blue-500 ring-1 ring-blue-500 shadow-md"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Rank & Identity */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                          item.rank === 1
                            ? "bg-rose-500 text-white ring-2 ring-rose-400/50"
                            : item.rank === 2
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : item.rank === 3
                            ? "bg-yellow-500 text-slate-950 font-bold"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        #{item.rank}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">
                            {item.civilian_id.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ({item.coordinate.row}, {item.coordinate.col})
                          </span>
                          {getUrgencyBadge(item.urgency)}
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {item.explanation}
                        </div>
                      </div>
                    </div>

                    {/* Health & Score Telemetry */}
                    <div className="flex items-center gap-4 sm:justify-end">
                      {/* Health Meter */}
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-400">HP</span>
                          <span
                            className={
                              item.health < 30
                                ? "text-rose-400 font-bold"
                                : item.health < 60
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }
                          >
                            {item.health}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getHealthBarColor(item.health)}`}
                            style={{ width: `${item.health}%` }}
                          />
                        </div>
                      </div>

                      {/* Waiting Ticks */}
                      <div className="text-right">
                        <div className="text-[9px] uppercase tracking-wider text-slate-500">Wait</div>
                        <div className="text-xs font-mono text-slate-300">
                          {item.waiting_ticks} <span className="text-[10px] text-slate-500">t</span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="text-right pl-2 border-l border-slate-800">
                        <div className="text-[9px] uppercase tracking-wider text-purple-400">Score</div>
                        <div className="text-sm font-mono font-bold text-purple-300">
                          {item.priority_score.toFixed(1)}
                        </div>
                      </div>

                      {/* Breakdown Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedItemId(isExpanded ? null : item.civilian_id);
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-300 p-1"
                        title="Toggle score breakdown"
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Score Breakdown */}
                  {isExpanded && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px] font-mono">
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-500">Urgency:</span>{" "}
                        <span className="text-rose-400">+{item.score_breakdown.urgency_score}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-500">Health:</span>{" "}
                        <span className="text-amber-400">+{item.score_breakdown.health_score}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-500">Trapped:</span>{" "}
                        <span className="text-red-400">+{item.score_breakdown.trapped_score}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-500">Hazard:</span>{" "}
                        <span className="text-cyan-400">+{item.score_breakdown.hazard_score}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-500">Injured:</span>{" "}
                        <span className="text-yellow-400">+{item.score_breakdown.injured_score}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-500">Waiting:</span>{" "}
                        <span className="text-purple-400">+{item.score_breakdown.waiting_score}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
