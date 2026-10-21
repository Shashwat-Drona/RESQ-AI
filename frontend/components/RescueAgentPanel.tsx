"use client";

import React, { useState, useMemo } from "react";
import { AgentStatus, AgentType, RescueAgent } from "@/types/api";

interface RescueAgentPanelProps {
  agents: RescueAgent[] | undefined;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  isLoading: boolean;
  isSimulationActive: boolean;
}

type AgentFilter = "all" | "active" | "idle" | "ground_responder" | "foot_patrol";

export function RescueAgentPanel({
  agents,
  selectedAgentId,
  onSelectAgent,
  isLoading,
  isSimulationActive,
}: RescueAgentPanelProps) {
  const [filter, setFilter] = useState<AgentFilter>("all");

  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    if (filter === "all") return agents;
    if (filter === "active") {
      return agents.filter(
        (a) => a.status === "en_route" || a.status === "rescuing" || a.status === "transporting"
      );
    }
    if (filter === "idle") {
      return agents.filter((a) => a.status === "idle");
    }
    return agents.filter((a) => a.type === filter);
  }, [agents, filter]);

  if (!isSimulationActive || !agents || agents.length === 0) {
    return (
      <section className="rounded-2xl glass-panel p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
          <span className="text-sm">🚑</span>
          <h3 className="text-base font-bold text-slate-900">
            Autonomous Rescue Fleet
          </h3>
        </div>
        <div className="mt-6 text-center py-8">
          <div className="text-slate-700 text-sm font-semibold">Rescue Fleet Standby</div>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Start a simulation scenario above to deploy the heterogeneous rescue fleet (Ground Responders &amp; Foot Crews) with autonomous dispatch.
          </p>
        </div>
      </section>
    );
  }

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case "idle":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Idle / Ready</span>
          </span>
        );
      case "en_route":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            <span>En Route</span>
          </span>
        );
      case "rescuing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Extracting</span>
          </span>
        );
      case "transporting":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>Transporting</span>
          </span>
        );
      case "unavailable":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Blocked / Down</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: AgentType) => {
    return type === "ground_responder" ? "🚑" : "🏃";
  };

  const getTypeName = (type: AgentType) => {
    return type === "ground_responder" ? "Ground Responder" : "Foot Patrol";
  };

  return (
    <section className="rounded-2xl glass-panel p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(2,132,199,0.8)]" />
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">
              AUTONOMOUS RESCUE FLEET
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-sky-50 text-sky-700 border border-sky-200 font-bold">
              {agents.length} Units Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Heterogeneous responders navigating autonomously via dynamic A* pathfinding. Click an agent to highlight route on grid.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isLoading && (
            <span className="text-xs font-mono text-sky-700 animate-pulse font-medium">
              Syncing telemetry...
            </span>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            {(
              [
                { id: "all", label: "All" },
                { id: "active", label: "Busy" },
                { id: "idle", label: "Idle" },
                { id: "ground_responder", label: "🚑 Vehicles" },
                { id: "foot_patrol", label: "🏃 Foot" },
              ] as { id: AgentFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  filter === tab.id
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAgents.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            No agents match filter &quot;{filter}&quot;.
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const isSelected = selectedAgentId === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-sky-50/80 border-sky-400 shadow-md ring-2 ring-sky-300"
                    : "bg-white border-slate-200 hover:border-sky-300 hover:shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">{getTypeIcon(agent.type)}</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {agent.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {getTypeName(agent.type)}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Location:</span>
                    <span className="text-slate-900 font-bold">
                      ({agent.coordinate.row}, {agent.coordinate.col})
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500">
                    <span>Target:</span>
                    <span>
                      {agent.target_civilian_id ? (
                        <span className="text-amber-700 font-bold">
                          {agent.target_civilian_id}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500">
                    <span>Carrying:</span>
                    <span>
                      {agent.carrying_civilian_id ? (
                        <span className="text-purple-700 font-bold flex items-center gap-1">
                          <span aria-hidden="true">👤</span>
                          <span>{agent.carrying_civilian_id}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500">
                    <span>Remaining Steps:</span>
                    <span className="text-sky-700 font-bold">
                      {agent.active_path.length > 0 ? (
                        `${agent.active_path.length} steps`
                      ) : (
                        <span className="text-slate-400 font-normal">Stationary</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-100">
                    <span>Rescues Completed:</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span aria-hidden="true">🏆</span>
                      <span>{agent.completed_rescues} lives</span>
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-sky-300 text-center">
                    <span className="text-[10px] font-mono text-sky-700 font-bold uppercase tracking-wider">
                      ● Active Track on Grid
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
