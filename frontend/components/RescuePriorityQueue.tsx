"use client";

import React, { useState, useMemo } from "react";
import { Coordinate, PrioritiesResponse, TriageItem } from "@/types/api";

interface RescuePriorityQueueProps {
  priorities: PrioritiesResponse | null;
  isLoading: boolean;
  selectedCivilianCoord?: Coordinate | null;
  selectedCivilianId?: string | null;
  onSelectCivilian?: (coord: Coordinate, civilianId?: string) => void;
  isSimulationActive: boolean;
}

type UrgencyFilter = "all" | "critical" | "high" | "medium" | "low";
type StatusFilter = "all" | "trapped" | "injured" | "waiting";
type SortOption = "rank_asc" | "score_desc" | "health_asc" | "wait_desc";

export function RescuePriorityQueue({
  priorities,
  isLoading,
  selectedCivilianCoord,
  selectedCivilianId,
  onSelectCivilian,
  isSimulationActive,
}: RescuePriorityQueueProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("rank_asc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter and sort client-side on actual API data without altering backend state
  const displayedItems = useMemo(() => {
    if (!priorities?.queue) return [];
    let result = [...priorities.queue];

    if (urgencyFilter !== "all") {
      result = result.filter((item) => item.urgency === urgencyFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.civilian_id.toLowerCase().includes(q) ||
          item.explanation.toLowerCase().includes(q) ||
          `(${item.coordinate.row},${item.coordinate.col})`.includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "score_desc":
          return b.priority_score - a.priority_score;
        case "health_asc":
          return a.health - b.health;
        case "wait_desc":
          return b.waiting_ticks - a.waiting_ticks;
        case "rank_asc":
        default:
          return a.rank - b.rank;
      }
    });

    return result;
  }, [priorities, urgencyFilter, statusFilter, sortOption, searchQuery]);

  if (!isSimulationActive || !priorities) {
    return (
      <section className="rounded-2xl glass-panel p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
          <span className="text-sm">🎯</span>
          <h3 className="text-base font-bold text-slate-800">
            Civilian Triage Queue
          </h3>
        </div>
        <div className="mt-6 text-center py-8">
          <div className="text-slate-700 text-sm font-semibold">Triage Queue Standby</div>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Start a simulation scenario above to assess affected civilians and compute dynamic rescue priorities.
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Critical</span>
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-300">
            <span>High</span>
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-yellow-50 text-yellow-800 border border-yellow-300">
            <span>Medium</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-300">
            <span>Low</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "trapped":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-300">
            Trapped
          </span>
        );
      case "injured":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
            Injured
          </span>
        );
      case "rescued":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
            Rescued
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-300">
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
    (selectedCivilianCoord &&
      selectedCivilianCoord.row === item.coordinate.row &&
      selectedCivilianCoord.col === item.coordinate.col) ||
    selectedCivilianId === item.civilian_id;

  return (
    <section className="rounded-2xl glass-panel p-5 space-y-5 relative overflow-hidden">
      {/* Header and Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3.5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(2,132,199,0.8)]" />
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">
              CIVILIAN TRIAGE PRIORITY QUEUE
            </h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold">
              Tick {priorities.current_tick}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritized rescue candidates based on health deterioration and hazard severity. Click to locate on map.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-sky-700 font-mono font-medium">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            <span>Recalculating triage...</span>
          </div>
        )}
      </div>

      {/* Clean 4-Card Summary Strip (Decluttered, zero overlapping) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Active In Queue */}
        <div className="p-3.5 rounded-xl glass-card">
          <div className="text-[11px] font-semibold text-slate-500">Awaiting Rescue</div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">{summary.active_unrescued}</span>
            <span className="text-xs text-slate-500 font-mono">/ {summary.total_civilians} total</span>
          </div>
        </div>

        {/* Card 2: Critical Care */}
        <div className="p-3.5 rounded-xl glass-card bg-rose-50/40 border-rose-200/80 hover:border-rose-400 hover:shadow-xs">
          <div className="text-[11px] font-bold text-rose-700">Critical Priority</div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-extrabold font-mono text-rose-600 tracking-tight">{summary.critical_count}</span>
            <span className="text-xs text-rose-600/80 font-mono font-medium">urgent</span>
          </div>
        </div>

        {/* Card 3: Trapped Victims */}
        <div className="p-3.5 rounded-xl glass-card bg-amber-50/40 border-amber-200/80 hover:border-amber-400 hover:shadow-xs">
          <div className="text-[11px] font-bold text-amber-700">Trapped In Hazard</div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-extrabold font-mono text-amber-600 tracking-tight">{summary.trapped_count}</span>
            <span className="text-xs text-amber-600/80 font-mono font-medium">blocked</span>
          </div>
        </div>

        {/* Card 4: Safely Evacuated */}
        <div className="p-3.5 rounded-xl glass-card bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-400 hover:shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700">Safely Evacuated</div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-extrabold font-mono text-emerald-600 tracking-tight">{summary.rescued_count}</span>
            <span className="text-xs text-emerald-700/80 font-mono font-medium">
              ({summary.total_civilians > 0 ? Math.round((summary.rescued_count / summary.total_civilians) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Streamlined Single-Row Filter Toolbar */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[160px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search civilian ID (e.g. CIV_6) or coord..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:border-sky-500 focus:outline-hidden transition-all shadow-2xs"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Urgency */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as UrgencyFilter)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:border-sky-500 outline-hidden cursor-pointer transition-all shadow-2xs"
            aria-label="Filter by urgency"
          >
            <option value="all">All Urgencies</option>
            <option value="critical">🚨 Critical Only</option>
            <option value="high">⚠️ High Only</option>
            <option value="medium">⚡ Medium Only</option>
            <option value="low">ℹ️ Low Only</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:border-sky-500 outline-hidden cursor-pointer transition-all shadow-2xs"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="trapped">Trapped Only</option>
            <option value="injured">Injured Only</option>
            <option value="waiting">Waiting Only</option>
          </select>

          {/* Sort */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:border-sky-500 outline-hidden cursor-pointer transition-all shadow-2xs"
            aria-label="Sort queue"
          >
            <option value="rank_asc">Priority Rank (#1 first)</option>
            <option value="score_desc">Score (Highest first)</option>
            <option value="health_asc">Health (Lowest HP first)</option>
            <option value="wait_desc">Wait Time (Longest first)</option>
          </select>
        </div>
      </div>

      {/* Priority Queue List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 pb-1">
          <span>
            Ranked Rescue Candidates ({displayedItems.length}{" "}
            {displayedItems.length !== queue.length && `filtered from ${queue.length}`})
          </span>
          <span className="text-[11px] text-sky-700 font-mono font-medium hidden sm:inline">
            Click candidate to locate on grid
          </span>
        </div>

        {displayedItems.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            {queue.length === 0
              ? "All civilians have been evacuated safely to shelters!"
              : "No candidates match the active filters."}
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {displayedItems.map((item) => {
              const selected = isSelected(item);
              const isExpanded = expandedItemId === item.civilian_id;

              return (
                <div
                  key={item.civilian_id}
                  onClick={() => onSelectCivilian?.(item.coordinate, item.civilian_id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selected
                      ? "bg-sky-50/70 border-sky-400 ring-1 ring-sky-300 shadow-sm"
                      : "bg-white border-slate-200 hover:border-sky-300 hover:shadow-2xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Rank, ID, Tags & Location */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          item.rank === 1
                            ? "bg-rose-100 text-rose-700 border border-rose-300"
                            : item.rank === 2
                            ? "bg-amber-100 text-amber-700 border border-amber-300"
                            : item.rank === 3
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : "bg-slate-100 text-slate-600 border border-slate-300"
                        }`}
                      >
                        #{item.rank}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {item.civilian_id.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            ({item.coordinate.row}, {item.coordinate.col})
                          </span>
                          {getUrgencyBadge(item.urgency)}
                          {getStatusBadge(item.status)}
                          {selected && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-sky-100 text-sky-800 border border-sky-300 font-bold">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                          {item.explanation}
                        </div>
                      </div>
                    </div>

                    {/* Right: Health, Wait & Triage Score Telemetry (Never overflows or clips) */}
                    <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      {/* Health Meter */}
                      <div className="w-20 sm:w-24 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-500">HP</span>
                          <span
                            className={
                              item.health < 30
                                ? "text-rose-600 font-bold"
                                : item.health < 60
                                ? "text-amber-600 font-bold"
                                : "text-emerald-600 font-bold"
                            }
                          >
                            {item.health}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getHealthBarColor(item.health)}`}
                            style={{ width: `${item.health}%` }}
                          />
                        </div>
                      </div>

                      {/* Waiting Ticks */}
                      <div className="text-right">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Wait</div>
                        <div className="text-xs font-mono font-semibold text-slate-700">
                          {item.waiting_ticks} <span className="text-[10px] text-slate-400">t</span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="text-right pl-3 border-l border-slate-200">
                        <div className="text-[9px] uppercase tracking-wider text-purple-700 font-bold">Score</div>
                        <div className="text-sm font-mono font-extrabold text-purple-700 whitespace-nowrap">
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
                        className="text-[11px] text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 cursor-pointer"
                        title="Toggle score factors"
                        aria-label="Toggle score factors"
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Score Factor Breakdown */}
                  {isExpanded && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px] font-mono">
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500">Urgency:</span>{" "}
                        <span className="text-rose-700 font-bold">+{item.score_breakdown.urgency_score}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500">Health:</span>{" "}
                        <span className="text-amber-700 font-bold">+{item.score_breakdown.health_score}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500">Trapped:</span>{" "}
                        <span className="text-red-700 font-bold">+{item.score_breakdown.trapped_score}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500">Hazard:</span>{" "}
                        <span className="text-sky-700 font-bold">+{item.score_breakdown.hazard_score}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500">Injured:</span>{" "}
                        <span className="text-yellow-800 font-bold">+{item.score_breakdown.injured_score}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500">Waiting:</span>{" "}
                        <span className="text-purple-700 font-bold">+{item.score_breakdown.waiting_score}</span>
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
