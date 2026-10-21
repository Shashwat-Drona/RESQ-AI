import React from "react";
import { SimulationState } from "@/types/api";

interface SimulationStateCardProps {
  state: SimulationState | null;
  isLoading: boolean;
}

export function SimulationStateCard({
  state,
  isLoading,
}: SimulationStateCardProps) {
  const status = state?.status || "not_started";
  const isIdle = status === "not_started";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-sm">⏱️</span>
            <h2 className="text-base font-semibold text-slate-100">
              Simulation Engine State
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/50 border border-amber-800/40 text-amber-300 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            {isLoading ? "Checking..." : status}
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">ENGINE STATUS</span>
            <span className="text-xs font-mono font-medium text-amber-400 uppercase">
              {isIdle ? "STANDBY (PHASE 1)" : status}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-normal">
            {isLoading
              ? "Retrieving engine state..."
              : state?.message ||
                "Simulation engine is initialized in standby. No active simulation session is running."}
          </p>
        </div>

        {/* Telemetry Metrics */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center font-mono">
          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">TICK</div>
            <div className="text-sm font-bold text-slate-200 mt-1">
              {state?.current_tick ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">INCIDENTS</div>
            <div className="text-sm font-bold text-slate-400 mt-1">
              {state?.active_incidents ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">CIVILIANS</div>
            <div className="text-sm font-bold text-slate-400 mt-1">
              {state?.civilians?.length ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">SHELTERS</div>
            <div className="text-sm font-bold text-slate-400 mt-1">
              {state?.shelters?.length ?? 0}
            </div>
          </div>
        </div>

        {/* Phase 2 Scenario / Events preview */}
        {state?.scenario_id && (
          <div className="mt-3 text-[11px] text-slate-400 font-mono bg-slate-950/50 p-2 rounded border border-slate-800">
            <span className="text-slate-500">Scenario:</span>{" "}
            <span className="text-emerald-400 font-semibold">{state.scenario_id}</span>
            {state.tick_events && state.tick_events.length > 0 && (
              <div className="mt-1 text-slate-300 truncate">
                {state.tick_events[state.tick_events.length - 1]}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Disaster Engine:</span>
        <span className="font-mono text-emerald-400">
          {state?.status === "not_started" ? "Standby" : `${state?.config?.disaster_type?.toUpperCase()} ACTIVE`}
        </span>
      </div>
    </div>
  );
}
