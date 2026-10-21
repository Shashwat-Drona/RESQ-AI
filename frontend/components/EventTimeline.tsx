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
      <section className="rounded-2xl glass-panel p-5">
        <div className="flex items-center gap-2 pb-3.5 border-b border-slate-200">
          <span className="text-sm">📡</span>
          <h3 className="text-sm font-bold text-slate-900">
            Emergency Operational Event Stream
          </h3>
        </div>
        <div className="mt-4 text-center py-6">
          <div className="text-slate-700 text-xs font-semibold">Event Stream Standby</div>
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
      return "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold shadow-2xs";
    }
    if (text.includes("Extraction")) {
      return "border-purple-300 bg-purple-50 text-purple-800 font-semibold shadow-2xs";
    }
    if (text.includes("Autonomous Dispatch") || text.includes("Dispatched")) {
      return "border-sky-300 bg-sky-50 text-sky-800 shadow-2xs";
    }
    if (text.includes("Replanning") || text.includes("rerouted")) {
      return "border-amber-300 bg-amber-50 text-amber-800 shadow-2xs";
    }
    if (text.includes("Hazard") || text.includes("blocked") || text.includes("depleted")) {
      return "border-rose-300 bg-rose-50 text-rose-800 shadow-2xs";
    }
    if (text.includes("Simulation Tick")) {
      return "border-slate-200 bg-slate-100 text-slate-600 font-mono text-[10px]";
    }
    return "border-slate-200 bg-white text-slate-800 shadow-2xs";
  };

  // Reverse so newest events appear at top
  const reversedEvents = [...events].reverse();
  const filteredEvents = reversedEvents.filter((e) =>
    e.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <section className="rounded-2xl glass-panel p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(37,99,235,0.8)]" />
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">
              EMERGENCY OPERATIONAL EVENT STREAM
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              Tick {currentTick} • {events.length} logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time chronological telemetry emitted by the backend simulation engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter events..."
            className="px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:border-sky-500 w-36 sm:w-48 font-mono shadow-2xs"
          />
          {isLoading && (
            <span className="text-[10px] font-mono text-sky-700 animate-pulse font-medium">
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
                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${badgeClass}`}
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
