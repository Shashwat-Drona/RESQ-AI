"use client";

import React, { useState } from "react";
import {
  CityGrid,
  Civilian,
  Coordinate,
  RescueAgent,
  RouteResponse,
} from "@/types/api";

interface CityGridViewProps {
  grid: CityGrid | null | undefined;
  route: RouteResponse | null;
  startCoord: Coordinate | null;
  goalCoord: Coordinate | null;
  highlightCoord?: Coordinate | null;
  agents?: RescueAgent[];
  civilians?: Civilian[];
  selectedAgentId?: string | null;
  selectedCivilianId?: string | null;
  onSelectAgent?: (agentId: string) => void;
  onSelectCivilian?: (civId: string) => void;
  onSetStart: (coord: Coordinate) => void;
  onSetGoal: (coord: Coordinate) => void;
}

export function CityGridView({
  grid,
  route,
  startCoord,
  goalCoord,
  highlightCoord,
  agents = [],
  civilians = [],
  selectedAgentId,
  selectedCivilianId,
  onSelectAgent,
  onSelectCivilian,
  onSetStart,
  onSetGoal,
}: CityGridViewProps) {
  const [selectedCellCoord, setSelectedCellCoord] = useState<Coordinate | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    r: number;
    c: number;
    terrain: string;
    hazard: string;
    water: number;
    debris: number;
    traversable: boolean;
    agent?: RescueAgent;
    civilian?: Civilian;
  } | null>(null);

  if (!grid || !grid.cells || grid.cells.length === 0) {
    return (
      <div className="rounded-2xl glass-panel p-12 text-center">
        <div className="text-3xl mb-2">🗺️</div>
        <div className="text-slate-800 text-sm font-bold">City Grid Standby</div>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Start a simulation scenario above to generate the synthetic 2D city environment, deploy responders, and view real-time flood/seismic hazards.
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

  // Selected agent route path
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const agentPathSet = new Set<string>();
  if (selectedAgent && selectedAgent.active_path) {
    for (const p of selectedAgent.active_path) {
      agentPathSet.add(`${p.row},${p.col}`);
    }
  }

  // Lookup maps
  const agentMap = new Map<string, RescueAgent>();
  for (const a of agents) {
    agentMap.set(`${a.coordinate.row},${a.coordinate.col}`, a);
  }

  const civilianMap = new Map<string, Civilian>();
  for (const c of civilians) {
    if (c.status !== "rescued" && c.status !== "in_transit") {
      civilianMap.set(`${c.coordinate.row},${c.coordinate.col}`, c);
    }
  }

  const isStart = (r: number, c: number) =>
    startCoord?.row === r && startCoord?.col === c;
  const isGoal = (r: number, c: number) =>
    goalCoord?.row === r && goalCoord?.col === c;
  const isPath = (r: number, c: number) => pathSet.has(`${r},${c}`);
  const isAgentPath = (r: number, c: number) => agentPathSet.has(`${r},${c}`);

  // Entity at selected cell for Inspector
  const selectedCivFromId = selectedCivilianId
    ? civilians.find((c) => c.id === selectedCivilianId)
    : null;
  const civilianHighlight = highlightCoord || selectedCivFromId?.coordinate || null;

  const activeInspectCoord = selectedCellCoord || civilianHighlight || (selectedAgent ? selectedAgent.coordinate : null);
  const inspectCell = activeInspectCoord && grid.cells[activeInspectCoord.row]
    ? grid.cells[activeInspectCoord.row][activeInspectCoord.col]
    : null;
  const inspectAgent = activeInspectCoord
    ? agentMap.get(`${activeInspectCoord.row},${activeInspectCoord.col}`)
    : null;
  const inspectCivilian = activeInspectCoord
    ? civilianMap.get(`${activeInspectCoord.row},${activeInspectCoord.col}`)
    : null;

  return (
    <section className="rounded-2xl glass-panel p-5 relative overflow-hidden">
      {/* Header & Quick Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(2,132,199,0.8)]" />
            <h2 className="text-sm font-bold text-slate-900 tracking-wide">
              TACTICAL CITY GRID &amp; INCIDENT MAP
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-sky-50 text-sky-700 border border-sky-200 font-bold">
              {grid.rows} × {grid.cols} Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any responder, civilian, or cell to inspect telemetry, hazards, and autonomous waypoints.
          </p>
        </div>

        {/* Live Hover Telemetry Bar */}
        <div className="h-7 text-xs font-mono text-slate-700 flex items-center gap-2">
          {hoveredCell ? (
            <div className="px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs text-[11px] flex items-center gap-2 flex-wrap">
              <span className="text-sky-700 font-bold">
                ({hoveredCell.r}, {hoveredCell.c})
              </span>
              <span className="text-slate-600 uppercase font-medium">
                {hoveredCell.terrain}
              </span>
              <span className="text-slate-300">|</span>
              <span
                className={
                  hoveredCell.hazard === "safe"
                    ? "text-emerald-600 font-bold"
                    : hoveredCell.hazard === "dangerous"
                    ? "text-rose-600 font-bold"
                    : "text-amber-600 font-bold"
                }
              >
                {hoveredCell.hazard.toUpperCase()}
              </span>
              {hoveredCell.water > 0 && (
                <span className="text-blue-600">🌊 {hoveredCell.water.toFixed(1)}m</span>
              )}
              {hoveredCell.debris > 0 && (
                <span className="text-amber-600">🧱 {hoveredCell.debris.toFixed(1)}</span>
              )}
              {hoveredCell.agent && (
                <span className="text-sky-700 font-bold">
                  [{hoveredCell.agent.name}]
                </span>
              )}
              {hoveredCell.civilian && (
                <span className="text-rose-600 font-bold">
                  [{hoveredCell.civilian.id} • {hoveredCell.civilian.urgency}]
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-[11px] font-mono hidden sm:inline">
              Hover over grid cell for instant sensor telemetry
            </span>
          )}
        </div>
      </div>

      {/* Grid Canvas & Detail Inspector Layout */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Grid View */}
        <div className="lg:col-span-9 overflow-x-auto pb-2 flex justify-center bg-slate-100/80 p-4 rounded-2xl border border-slate-200 shadow-inner">
          <div
            className="inline-grid gap-1 p-2 rounded-xl bg-slate-200/90 border border-slate-300 shadow-md"
            style={{
              gridTemplateColumns: `repeat(${grid.cols}, minmax(20px, 26px))`,
            }}
          >
            {grid.cells.map((row, r) =>
              row.map((cell, c) => {
                const coordKey = `${r},${c}`;
                const start = isStart(r, c);
                const goal = isGoal(r, c);
                const inPath = isPath(r, c);
                const inAgentRoute = isAgentPath(r, c);
                const agentAtCell = agentMap.get(coordKey);
                const civAtCell = civilianMap.get(coordKey);
                const isSelectedCell =
                  selectedCellCoord?.row === r && selectedCellCoord?.col === c;
                const isHighlightedCiv =
                  (civilianHighlight?.row === r && civilianHighlight?.col === c) ||
                  (Boolean(selectedCivilianId) && civAtCell?.id === selectedCivilianId);

                let bgColor = "bg-white"; // High-contrast Light Road
                let borderClass = "border-slate-300";
                let content: React.ReactNode = "";

                // 1. Terrain classification
                if (cell.terrain === "building") {
                  bgColor = "bg-slate-700";
                  borderClass = "border-slate-800";
                  content = <span className="text-slate-400 text-[8px]">■</span>;
                } else if (cell.terrain === "open_ground") {
                  bgColor = "bg-emerald-50";
                  borderClass = "border-emerald-200";
                } else if (cell.terrain === "shelter") {
                  bgColor = "bg-sky-100";
                  borderClass = "border-sky-400 ring-1 ring-sky-300 shadow-xs";
                  content = <span className="text-sky-700 font-bold text-xs">⌂</span>;
                }

                // 2. Hazard overlay
                if (cell.hazard === "dangerous") {
                  bgColor = "bg-rose-100";
                  borderClass = "border-rose-400 shadow-xs";
                } else if (cell.hazard === "flooded") {
                  bgColor = "bg-blue-100";
                  borderClass = "border-blue-400 shadow-xs";
                } else if (cell.hazard === "debris_blocked") {
                  bgColor = "bg-amber-100";
                  borderClass = "border-amber-400 shadow-xs";
                  content = <span className="text-amber-700 text-[9px] font-bold">✕</span>;
                }

                // 3. Path Overlays (Route Planner or Agent Autonomous Waypoint)
                if (start) {
                  bgColor = "bg-emerald-500";
                  borderClass = "border-white ring-2 ring-emerald-600 shadow-sm z-10";
                  content = <span className="text-white font-black text-[10px]">S</span>;
                } else if (goal) {
                  bgColor = "bg-rose-500";
                  borderClass = "border-white ring-2 ring-rose-600 shadow-sm z-10";
                  content = <span className="text-white font-black text-[10px]">G</span>;
                } else if (inPath) {
                  bgColor = "bg-amber-300";
                  borderClass = "border-amber-500 ring-1 ring-amber-400";
                  content = <span className="text-amber-900 font-bold text-[9px]">•</span>;
                } else if (inAgentRoute) {
                  bgColor = "bg-sky-100";
                  borderClass = "border-sky-500 ring-1 ring-sky-400";
                  content = <span className="text-sky-700 font-mono text-[9px] font-bold">◦</span>;
                } else if (isHighlightedCiv) {
                  borderClass = "border-purple-500 ring-2 ring-purple-500 ring-offset-1 ring-offset-white shadow-md z-10";
                }

                // 4. Civilian Marker
                if (civAtCell && !agentAtCell) {
                  if (civAtCell.status === "trapped") {
                    content = <span className="text-xs" title={`Trapped: ${civAtCell.id}`}>⚠️</span>;
                  } else if (civAtCell.status === "injured") {
                    content = <span className="text-xs" title={`Injured: ${civAtCell.id}`}>🩹</span>;
                  } else {
                    content = <span className="text-xs" title={`Waiting: ${civAtCell.id}`}>👤</span>;
                  }
                }

                // 5. Agent Marker (Overlays on top)
                if (agentAtCell) {
                  const isAgentSelected = selectedAgentId === agentAtCell.id;
                  const agentIcon = agentAtCell.type === "ground_responder" ? "🚑" : "🏃";

                  let statusHalo = "ring-2 ring-emerald-500 shadow-xs";
                  if (agentAtCell.status === "en_route") {
                    statusHalo = "ring-2 ring-sky-500 animate-pulse shadow-xs";
                  } else if (agentAtCell.status === "rescuing") {
                    statusHalo = "ring-2 ring-amber-500 shadow-xs";
                  } else if (agentAtCell.status === "transporting") {
                    statusHalo = "ring-2 ring-purple-500 shadow-xs";
                  } else if (agentAtCell.status === "unavailable") {
                    statusHalo = "ring-2 ring-rose-500 shadow-xs";
                  }

                  if (isAgentSelected) {
                    statusHalo = "ring-2 ring-sky-600 ring-offset-1 ring-offset-white scale-110 z-20 shadow-md";
                  }

                  borderClass = statusHalo;

                  content = (
                    <span
                      className="text-[11px] leading-none drop-shadow flex items-center justify-center relative bg-white/90 rounded-full p-0.5"
                      title={`${agentAtCell.name} (${agentAtCell.status})${
                        agentAtCell.carrying_civilian_id ? ` Carrying ${agentAtCell.carrying_civilian_id}` : ""
                      }`}
                    >
                      {agentIcon}
                      {agentAtCell.carrying_civilian_id && (
                        <span className="absolute -top-1.5 -right-1.5 text-[7px] bg-purple-600 rounded-full w-2.5 h-2.5 flex items-center justify-center text-white font-mono font-bold shadow">
                          +
                        </span>
                      )}
                    </span>
                  );
                }

                if (isSelectedCell) {
                  borderClass += " ring-2 ring-blue-600 ring-offset-1 ring-offset-white z-20 shadow-sm";
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
                        agent: agentAtCell,
                        civilian: civAtCell,
                      })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => {
                      setSelectedCellCoord(cell.coordinate);
                      if (agentAtCell && onSelectAgent) {
                        onSelectAgent(agentAtCell.id);
                      } else if (civAtCell && onSelectCivilian) {
                        onSelectCivilian(civAtCell.id);
                      }
                    }}
                    className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded-sm border cursor-pointer transition-all select-none relative ${bgColor} ${borderClass} hover:ring-2 hover:ring-sky-500 hover:scale-105`}
                    title={`(${r}, ${c}) ${cell.terrain} | ${cell.hazard}`}
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tactical Entity & Cell Inspector Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl glass-card text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Tactical Inspector</span>
              </span>
              {inspectCell && (
                <span className="font-mono text-sky-700 font-bold text-xs bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  ({inspectCell.coordinate.row}, {inspectCell.coordinate.col})
                </span>
              )}
            </div>

            {inspectCell ? (
              <div className="mt-3 space-y-2.5">
                {/* Terrain & Hazard Info */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-mono">Terrain</span>
                    <div className="font-bold text-slate-800 uppercase mt-0.5">
                      {inspectCell.terrain}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-mono">Hazard</span>
                    <div
                      className={`font-bold uppercase mt-0.5 ${
                        inspectCell.hazard === "safe"
                          ? "text-emerald-600"
                          : inspectCell.hazard === "dangerous"
                          ? "text-rose-600"
                          : "text-amber-600"
                      }`}
                    >
                      {inspectCell.hazard}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-mono">Water Depth</span>
                    <div className="font-mono text-blue-600 font-bold mt-0.5">
                      {inspectCell.water_level.toFixed(2)}m
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-mono">Debris Index</span>
                    <div className="font-mono text-amber-600 font-bold mt-0.5">
                      {inspectCell.debris_severity.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Resident Agent Details */}
                {inspectAgent && (
                  <div className="mt-2 p-3 rounded-xl bg-sky-50 border border-sky-200 shadow-2xs">
                    <div className="flex items-center justify-between text-sky-800 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span>🚑</span>
                        <span>{inspectAgent.name}</span>
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white border border-sky-300 text-sky-700">
                        {inspectAgent.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-700 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Type:</span>
                        <span className="font-bold">{inspectAgent.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Completed:</span>
                        <span className="text-emerald-700 font-bold">{inspectAgent.completed_rescues} lives</span>
                      </div>
                      {inspectAgent.target_civilian_id && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Target:</span>
                          <span className="text-amber-700 font-bold">{inspectAgent.target_civilian_id}</span>
                        </div>
                      )}
                      {inspectAgent.carrying_civilian_id && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Carrying:</span>
                          <span className="text-purple-700 font-bold">{inspectAgent.carrying_civilian_id}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Waypoints:</span>
                        <span className="text-sky-700 font-bold">{inspectAgent.active_path.length} steps</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resident Civilian Details */}
                {inspectCivilian && (
                  <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 shadow-2xs">
                    <div className="flex items-center justify-between text-rose-800 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span>👤</span>
                        <span>Civilian {inspectCivilian.id}</span>
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white border border-rose-300 text-rose-700">
                        {inspectCivilian.urgency}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-700 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Health:</span>
                        <span className="font-bold text-slate-900">{inspectCivilian.health}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="text-amber-700 font-bold">{inspectCivilian.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Wait:</span>
                        <span className="text-sky-700 font-bold">{inspectCivilian.waiting_ticks ?? 0} ticks</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Route Buttons */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSetStart(inspectCell.coordinate)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 font-bold cursor-pointer text-center text-[11px] transition-all shadow-2xs"
                  >
                    Set as Start (S)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetGoal(inspectCell.coordinate)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 font-bold cursor-pointer text-center text-[11px] transition-all shadow-2xs"
                  >
                    Set as Goal (G)
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center py-6 text-slate-500 text-xs font-mono">
                Click any cell or agent on the map to inspect live telemetry.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Quick Actions */}
      <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-slate-700 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-white border border-slate-300 shadow-2xs" />
            <span>Road</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-700 border border-slate-800 text-center text-[8px] leading-3 text-slate-400">■</span>
            <span>Building</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-sky-100 border border-sky-400 text-[8px] text-center leading-3 text-sky-700 font-bold shadow-2xs">⌂</span>
            <span>Shelter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-400 shadow-2xs" />
            <span>Flooded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-400 text-[8px] text-center leading-3 text-amber-700 font-bold shadow-2xs">✕</span>
            <span>Debris</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🚑</span>
            <span>Responder</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🏃</span>
            <span>Foot Patrol</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">👤</span>
            <span>Civilian</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-sky-100 border border-sky-400 text-sky-700 text-[8px] text-center leading-3 font-bold shadow-2xs">◦</span>
            <span>A* Route</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {startCoord && (
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
              Start: ({startCoord.row}, {startCoord.col})
            </span>
          )}
          {goalCoord && (
            <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-300 shadow-2xs">
              Goal: ({goalCoord.row}, {goalCoord.col})
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
