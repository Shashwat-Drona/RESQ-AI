"use client";

import React, { useState } from "react";
import { Coordinate, MovementProfile, RouteRequest, RouteResponse } from "@/types/api";
import { planRoute } from "@/lib/api";

interface RoutePlannerProps {
  gridRows?: number;
  gridCols?: number;
  startCoord: Coordinate;
  goalCoord: Coordinate;
  onSetStart: (coord: Coordinate) => void;
  onSetGoal: (coord: Coordinate) => void;
  onRouteCalculated: (route: RouteResponse | null) => void;
  currentRoute: RouteResponse | null;
  isSimulationActive: boolean;
}

export function RoutePlanner({
  gridRows = 20,
  gridCols = 20,
  startCoord,
  goalCoord,
  onSetStart,
  onSetGoal,
  onRouteCalculated,
  currentRoute,
  isSimulationActive,
}: RoutePlannerProps) {
  const [profile, setProfile] = useState<MovementProfile>("ground_responder");
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPathList, setShowPathList] = useState<boolean>(false);

  const handleCalculateRoute = async () => {
    if (!isSimulationActive) {
      setError("Please start or initialize a simulation scenario first.");
      return;
    }

    setIsPlanning(true);
    setError(null);

    const payload: RouteRequest = {
      start: { row: Number(startCoord.row), col: Number(startCoord.col) },
      goal: { row: Number(goalCoord.row), col: Number(goalCoord.col) },
      movement_profile: profile,
    };

    try {
      const res = await planRoute(payload);
      onRouteCalculated(res);
      if (!res.found && res.reason) {
        setError(`Route not found: ${res.reason}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to calculate A* route.";
      setError(msg);
      onRouteCalculated(null);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleClearRoute = () => {
    onRouteCalculated(null);
    setError(null);
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-mono text-sm">08 /</span>
            <h3 className="text-base font-semibold text-slate-100">
              A* Dynamic Route Planner
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hazard-aware Manhattan 4-directional A* routing with live environmental replanning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
              isSimulationActive
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {isSimulationActive ? "Grid Ready" : "Simulation Inactive"}
          </span>
        </div>
      </div>

      {/* Input Controls */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Start Point */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Start Coordinate
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Row (0..{gridRows - 1})</span>
              <input
                type="number"
                min={0}
                max={gridRows - 1}
                value={startCoord.row}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onSetStart({ row: val, col: startCoord.col });
                }}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Col (0..{gridCols - 1})</span>
              <input
                type="number"
                min={0}
                max={gridCols - 1}
                value={startCoord.col}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onSetStart({ row: startCoord.row, col: val });
                }}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Goal Point */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Goal Coordinate
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Row (0..{gridRows - 1})</span>
              <input
                type="number"
                min={0}
                max={gridRows - 1}
                value={goalCoord.row}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onSetGoal({ row: val, col: goalCoord.col });
                }}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Col (0..{gridCols - 1})</span>
              <input
                type="number"
                min={0}
                max={gridCols - 1}
                value={goalCoord.col}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onSetGoal({ row: goalCoord.row, col: val });
                }}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Movement Profile & Actions */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300">
            Movement Profile
          </label>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value as MovementProfile)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans focus:border-blue-500 focus:outline-none"
          >
            <option value="ground_responder">Ground Responder (Vehicle)</option>
            <option value="on_foot">On Foot (Pedestrian)</option>
          </select>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCalculateRoute}
              disabled={isPlanning || !isSimulationActive}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isPlanning ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <span>Calculate Route</span>
                </>
              )}
            </button>
            {currentRoute && (
              <button
                onClick={handleClearRoute}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                title="Clear route from map"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error / Alert banner */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <span className="font-bold">Notice:</span>
          <span>{error}</span>
        </div>
      )}

      {/* Telemetry Result Summary */}
      {currentRoute && (
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400">STATUS</div>
              <div className="mt-1 font-semibold">
                {currentRoute.found ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Route Found
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    Unreachable
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400">PATH LENGTH</div>
              <div className="mt-1 font-mono text-cyan-400 font-semibold text-sm">
                {currentRoute.path_length} <span className="text-[10px] text-slate-500">steps</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400">TOTAL COST</div>
              <div className="mt-1 font-mono text-amber-400 font-semibold text-sm">
                {currentRoute.total_cost.toFixed(2)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400">EXPANDED NODES</div>
              <div className="mt-1 font-mono text-purple-400 font-semibold text-sm">
                {currentRoute.expanded_nodes}
              </div>
            </div>
          </div>

          {/* Coordinate inspection */}
          {currentRoute.found && currentRoute.path.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowPathList(!showPathList)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline font-mono cursor-pointer"
              >
                {showPathList ? "Hide Path Coordinates" : `Inspect Ordered Coordinates (${currentRoute.path.length} points)`}
              </button>
              {showPathList && (
                <div className="mt-2 p-2.5 rounded bg-slate-950 border border-slate-800 max-h-32 overflow-y-auto font-mono text-[11px] text-slate-300 flex flex-wrap gap-1.5">
                  {currentRoute.path.map((pt, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
                    >
                      {idx === 0
                        ? `S:(${pt.row},${pt.col})`
                        : idx === currentRoute.path.length - 1
                        ? `G:(${pt.row},${pt.col})`
                        : `(${pt.row},${pt.col})`}
                      {idx < currentRoute.path.length - 1 && " →"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
