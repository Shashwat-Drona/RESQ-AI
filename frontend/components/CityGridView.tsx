"use client";

import React, { useState } from "react";
import { CityGrid, Coordinate, RouteResponse } from "@/types/api";

interface CityGridViewProps {
  grid: CityGrid | null | undefined;
  route: RouteResponse | null;
  startCoord: Coordinate | null;
  goalCoord: Coordinate | null;
  onSetStart: (coord: Coordinate) => void;
  onSetGoal: (coord: Coordinate) => void;
}

export function CityGridView({
  grid,
  route,
  startCoord,
  goalCoord,
  onSetStart,
  onSetGoal,
}: CityGridViewProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    r: number;
    c: number;
    terrain: string;
    hazard: string;
    water: number;
    debris: number;
    traversable: boolean;
  } | null>(null);

  if (!grid || !grid.cells || grid.cells.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <div className="text-slate-400 text-sm font-medium">City Grid Standby</div>
        <p className="text-xs text-slate-500 mt-1">
          Start a simulation scenario above to generate and inspect the active 2D synthetic city environment.
        </p>
      </div>
    );
  }

  // Pre-calculate path coordinates for fast lookup
  const pathSet = new Set<string>();
  if (route && route.found && route.path) {
    for (const p of route.path) {
      pathSet.add(`${p.row},${p.col}`);
    }
  }

  const isStart = (r: number, c: number) =>
    startCoord?.row === r && startCoord?.col === c;
  const isGoal = (r: number, c: number) =>
    goalCoord?.row === r && goalCoord?.col === c;
  const isPath = (r: number, c: number) => pathSet.has(`${r},${c}`);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono text-sm">05 /</span>
            <h3 className="text-base font-semibold text-slate-100">
              City Grid &amp; Route Visualization
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Live 2D terrain matrix ({grid.rows} × {grid.cols}). Click any cell to select Start or Goal.
          </p>
        </div>

        {/* Hover Tooltip Telemetry */}
        <div className="h-7 text-xs font-mono text-slate-300 flex items-center gap-3">
          {hoveredCell ? (
            <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] flex items-center gap-2">
              <span className="text-emerald-400">({hoveredCell.r}, {hoveredCell.c})</span>
              <span className="text-slate-400 uppercase">{hoveredCell.terrain}</span>
              <span className="text-slate-500">|</span>
              <span className={hoveredCell.hazard === "safe" ? "text-emerald-400" : "text-amber-400"}>
                {hoveredCell.hazard.toUpperCase()}
              </span>
              {hoveredCell.water > 0 && (
                <span className="text-blue-400">🌊 {hoveredCell.water}m</span>
              )}
              {hoveredCell.debris > 0 && (
                <span className="text-amber-500">🧱 {hoveredCell.debris}</span>
              )}
            </div>
          ) : (
            <span className="text-slate-500 text-[11px]">Hover over cell for telemetry</span>
          )}
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="mt-5 overflow-x-auto pb-2 flex justify-center">
        <div
          className="inline-grid gap-1 p-2 rounded-lg bg-slate-950/80 border border-slate-800"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, minmax(18px, 24px))`,
          }}
        >
          {grid.cells.map((row, r) =>
            row.map((cell, c) => {
              const start = isStart(r, c);
              const goal = isGoal(r, c);
              const inPath = isPath(r, c);

              let bgColor = "bg-slate-800/80"; // Default Road
              let borderClass = "border-slate-700/40";
              let content = "";

              // Base Terrain
              if (cell.terrain === "building") {
                bgColor = "bg-slate-950";
                borderClass = "border-slate-900";
                content = "■";
              } else if (cell.terrain === "open_ground") {
                bgColor = "bg-emerald-950/40";
                borderClass = "border-emerald-900/30";
              } else if (cell.terrain === "shelter") {
                bgColor = "bg-cyan-950/80";
                borderClass = "border-cyan-600/70";
                content = "⌂";
              }

              // Dynamic Hazards
              if (cell.hazard === "dangerous") {
                bgColor = "bg-rose-950/80";
                borderClass = "border-rose-700";
              } else if (cell.hazard === "flooded") {
                bgColor = "bg-blue-900/70";
                borderClass = "border-blue-700/60";
              } else if (cell.hazard === "debris_blocked") {
                bgColor = "bg-amber-950/90";
                borderClass = "border-amber-700/70";
                content = "✕";
              }

              // Path Highlight Overlay
              if (start) {
                bgColor = "bg-emerald-500";
                borderClass = "border-white ring-2 ring-emerald-400";
                content = "S";
              } else if (goal) {
                bgColor = "bg-rose-500";
                borderClass = "border-white ring-2 ring-rose-400";
                content = "G";
              } else if (inPath) {
                bgColor = "bg-amber-400 text-slate-950";
                borderClass = "border-amber-200 ring-1 ring-amber-300";
                content = "•";
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onMouseEnter={() =>
                    setHoveredCell({
                      r,
                      c,
                      terrain: cell.terrain,
                      hazard: cell.hazard,
                      water: cell.water_level,
                      debris: cell.debris_severity,
                      traversable: cell.traversable,
                    })
                  }
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => {
                    // Quick click toggle: if no start, set start; else set goal
                    if (!startCoord) {
                      onSetStart(cell.coordinate);
                    } else if (!goalCoord || (startCoord && goalCoord)) {
                      onSetGoal(cell.coordinate);
                    }
                  }}
                  className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded-sm border cursor-pointer transition-all select-none ${bgColor} ${borderClass} hover:ring-2 hover:ring-blue-400`}
                  title={`(${r}, ${c}) ${cell.terrain} | ${cell.hazard} | Traversable: ${cell.traversable}`}
                >
                  {content}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend & Quick Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700"></span>
            <span>Road</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-950 border border-slate-900 text-center text-[8px] leading-3 text-slate-500">■</span>
            <span>Building</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-950/60 border border-emerald-900/50"></span>
            <span>Open Ground</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-cyan-950 border border-cyan-600 text-[8px] text-center leading-3 text-cyan-300">⌂</span>
            <span>Shelter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-900 border border-blue-600"></span>
            <span>Flooded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-950 border border-amber-700 text-[8px] text-center leading-3 text-amber-400">✕</span>
            <span>Debris Blocked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400 border border-white text-slate-950 text-[8px] font-bold text-center leading-3">•</span>
            <span>A* Route Path</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {startCoord && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
              Start: ({startCoord.row}, {startCoord.col})
            </span>
          )}
          {goalCoord && (
            <span className="text-[11px] font-mono text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800">
              Goal: ({goalCoord.row}, {goalCoord.col})
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
