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
    <section className="rounded-2xl glass-panel p-6 space-y-6">
      {/* Header & Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">📊</span>
            <h3 className="text-base font-bold text-slate-900">
              Strategy Evaluation &amp; Baseline Benchmark
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-50 text-amber-700 border border-amber-200 font-bold">
              Benchmark Suite
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empirical comparative analysis evaluating the RESQ-AI Multi-Factor Triage Dispatch against a naive fixed-order Baseline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-mono font-medium">
            Isolated Engine Sandbox
          </span>
        </div>
      </div>

      {/* Methodology & Strategy Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-800 flex items-center gap-1.5">
              <span>🧠</span>
              <span>RESQ-AI Strategy (Multi-Factor Triage)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-bold">
              Intelligent Model
            </span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Continuously computes multi-factor civilian priority scores incorporating triage urgency level (Critical, High, Medium, Low), live health deterioration rates, trapped status, and environmental hazard exposure (flood water level and seismic debris). Dynamically dispatches nearest feasible available agents to highest-acuity patients first.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <span>📋</span>
              <span>Baseline Strategy (Naive FIFO / ID-Ordered)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-300 font-semibold">
              Control Baseline
            </span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Deliberately naive dispatch policy that processes eligible unrescued civilians strictly in alphanumeric ID order (<code className="text-slate-700 font-mono">civ_1, civ_2...</code>). Assigns the nearest reachable responder using standard A* pathfinding. Completely ignores civilian health decay, triage urgency, and hazard risk.
          </p>
        </div>
      </div>

      {/* Benchmark Controls Toolbar */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <label htmlFor="eval-scenario" className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
              Benchmark Scenario
            </label>
            <select
              id="eval-scenario"
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              disabled={isRunning}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 outline-hidden shadow-2xs cursor-pointer"
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
            <label htmlFor="eval-ticks" className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
              Tick Limit per Trial
            </label>
            <select
              id="eval-ticks"
              value={maxTicks}
              onChange={(e) => setMaxTicks(Number(e.target.value))}
              disabled={isRunning}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 outline-hidden shadow-2xs cursor-pointer"
            >
              <option value={15}>15 Ticks (Fast Evaluation)</option>
              <option value={25}>25 Ticks (Standard Trial)</option>
              <option value={35}>35 Ticks (Extended Horizon)</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-medium block">
              Random Seeds
            </span>
            <span className="text-xs font-mono text-slate-600 py-1.5 inline-block font-semibold">
              [42, 101] (Deterministic)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunEvaluation}
          disabled={isRunning}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
            isRunning
              ? "bg-amber-100 text-amber-700 border border-amber-300 cursor-not-allowed opacity-80"
              : "bg-amber-500 hover:bg-amber-600 text-white active:scale-98"
          }`}
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-amber-700 border-t-transparent animate-spin" />
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
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <strong>Evaluation Error:</strong> {errorMsg}
        </div>
      )}

      {/* Benchmark Results */}
      {evaluation && summary && delta && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Metadata Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
            <div className="flex items-center gap-3">
              <span>Benchmark ID: <strong className="text-slate-900">{evaluation.benchmark_id}</strong></span>
              <span>•</span>
              <span>Trials Conducted: <strong className="text-sky-700">{evaluation.trials_count} Paired Runs</strong></span>
            </div>
            <div className="text-slate-400">
              Completed: {new Date(evaluation.timestamp).toLocaleTimeString()}
            </div>
          </div>

          {/* Comparative KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {/* Total Rescued */}
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Civilians Rescued
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-xl font-extrabold font-mono text-sky-700">
                  {summary.ai_summary.total_rescued}
                </span>
                <span className="text-xs text-slate-400">vs</span>
                <span className="text-base font-mono text-slate-500">
                  {summary.baseline_summary.total_rescued}
                </span>
              </div>
              <span
                className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                  delta.rescued_diff > 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : delta.rescued_diff === 0
                    ? "bg-slate-100 text-slate-600"
                    : "bg-rose-50 text-rose-700 border border-rose-300"
                }`}
              >
                {delta.rescued_diff >= 0 ? `+${delta.rescued_diff}` : delta.rescued_diff} Net
              </span>
            </div>

            {/* Critical Civilians Rescued */}
            <div className="p-3.5 rounded-xl glass-card bg-rose-50/30 border-rose-200">
              <span className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">
                Critical Rescued
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-xl font-extrabold font-mono text-rose-600">
                  {summary.ai_summary.critical_rescued}
                </span>
                <span className="text-xs text-slate-400">vs</span>
                <span className="text-base font-mono text-slate-500">
                  {summary.baseline_summary.critical_rescued}
                </span>
              </div>
              <span
                className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                  delta.critical_rescued_diff > 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : delta.critical_rescued_diff === 0
                    ? "bg-slate-100 text-slate-600"
                    : "bg-rose-50 text-rose-700 border border-rose-300"
                }`}
              >
                {delta.critical_rescued_diff >= 0
                  ? `+${delta.critical_rescued_diff}`
                  : delta.critical_rescued_diff}{" "}
                Critical
              </span>
            </div>

            {/* Critical Unrescued / Perished */}
            <div className="p-3.5 rounded-xl glass-card bg-amber-50/30 border-amber-200">
              <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
                Critical Remaining
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-xl font-extrabold font-mono text-amber-600">
                  {summary.ai_summary.critical_unrescued}
                </span>
                <span className="text-xs text-slate-400">vs</span>
                <span className="text-base font-mono text-slate-500">
                  {summary.baseline_summary.critical_unrescued}
                </span>
              </div>
              <span className="mt-1 inline-block text-[10px] text-slate-400">
                In Peril
              </span>
            </div>

            {/* Average Rescue Speed */}
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] uppercase tracking-wider text-sky-700 font-semibold">
                Avg Rescue Tick
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-xl font-extrabold font-mono text-sky-700">
                  {summary.ai_summary.avg_rescue_tick ?? "—"}
                </span>
                <span className="text-xs text-slate-400">vs</span>
                <span className="text-base font-mono text-slate-500">
                  {summary.baseline_summary.avg_rescue_tick ?? "—"}
                </span>
              </div>
              <span className="mt-1 inline-block text-[10px] text-slate-500">
                {delta.avg_rescue_tick_diff !== null
                  ? `${delta.avg_rescue_tick_diff > 0 ? "+" : ""}${delta.avg_rescue_tick_diff} ticks`
                  : "N/A"}
              </span>
            </div>

            {/* Population Health Preservation */}
            <div className="p-3.5 rounded-xl glass-card bg-emerald-50/30 border-emerald-200">
              <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                Mean Final HP
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-xl font-extrabold font-mono text-emerald-700">
                  {summary.ai_summary.avg_final_health}%
                </span>
                <span className="text-xs text-slate-400">vs</span>
                <span className="text-base font-mono text-slate-500">
                  {summary.baseline_summary.avg_final_health}%
                </span>
              </div>
              <span
                className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                  delta.avg_final_health_diff > 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {delta.avg_final_health_diff >= 0
                  ? `+${delta.avg_final_health_diff}%`
                  : `${delta.avg_final_health_diff}%`}
              </span>
            </div>

            {/* Failed Missions */}
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Blocked Missions
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-xl font-extrabold font-mono text-slate-800">
                  {summary.ai_summary.failed_missions}
                </span>
                <span className="text-xs text-slate-400">vs</span>
                <span className="text-base font-mono text-slate-500">
                  {summary.baseline_summary.failed_missions}
                </span>
              </div>
              <span className="mt-1 inline-block text-[10px] text-slate-400">
                Impassable Barriers
              </span>
            </div>
          </div>

          {/* Analytical Conclusion */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-800 font-bold text-xs uppercase tracking-wider font-mono">
                Analytical Conclusion:
              </span>
            </div>
            <p className="text-slate-800 text-xs leading-relaxed font-medium">
              {summary.analytical_conclusion}
            </p>
          </div>

          {/* Side-by-Side Detailed Breakdown Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Evaluation Dimension</th>
                  <th className="py-2.5 px-4 text-sky-700">RESQ-AI Strategy</th>
                  <th className="py-2.5 px-4 text-slate-600">Baseline FIFO</th>
                  <th className="py-2.5 px-4 text-amber-700">Delta ($\Delta$)</th>
                  <th className="py-2.5 px-4">Operational Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                    Total Civilians Rescued
                  </td>
                  <td className="py-2.5 px-4 text-sky-700 font-bold">
                    {summary.ai_summary.total_rescued}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {summary.baseline_summary.total_rescued}
                  </td>
                  <td className="py-2.5 px-4 text-emerald-700 font-bold">
                    {delta.rescued_diff >= 0 ? `+${delta.rescued_diff}` : delta.rescued_diff}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-500 text-[10px]">
                    Net additional survivors evacuated into safe shelter capacity.
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                    Critical Civilians Rescued
                  </td>
                  <td className="py-2.5 px-4 text-rose-600 font-bold">
                    {summary.ai_summary.critical_rescued}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {summary.baseline_summary.critical_rescued}
                  </td>
                  <td className="py-2.5 px-4 text-rose-700 font-bold">
                    {delta.critical_rescued_diff >= 0
                      ? `+${delta.critical_rescued_diff}`
                      : delta.critical_rescued_diff}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-500 text-[10px]">
                    High-acuity, deteriorating victims extracted before health collapse.
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                    Average Rescue Speed (Ticks)
                  </td>
                  <td className="py-2.5 px-4 text-sky-700">
                    {summary.ai_summary.avg_rescue_tick ?? "N/A"}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {summary.baseline_summary.avg_rescue_tick ?? "N/A"}
                  </td>
                  <td className="py-2.5 px-4 text-sky-700 font-bold">
                    {delta.avg_rescue_tick_diff !== null
                      ? `${delta.avg_rescue_tick_diff > 0 ? "+" : ""}${delta.avg_rescue_tick_diff}t`
                      : "—"}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-500 text-[10px]">
                    Average time from dispatch to successful shelter check-in.
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                    Mean Population Health
                  </td>
                  <td className="py-2.5 px-4 text-emerald-700 font-bold">
                    {summary.ai_summary.avg_final_health}%
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {summary.baseline_summary.avg_final_health}%
                  </td>
                  <td className="py-2.5 px-4 text-emerald-700 font-bold">
                    {delta.avg_final_health_diff >= 0
                      ? `+${delta.avg_final_health_diff}%`
                      : `${delta.avg_final_health_diff}%`}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-500 text-[10px]">
                    Average vitality remaining across all civilians at simulation end.
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                    Blocked / Failed Missions
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">
                    {summary.ai_summary.failed_missions}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {summary.baseline_summary.failed_missions}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-medium">
                    {delta.failed_missions_diff >= 0
                      ? `+${delta.failed_missions_diff}`
                      : delta.failed_missions_diff}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-500 text-[10px]">
                    Missions cancelled due to sudden flood or seismic rubble entrapment.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Individual Trials Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800">
              Individual Trial Runs Telemetry ({evaluation.trials.length} Runs)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Scenario</th>
                    <th className="py-2 px-3">Seed</th>
                    <th className="py-2 px-3">Ticks</th>
                    <th className="py-2 px-3 text-sky-700">AI Rescues</th>
                    <th className="py-2 px-3 text-slate-600">Base Rescues</th>
                    <th className="py-2 px-3 text-rose-600">AI Crit Rescued</th>
                    <th className="py-2 px-3 text-slate-600">Base Crit Rescued</th>
                    <th className="py-2 px-3 text-emerald-700">AI Mean HP</th>
                    <th className="py-2 px-3 text-slate-600">Base Mean HP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {evaluation.trials.map((trial, idx) => (
                    <tr key={`${trial.scenario_id}_${trial.seed}_${idx}`} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-sans text-slate-800 font-medium">
                        {trial.scenario_name}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {trial.seed}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {trial.ai_metrics.total_ticks}
                      </td>
                      <td className="py-2 px-3 text-sky-700 font-bold">
                        {trial.ai_metrics.civilians_rescued}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {trial.baseline_metrics.civilians_rescued}
                      </td>
                      <td className="py-2 px-3 text-rose-600 font-bold">
                        {trial.ai_metrics.critical_rescued}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {trial.baseline_metrics.critical_rescued}
                      </td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">
                        {trial.ai_metrics.average_final_health}%
                      </td>
                      <td className="py-2 px-3 text-slate-600">
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
