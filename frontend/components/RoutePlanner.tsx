"use client";

import React, { useState } from "react";
import { planRoute } from "@/lib/api";
import { Coordinate, MovementProfile, RouteResponse } from "@/types/api";

interface RoutePlannerProps {
  gridRows: number;
  gridCols: number;
  startCoord: Coordinate;
  goalCoord: Coordinate;
  onSetStart: (coord: Coordinate) => void;
  onSetGoal: (coord: Coordinate) => void;
  onRouteCalculated: (route: RouteResponse | null) => void;
  currentRoute?: RouteResponse | null;
  isSimulationActive: boolean;
}

export function RoutePlanner({
  gridRows,
  gridCols,
  startCoord,
  goalCoord,
  onSetStart,
  onSetGoal,
  onRouteCalculated,
  currentRoute: propCurrentRoute,
  isSimulationActive,
}: RoutePlannerProps) {
  const [profile, setProfile] = useState<MovementProfile>("ground_responder");
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localRoute, setLocalRoute] = useState<RouteResponse | null>(null);
  const [showPathList, setShowPathList] = useState(false);

  const currentRoute = propCurrentRoute !== undefined ? propCurrentRoute : localRoute;

  const handleCalculateRoute = async () => {
    if (!isSimulationActive) {
      setError("Please start or load a simulation before calculating paths.");
      return;
    }

    setIsPlanning(true);
    setError(null);

    try {
      const response = await planRoute({
        start: startCoord,
        goal: goalCoord,
        movement_profile: profile,
      });

      setLocalRoute(response);
      onRouteCalculated(response);

      if (!response.found) {
        setError("No traversable route found. The goal may be impassable or isolated by hazards.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Route planning failed.";
      setError(msg);
      setLocalRoute(null);
      onRouteCalculated(null);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleClearRoute = () => {
    setLocalRoute(null);
    onRouteCalculated(null);
    setError(null);
  };

  return (
    <section className="rounded-2xl glass-panel p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🧭</span>
            <h3 className="text-base font-bold text-slate-900">
              A* Dynamic Route Planner
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hazard-aware Manhattan 4-directional A* routing with live environmental replanning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isSimulationActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-slate-100 text-slate-500 border-slate-200"
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
          <label className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Start Coordinate
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono">Row (0..{gridRows - 1})</span>
              <input
                type="number"
                min={0}
                max={gridRows - 1}
                value={startCoord.row}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onSetStart({ row: val, col: startCoord.col });
                }}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-sky-500 focus:outline-hidden shadow-2xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono">Col (0..{gridCols - 1})</span>
              <input
                type="number"
                min={0}
                max={gridCols - 1}
                value={startCoord.col}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onSetStart({ row: startCoord.row, col: val });
                }}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-sky-500 focus:outline-hidden shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Goal Point */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Goal Coordinate
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono">Row (0..{gridRows - 1})</span>
              <input
                type="number"
                min={0}
                max={gridRows - 1}
                value={goalCoord.row}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onSetGoal({ row: val, col: goalCoord.col });
                }}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-sky-500 focus:outline-hidden shadow-2xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono">Col (0..{gridCols - 1})</span>
              <input
                type="number"
                min={0}
                max={gridCols - 1}
                value={goalCoord.col}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onSetGoal({ row: goalCoord.row, col: val });
                }}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-sky-500 focus:outline-hidden shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Movement Profile & Actions */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700">
            Movement Profile
          </label>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value as MovementProfile)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-sans focus:border-sky-500 focus:outline-hidden shadow-2xs cursor-pointer"
          >
            <option value="ground_responder">Ground Responder (Vehicle)</option>
            <option value="on_foot">On Foot (Pedestrian)</option>
          </select>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCalculateRoute}
              disabled={isPlanning || !isSimulationActive}
              className="flex-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-300 cursor-pointer shadow-2xs"
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
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <span className="font-bold">Notice:</span>
          <span>{error}</span>
        </div>
      )}

      {/* Telemetry Result Summary */}
      {currentRoute && (
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl glass-card">
              <div className="text-[10px] text-slate-500 font-semibold">STATUS</div>
              <div className="mt-1 font-bold">
                {currentRoute.found ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Route Found
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Unreachable
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-card">
              <div className="text-[10px] text-slate-500 font-semibold">PATH LENGTH</div>
              <div className="mt-1 font-mono text-sky-700 font-bold text-sm">
                {currentRoute.path_length} <span className="text-[10px] text-slate-500 font-normal">steps</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-card">
              <div className="text-[10px] text-slate-500 font-semibold">TOTAL COST</div>
              <div className="mt-1 font-mono text-amber-700 font-bold text-sm">
                {currentRoute.total_cost.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-card">
              <div className="text-[10px] text-slate-500 font-semibold">EXPANDED NODES</div>
              <div className="mt-1 font-mono text-purple-700 font-bold text-sm">
                {currentRoute.expanded_nodes}
              </div>
            </div>
          </div>

          {/* Coordinate inspection */}
          {currentRoute.found && currentRoute.path.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowPathList(!showPathList)}
                className="text-[11px] text-sky-700 hover:text-sky-900 underline font-mono cursor-pointer font-medium"
              >
                {showPathList ? "Hide Path Coordinates" : `Inspect Ordered Coordinates (${currentRoute.path.length} points)`}
              </button>
              {showPathList && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-32 overflow-y-auto font-mono text-[11px] text-slate-700 flex flex-wrap gap-1.5">
                  {currentRoute.path.map((pt, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded-md bg-white border border-slate-300 shadow-2xs"
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
