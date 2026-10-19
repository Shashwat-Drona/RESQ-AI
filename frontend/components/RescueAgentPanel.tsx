"use client";

import React from "react";
import { AgentStatus, AgentType, RescueAgent } from "@/types/api";

interface RescueAgentPanelProps {
  agents: RescueAgent[] | undefined;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  isLoading: boolean;
  isSimulationActive: boolean;
}

export function RescueAgentPanel({
  agents,
  selectedAgentId,
  onSelectAgent,
  isLoading,
  isSimulationActive,
}: RescueAgentPanelProps) {
  if (!isSimulationActive || !agents || agents.length === 0) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <span className="text-cyan-400 font-mono text-sm">08 /</span>
          <h3 className="text-base font-semibold text-slate-100">
            Autonomous Rescue Fleet
          </h3>
        </div>
        <div className="mt-6 text-center py-8">
          <div className="text-slate-400 text-sm font-medium">Rescue Fleet Standby</div>
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-700/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Idle / Ready</span>
          </span>
        );
      case "en_route":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-950/80 text-sky-300 border border-sky-700/80 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span>En Route</span>
          </span>
        );
      case "rescuing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-700/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Securing Patient</span>
          </span>
        );
      case "transporting":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950/80 text-purple-300 border border-purple-700/80">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>Transporting</span>
          </span>
        );
      case "unavailable":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-700/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
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

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-sm">08 /</span>
            <h3 className="text-base font-semibold text-slate-100">
              Autonomous Rescue Fleet
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/80">
              {agents.length} Units Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Heterogeneous responders navigating autonomously via dynamic A* pathfinding. Click an agent to view active route.
          </p>
        </div>

        {isLoading && (
          <span className="text-xs font-mono text-cyan-400 animate-pulse">
            Syncing telemetry...
          </span>
        )}
      </div>

      {/* Agents Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          return (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                isSelected
                  ? "bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/50"
                  : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getTypeIcon(agent.type)}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">
                      {agent.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {agent.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
                {getStatusBadge(agent.status)}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Location:</span>
                  <span className="font-mono text-slate-200">
                    ({agent.coordinate.row}, {agent.coordinate.col})
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Target:</span>
                  <span className="font-mono text-slate-200">
                    {agent.target_civilian_id ? (
                      <span className="text-amber-300 font-bold">
                        {agent.target_civilian_id}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Carrying:</span>
                  <span className="font-mono">
                    {agent.carrying_civilian_id ? (
                      <span className="text-purple-300 font-bold flex items-center gap-1">
                        <span>👤</span>
                        <span>{agent.carrying_civilian_id}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Waypoints:</span>
                  <span className="font-mono text-cyan-300">
                    {agent.active_path.length > 0 ? (
                      `${agent.active_path.length} steps remaining`
                    ) : (
                      <span className="text-slate-500">Stationary</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800/40">
                  <span>Rescues Completed:</span>
                  <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <span>🏆</span>
                    <span>{agent.completed_rescues}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
