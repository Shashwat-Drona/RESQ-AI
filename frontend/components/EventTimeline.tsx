"use client";

import React, { useState } from "react";

interface EventTimelineProps {
  events: string[] | undefined;
  currentTick: number;
  isLoading: boolean;
  isSimulationActive: boolean;
}

export function EventTimeline({
  events = [],
  currentTick,
  isLoading,
  isSimulationActive,
}: EventTimelineProps) {
  const [searchFilter, setSearchFilter] = useState<string>("");

  if (!isSimulationActive || events.length === 0) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-2 pb-3.5 border-b border-slate-800">
          <span className="text-blue-400 font-mono text-sm">10 /</span>
          <h3 className="text-sm font-semibold text-slate-100">
            Emergency Operational Event Stream
          </h3>
        </div>
        <div className="mt-4 text-center py-6">
          <div className="text-slate-400 text-xs font-medium">Event Stream Standby</div>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            Start a simulation scenario to monitor live dispatch notifications, movement blockage replanning, and civilian evacuation events.
          </p>
        </div>
      </section>
    );
  }

  const getEventIcon = (text: string) => {
    if (text.includes("Rescue Complete")) return "🏆";
    if (text.includes("Extraction")) return "🤝";
    if (text.includes("Autonomous Dispatch") || text.includes("Dispatched")) return "⚡";
    if (text.includes("Replanning") || text.includes("rerouted")) return "🔄";
    if (text.includes("Hazard Warning") || text.includes("blocked")) return "⚠️";
    if (text.includes("Flood") || text.includes("water")) return "🌊";
    if (text.includes("Earthquake") || text.includes("rubble") || text.includes("debris")) return "🧱";
    if (text.includes("Simulation Tick")) return "⏱️";
    return "📌";
  };

  const getEventBadgeClass = (text: string) => {
    if (text.includes("Rescue Complete")) {
      return "border-emerald-700/80 bg-emerald-950/70 text-emerald-300 font-semibold";
    }
    if (text.includes("Extraction")) {
      return "border-purple-700/80 bg-purple-950/70 text-purple-300 font-semibold";
    }
    if (text.includes("Autonomous Dispatch") || text.includes("Dispatched")) {
      return "border-cyan-700/80 bg-cyan-950/70 text-cyan-300";
    }
    if (text.includes("Replanning") || text.includes("rerouted")) {
      return "border-amber-700/80 bg-amber-950/70 text-amber-300";
    }
    if (text.includes("Hazard") || text.includes("blocked") || text.includes("depleted")) {
      return "border-rose-700/80 bg-rose-950/70 text-rose-300";
    }
    if (text.includes("Simulation Tick")) {
      return "border-slate-700/60 bg-slate-900 text-slate-400 font-mono text-[10px]";
    }
    return "border-slate-800 bg-slate-950 text-slate-300";
  };

  // Reverse so newest events appear at top
  const reversedEvents = [...events].reverse();
  const filteredEvents = reversedEvents.filter((e) =>
    e.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-mono text-sm">10 /</span>
            <h3 className="text-sm font-semibold text-slate-100">
              Emergency Operational Event Stream
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
              Tick {currentTick} • {events.length} logs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time chronological telemetry emitted by the backend simulation engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter events..."
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 w-36 sm:w-48 font-mono"
          />
          {isLoading && (
            <span className="text-[10px] font-mono text-cyan-400 animate-pulse">
              Syncing...
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 max-h-64 overflow-y-auto space-y-2 pr-1 select-text">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">
            No events match the current search filter.
          </div>
        ) : (
          filteredEvents.map((eventText, idx) => {
            const icon = getEventIcon(eventText);
            const badgeClass = getEventBadgeClass(eventText);
            const isTickHeader = eventText.startsWith("---");

            return (
              <div
                key={`${idx}-${eventText.slice(0, 20)}`}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${badgeClass}`}
              >
                <span className="text-sm shrink-0 leading-none mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`break-words ${isTickHeader ? "font-bold text-center tracking-wider" : ""}`}>
                    {eventText}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
