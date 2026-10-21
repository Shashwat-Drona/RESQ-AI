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
    <div className="rounded-xl border border-slate-200 bg-white/95 shadow-xs p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-sm">⏱️</span>
            <h2 className="text-base font-semibold text-slate-900">
              Simulation Engine State
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-700 text-xs font-mono font-semibold">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            {isLoading ? "Checking..." : status}
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono font-medium">ENGINE STATUS</span>
            <span className="text-xs font-mono font-bold text-amber-600 uppercase">
              {isIdle ? "STANDBY (PHASE 1)" : status}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-normal">
            {isLoading
              ? "Retrieving engine state..."
              : state?.message ||
                "Simulation engine is initialized in standby. No active simulation session is running."}
          </p>
        </div>

        {/* Telemetry Metrics */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center font-mono">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 font-medium">TICK</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {state?.current_tick ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 font-medium">INCIDENTS</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {state?.active_incidents ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 font-medium">CIVILIANS</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {state?.civilians?.length ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 font-medium">SHELTERS</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {state?.shelters?.length ?? 0}
            </div>
          </div>
        </div>

        {/* Phase 2 Scenario / Events preview */}
        {state?.scenario_id && (
          <div className="mt-3 text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-500">Scenario:</span>{" "}
            <span className="text-emerald-700 font-bold">{state.scenario_id}</span>
            {state.tick_events && state.tick_events.length > 0 && (
              <div className="mt-1 text-slate-700 truncate">
                {state.tick_events[state.tick_events.length - 1]}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Disaster Engine:</span>
        <span className="font-mono text-emerald-700 font-semibold">
          {state?.status === "not_started" ? "Standby" : `${state?.config?.disaster_type?.toUpperCase()} ACTIVE`}
        </span>
      </div>
    </div>
  );
}
