import React, { useState } from "react";
import { SimulationConfig } from "@/types/api";
import { validateConfig } from "@/lib/api";

interface ConfigCardProps {
  config: SimulationConfig | null;
  isLoading: boolean;
}

export function ConfigCard({ config, isLoading }: ConfigCardProps) {
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const handleTestValidate = async (invalid: boolean) => {
    setIsTesting(true);
    setValidationResult(null);
    try {
      const payload: SimulationConfig = {
        grid_rows: invalid ? 2 : 20, // 2 triggers Pydantic min validation error (< 5)
        grid_cols: 20,
        max_agents: 5,
        disaster_type: "flood",
        tick_interval_seconds: 1.0,
      };

      const result = await validateConfig(payload);
      setValidationResult(
        `✓ Validated: Accepted ${result.grid_rows}x${result.grid_cols} grid, ${result.max_agents} agents.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setValidationResult(`✗ Rejected by Backend: ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-sm">03 /</span>
            <h2 className="text-base font-semibold text-slate-100">
              Default Simulation Parameters
            </h2>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            {isLoading ? "Fetching..." : "Validated"}
          </span>
        </div>

        {/* Configuration Parameter Badges */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">
              Grid Dimensions
            </span>
            <div className="mt-1 font-mono font-semibold text-slate-200">
              {config ? `${config.grid_rows} × ${config.grid_cols}` : "20 × 20"}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Rows × Columns (Min 5x5)</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">
              Agent Capacity
            </span>
            <div className="mt-1 font-mono font-semibold text-slate-200">
              {config?.max_agents ?? 5} max units
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Concurrent responders</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">
              Primary Scenario
            </span>
            <div className="mt-1 font-mono font-semibold text-emerald-400 uppercase">
              {config?.disaster_type ?? "flood"}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Default hazard type</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">
              Tick Interval
            </span>
            <div className="mt-1 font-mono font-semibold text-slate-200">
              {config ? `${config.tick_interval_seconds}s` : "1.0s"}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Step duration</div>
          </div>
        </div>

        {/* Live Contract Validation Tester */}
        <div className="mt-5 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-300 block mb-1">
            Live Contract Validation Tester
          </span>
          <p className="text-[11px] text-slate-400 mb-3">
            Test backend Pydantic validation rules over HTTP:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTestValidate(false)}
              disabled={isTesting}
              className="px-2.5 py-1 text-xs font-medium rounded bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 transition-colors disabled:opacity-50"
            >
              {isTesting ? "Testing..." : "Test Valid Config (20x20)"}
            </button>
            <button
              onClick={() => handleTestValidate(true)}
              disabled={isTesting}
              className="px-2.5 py-1 text-xs font-medium rounded bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition-colors disabled:opacity-50"
            >
              {isTesting ? "Testing..." : "Test Invalid Config (2x20 Grid)"}
            </button>
          </div>

          {validationResult && (
            <div
              className={`mt-2.5 p-2 rounded text-[11px] font-mono break-words border ${
                validationResult.startsWith("✓")
                  ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                  : "bg-rose-950/40 border-rose-800/50 text-rose-300"
              }`}
            >
              {validationResult}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Contract Source:</span>
        <span className="font-mono text-slate-300">/api/v1/config</span>
      </div>
    </div>
  );
}
