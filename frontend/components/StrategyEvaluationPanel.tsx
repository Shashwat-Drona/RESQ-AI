"use client";

import React, { useState } from "react";
import {
  EvaluationRequest,
  EvaluationResponse,
  ScenarioInfo,
} from "@/types/api";
import { runEvaluation } from "@/lib/api";

interface StrategyEvaluationPanelProps {
  scenarios: ScenarioInfo[];
  initialEvaluation?: EvaluationResponse | null;
}

export function StrategyEvaluationPanel({
  scenarios,
  initialEvaluation = null,
}: StrategyEvaluationPanelProps) {
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(
    initialEvaluation
  );
  const [selectedScenario, setSelectedScenario] = useState<string>("all");
  const [maxTicks, setMaxTicks] = useState<number>(25);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunEvaluation = async () => {
    setIsRunning(true);
    setErrorMsg(null);

    const payload: EvaluationRequest = {
      scenario_id: selectedScenario === "all" ? null : selectedScenario,
      seeds: [42, 101],
      max_ticks: maxTicks,
    };

    try {
      const result = await runEvaluation(payload);
      setEvaluation(result);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to run strategy benchmark evaluation."
      );
    } finally {
      setIsRunning(false);
    }
  };

  const summary = evaluation?.summary;
  const delta = summary?.delta;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
      {/* Header & Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">📊</span>
            <h3 className="text-base font-semibold text-slate-100">
              Strategy Evaluation &amp; Baseline Benchmark
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/80 text-amber-300 border border-amber-700/80">
              Benchmark Suite
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical comparative analysis evaluating the RESQ-AI Multi-Factor Triage Dispatch against a naive fixed-order Baseline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            Isolated Engine Sandbox
          </span>
        </div>
      </div>

      {/* Methodology & Strategy Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-blue-900/60 bg-blue-950/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-300 flex items-center gap-1.5">
              <span>🧠</span>
              <span>RESQ-AI Strategy (Multi-Factor Triage)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/60">
              Intelligent Model
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Continuously computes multi-factor civilian priority scores incorporating triage urgency level (Critical, High, Medium, Low), live health deterioration rates, trapped status, and environmental hazard exposure (flood water level and seismic debris). Dynamically dispatches nearest feasible available agents to highest-acuity patients first.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>📋</span>
              <span>Baseline Strategy (Naive FIFO / ID-Ordered)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Control Baseline
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Deliberately naive dispatch policy that processes eligible unrescued civilians strictly in alphanumeric ID order (<code className="text-slate-300 font-mono">civ_1, civ_2...</code>). Assigns the nearest reachable responder using standard A* pathfinding. Completely ignores civilian health decay, triage urgency, and hazard risk.
          </p>
        </div>
      </div>

      {/* Benchmark Controls Toolbar */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <label htmlFor="eval-scenario" className="text-[10px] font-mono uppercase text-slate-400 block">
              Benchmark Scenario
            </label>
            <select
              id="eval-scenario"
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              disabled={isRunning}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 outline-hidden"
            >
              <option value="all">Full Standard Suite (All Scenarios)</option>
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name} ({sc.disaster_type})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="eval-ticks" className="text-[10px] font-mono uppercase text-slate-400 block">
              Tick Limit per Trial
            </label>
            <select
              id="eval-ticks"
              value={maxTicks}
              onChange={(e) => setMaxTicks(Number(e.target.value))}
              disabled={isRunning}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 outline-hidden"
            >
              <option value={15}>15 Ticks (Fast Evaluation)</option>
              <option value={25}>25 Ticks (Standard Trial)</option>
              <option value={35}>35 Ticks (Extended Horizon)</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">
              Random Seeds
            </span>
            <span className="text-xs font-mono text-slate-400 py-1.5 inline-block">
              [42, 101] (Deterministic)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunEvaluation}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all shadow-md ${
            isRunning
              ? "bg-amber-950 text-amber-300 border border-amber-800 cursor-not-allowed opacity-80"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold active:scale-98"
          }`}
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span>Executing Benchmark Trials...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Run Empirical Benchmark</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300">
          <strong>Evaluation Error:</strong> {errorMsg}
        </div>
      )}

      {/* Benchmark Results */}
      {evaluation && summary && delta && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Metadata Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span>Benchmark ID: <strong className="text-slate-200">{evaluation.benchmark_id}</strong></span>
              <span>•</span>
              <span>Trials Conducted: <strong className="text-cyan-300">{evaluation.trials_count} Paired Runs</strong></span>
            </div>
            <div className="text-slate-500">
              Completed: {new Date(evaluation.timestamp).toLocaleTimeString()}
            </div>
          </div>

          {/* Comparative KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {/* Total Rescued */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                Civilians Rescued
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-lg font-bold font-mono text-blue-400">
                  {summary.ai_summary.total_rescued}
                </span>
                <span className="text-xs text-slate-500">vs</span>
                <span className="text-base font-mono text-slate-400">
                  {summary.baseline_summary.total_rescued}
                </span>
              </div>
              <span
                className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  delta.rescued_diff > 0
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : delta.rescued_diff === 0
                    ? "bg-slate-800 text-slate-300"
                    : "bg-rose-950 text-rose-300 border border-rose-800"
                }`}
              >
                {delta.rescued_diff >= 0 ? `+${delta.rescued_diff}` : delta.rescued_diff} Net
              </span>
            </div>

            {/* Critical Civilians Rescued */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/40">
              <span className="text-[10px] uppercase tracking-wider text-rose-400">
                Critical Rescued
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-lg font-bold font-mono text-rose-400">
                  {summary.ai_summary.critical_rescued}
                </span>
                <span className="text-xs text-slate-500">vs</span>
                <span className="text-base font-mono text-slate-400">
                  {summary.baseline_summary.critical_rescued}
                </span>
              </div>
              <span
                className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  delta.critical_rescued_diff > 0
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : delta.critical_rescued_diff === 0
                    ? "bg-slate-800 text-slate-300"
                    : "bg-rose-950 text-rose-300 border border-rose-800"
                }`}
              >
                {delta.critical_rescued_diff >= 0
                  ? `+${delta.critical_rescued_diff}`
                  : delta.critical_rescued_diff}{" "}
                Critical
              </span>
            </div>

            {/* Critical Unrescued / Perished */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-900/40">
              <span className="text-[10px] uppercase tracking-wider text-amber-400">
                Critical Remaining
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-lg font-bold font-mono text-amber-400">
                  {summary.ai_summary.critical_unrescued}
                </span>
                <span className="text-xs text-slate-500">vs</span>
                <span className="text-base font-mono text-slate-400">
                  {summary.baseline_summary.critical_unrescued}
                </span>
              </div>
              <span className="mt-1 inline-block text-[10px] text-slate-500">
                In Peril
              </span>
            </div>

            {/* Average Rescue Speed */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-cyan-400">
                Avg Rescue Tick
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-lg font-bold font-mono text-cyan-400">
                  {summary.ai_summary.avg_rescue_tick ?? "—"}
                </span>
                <span className="text-xs text-slate-500">vs</span>
                <span className="text-base font-mono text-slate-400">
                  {summary.baseline_summary.avg_rescue_tick ?? "—"}
                </span>
              </div>
              <span className="mt-1 inline-block text-[10px] text-slate-400">
                {delta.avg_rescue_tick_diff !== null
                  ? `${delta.avg_rescue_tick_diff > 0 ? "+" : ""}${delta.avg_rescue_tick_diff} ticks`
                  : "N/A"}
              </span>
            </div>

            {/* Population Health Preservation */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/40">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400">
                Mean Final HP
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {summary.ai_summary.avg_final_health}%
                </span>
                <span className="text-xs text-slate-500">vs</span>
                <span className="text-base font-mono text-slate-400">
                  {summary.baseline_summary.avg_final_health}%
                </span>
              </div>
              <span
                className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  delta.avg_final_health_diff > 0
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {delta.avg_final_health_diff >= 0
                  ? `+${delta.avg_final_health_diff}%`
                  : `${delta.avg_final_health_diff}%`}
              </span>
            </div>

            {/* Failed Missions */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                Blocked Missions
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-lg font-bold font-mono text-slate-200">
                  {summary.ai_summary.failed_missions}
                </span>
                <span className="text-xs text-slate-500">vs</span>
                <span className="text-base font-mono text-slate-400">
                  {summary.baseline_summary.failed_missions}
                </span>
              </div>
              <span className="mt-1 inline-block text-[10px] text-slate-500">
                Impassable Barriers
              </span>
            </div>
          </div>

          {/* Analytical Conclusion */}
          <div className="p-4 rounded-xl border border-amber-900/60 bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                Analytical Conclusion:
              </span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              {summary.analytical_conclusion}
            </p>
          </div>

          {/* Side-by-Side Detailed Breakdown Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Evaluation Dimension</th>
                  <th className="py-2.5 px-4 text-blue-300">RESQ-AI Strategy</th>
                  <th className="py-2.5 px-4 text-slate-400">Baseline FIFO</th>
                  <th className="py-2.5 px-4 text-amber-300">Delta ($\Delta$)</th>
                  <th className="py-2.5 px-4">Operational Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                    Total Civilians Rescued
                  </td>
                  <td className="py-2.5 px-4 text-blue-400 font-bold">
                    {summary.ai_summary.total_rescued}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {summary.baseline_summary.total_rescued}
                  </td>
                  <td className="py-2.5 px-4 text-emerald-400 font-bold">
                    {delta.rescued_diff >= 0 ? `+${delta.rescued_diff}` : delta.rescued_diff}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[10px]">
                    Net additional survivors evacuated into safe shelter capacity.
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                    Critical Civilians Rescued
                  </td>
                  <td className="py-2.5 px-4 text-rose-400 font-bold">
                    {summary.ai_summary.critical_rescued}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {summary.baseline_summary.critical_rescued}
                  </td>
                  <td className="py-2.5 px-4 text-rose-300 font-bold">
                    {delta.critical_rescued_diff >= 0
                      ? `+${delta.critical_rescued_diff}`
                      : delta.critical_rescued_diff}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[10px]">
                    High-acuity, deteriorating victims extracted before health collapse.
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                    Average Rescue Speed (Ticks)
                  </td>
                  <td className="py-2.5 px-4 text-cyan-300">
                    {summary.ai_summary.avg_rescue_tick ?? "N/A"}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {summary.baseline_summary.avg_rescue_tick ?? "N/A"}
                  </td>
                  <td className="py-2.5 px-4 text-cyan-400">
                    {delta.avg_rescue_tick_diff !== null
                      ? `${delta.avg_rescue_tick_diff > 0 ? "+" : ""}${delta.avg_rescue_tick_diff}t`
                      : "—"}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[10px]">
                    Average time from dispatch to successful shelter check-in.
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                    Mean Population Health
                  </td>
                  <td className="py-2.5 px-4 text-emerald-400 font-bold">
                    {summary.ai_summary.avg_final_health}%
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {summary.baseline_summary.avg_final_health}%
                  </td>
                  <td className="py-2.5 px-4 text-emerald-300 font-bold">
                    {delta.avg_final_health_diff >= 0
                      ? `+${delta.avg_final_health_diff}%`
                      : `${delta.avg_final_health_diff}%`}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[10px]">
                    Average vitality remaining across all civilians at simulation end.
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                    Blocked / Failed Missions
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {summary.ai_summary.failed_missions}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {summary.baseline_summary.failed_missions}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {delta.failed_missions_diff >= 0
                      ? `+${delta.failed_missions_diff}`
                      : delta.failed_missions_diff}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[10px]">
                    Missions cancelled due to sudden flood or seismic rubble entrapment.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Individual Trials Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-200">
              Individual Trial Runs Telemetry ({evaluation.trials.length} Runs)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/60 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Scenario</th>
                    <th className="py-2 px-3">Seed</th>
                    <th className="py-2 px-3">Ticks</th>
                    <th className="py-2 px-3 text-blue-300">AI Rescues</th>
                    <th className="py-2 px-3 text-slate-400">Base Rescues</th>
                    <th className="py-2 px-3 text-rose-300">AI Crit Rescued</th>
                    <th className="py-2 px-3 text-slate-400">Base Crit Rescued</th>
                    <th className="py-2 px-3 text-emerald-300">AI Mean HP</th>
                    <th className="py-2 px-3 text-slate-400">Base Mean HP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                  {evaluation.trials.map((trial, idx) => (
                    <tr key={`${trial.scenario_id}_${trial.seed}_${idx}`} className="hover:bg-slate-900/30">
                      <td className="py-2 px-3 font-sans text-slate-300">
                        {trial.scenario_name}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {trial.seed}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {trial.ai_metrics.total_ticks}
                      </td>
                      <td className="py-2 px-3 text-blue-400 font-bold">
                        {trial.ai_metrics.civilians_rescued}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {trial.baseline_metrics.civilians_rescued}
                      </td>
                      <td className="py-2 px-3 text-rose-400">
                        {trial.ai_metrics.critical_rescued}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {trial.baseline_metrics.critical_rescued}
                      </td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">
                        {trial.ai_metrics.average_final_health}%
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {trial.baseline_metrics.average_final_health}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
