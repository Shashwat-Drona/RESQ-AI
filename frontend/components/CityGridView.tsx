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
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <div className="text-3xl mb-2">🗺️</div>
        <div className="text-slate-300 text-sm font-semibold">City Grid Standby</div>
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
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      {/* Header & Quick Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
              05 / Map
            </span>
            <span className="text-slate-500">•</span>
            <h2 className="text-sm font-semibold text-slate-100">
              Interactive City Grid &amp; Autonomous Dispatch Map
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {grid.rows} × {grid.cols} Matrix
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time urban terrain matrix. Select any agent (🚑, 🏃), civilian (👤), or cell to inspect properties and waypoints.
          </p>
        </div>

        {/* Live Hover Telemetry Bar */}
        <div className="h-7 text-xs font-mono text-slate-300 flex items-center gap-2">
          {hoveredCell ? (
            <div className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] flex items-center gap-2 flex-wrap">
              <span className="text-emerald-400 font-bold">
                ({hoveredCell.r}, {hoveredCell.c})
              </span>
              <span className="text-slate-400 uppercase font-medium">
                {hoveredCell.terrain}
              </span>
              <span className="text-slate-600">|</span>
              <span
                className={
                  hoveredCell.hazard === "safe"
                    ? "text-emerald-400"
                    : hoveredCell.hazard === "dangerous"
                    ? "text-rose-400 font-bold"
                    : "text-amber-400"
                }
              >
                {hoveredCell.hazard.toUpperCase()}
              </span>
              {hoveredCell.water > 0 && (
                <span className="text-blue-400">🌊 {hoveredCell.water.toFixed(1)}m</span>
              )}
              {hoveredCell.debris > 0 && (
                <span className="text-amber-500">🧱 {hoveredCell.debris.toFixed(1)}</span>
              )}
              {hoveredCell.agent && (
                <span className="text-cyan-300 font-bold">
                  [{hoveredCell.agent.name}]
                </span>
              )}
              {hoveredCell.civilian && (
                <span className="text-rose-300 font-bold">
                  [{hoveredCell.civilian.id} • {hoveredCell.civilian.urgency}]
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500 text-[11px] font-mono">
              Hover over grid cell for instant sensor telemetry
            </span>
          )}
        </div>
      </div>

      {/* Grid Canvas & Detail Inspector Layout */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Grid View */}
        <div className="lg:col-span-9 overflow-x-auto pb-2 flex justify-center bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
          <div
            className="inline-grid gap-1 p-2 rounded-lg bg-slate-950 border border-slate-800/90 shadow-2xl"
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

                let bgColor = "bg-slate-800/90"; // Road
                let borderClass = "border-slate-700/40";
                let content: React.ReactNode = "";

                // 1. Terrain classification
                if (cell.terrain === "building") {
                  bgColor = "bg-slate-950";
                  borderClass = "border-slate-900";
                  content = <span className="text-slate-700 text-[8px]">■</span>;
                } else if (cell.terrain === "open_ground") {
                  bgColor = "bg-emerald-950/40";
                  borderClass = "border-emerald-900/30";
                } else if (cell.terrain === "shelter") {
                  bgColor = "bg-cyan-950/90";
                  borderClass = "border-cyan-500/80 ring-1 ring-cyan-500/50";
                  content = <span className="text-cyan-300 text-xs">⌂</span>;
                }

                // 2. Hazard overlay
                if (cell.hazard === "dangerous") {
                  bgColor = "bg-rose-950/80";
                  borderClass = "border-rose-700";
                } else if (cell.hazard === "flooded") {
                  bgColor = "bg-blue-900/70";
                  borderClass = "border-blue-600/60";
                } else if (cell.hazard === "debris_blocked") {
                  bgColor = "bg-amber-950/90";
                  borderClass = "border-amber-700/70";
                  content = <span className="text-amber-400 text-[9px] font-bold">✕</span>;
                }

                // 3. Path Overlays (Route Planner or Agent Autonomous Waypoint)
                if (start) {
                  bgColor = "bg-emerald-500";
                  borderClass = "border-white ring-2 ring-emerald-400 z-10";
                  content = <span className="text-slate-950 font-black text-[10px]">S</span>;
                } else if (goal) {
                  bgColor = "bg-rose-500";
                  borderClass = "border-white ring-2 ring-rose-400 z-10";
                  content = <span className="text-slate-950 font-black text-[10px]">G</span>;
                } else if (inPath) {
                  bgColor = "bg-amber-400";
                  borderClass = "border-white ring-1 ring-amber-300";
                  content = <span className="text-slate-950 font-bold text-[9px]">•</span>;
                } else if (inAgentRoute) {
                  bgColor = "bg-cyan-950/90";
                  borderClass = "border-cyan-400 ring-1 ring-cyan-400/80";
                  content = <span className="text-cyan-300 font-mono text-[9px] font-bold">◦</span>;
                } else if (isHighlightedCiv) {
                  borderClass = "border-purple-400 ring-2 ring-purple-400 ring-offset-1 ring-offset-slate-950 z-10";
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

                  let statusHalo = "ring-1 ring-emerald-400";
                  if (agentAtCell.status === "en_route") {
                    statusHalo = "ring-2 ring-sky-400 animate-pulse";
                  } else if (agentAtCell.status === "rescuing") {
                    statusHalo = "ring-2 ring-amber-400";
                  } else if (agentAtCell.status === "transporting") {
                    statusHalo = "ring-2 ring-purple-400";
                  } else if (agentAtCell.status === "unavailable") {
                    statusHalo = "ring-2 ring-rose-500";
                  }

                  if (isAgentSelected) {
                    statusHalo = "ring-2 ring-cyan-300 ring-offset-1 ring-offset-slate-950 scale-110 z-20";
                  }

                  borderClass = statusHalo;

                  content = (
                    <span
                      className="text-[11px] leading-none drop-shadow flex items-center justify-center relative"
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
                  borderClass += " ring-2 ring-white ring-offset-1 ring-offset-slate-950 z-20";
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
                    className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded-sm border cursor-pointer transition-all select-none relative ${bgColor} ${borderClass} hover:ring-2 hover:ring-cyan-400`}
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
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                Tactical Inspector
              </span>
              {inspectCell && (
                <span className="font-mono text-emerald-400 font-bold text-xs">
                  ({inspectCell.coordinate.row}, {inspectCell.coordinate.col})
                </span>
              )}
            </div>

            {inspectCell ? (
              <div className="mt-3 space-y-2.5">
                {/* Terrain & Hazard Info */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Terrain:</span>
                    <div className="font-bold text-slate-200 uppercase">
                      {inspectCell.terrain}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Hazard State:</span>
                    <div
                      className={`font-bold uppercase ${
                        inspectCell.hazard === "safe"
                          ? "text-emerald-400"
                          : inspectCell.hazard === "dangerous"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    >
                      {inspectCell.hazard}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Water Depth:</span>
                    <div className="font-mono text-blue-400 font-semibold">
                      {inspectCell.water_level.toFixed(2)}m
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Debris Severity:</span>
                    <div className="font-mono text-amber-400 font-semibold">
                      {inspectCell.debris_severity.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Resident Agent Details */}
                {inspectAgent && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-cyan-800/60">
                    <div className="flex items-center justify-between text-cyan-300 font-bold">
                      <span>{inspectAgent.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1 rounded bg-cyan-950 border border-cyan-700">
                        {inspectAgent.status}
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-1 text-[11px] text-slate-400">
                      <div>Type: <strong className="text-slate-200">{inspectAgent.type}</strong></div>
                      <div>Completed: <strong className="text-emerald-300">{inspectAgent.completed_rescues} lives</strong></div>
                      {inspectAgent.target_civilian_id && (
                        <div>Target: <strong className="text-amber-300">{inspectAgent.target_civilian_id}</strong></div>
                      )}
                      {inspectAgent.carrying_civilian_id && (
                        <div>Carrying: <strong className="text-purple-300">{inspectAgent.carrying_civilian_id}</strong></div>
                      )}
                      <div>Waypoints remaining: <strong className="text-cyan-300">{inspectAgent.active_path.length}</strong></div>
                    </div>
                  </div>
                )}

                {/* Resident Civilian Details */}
                {inspectCivilian && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-rose-800/60">
                    <div className="flex items-center justify-between text-rose-300 font-bold">
                      <span>Civilian {inspectCivilian.id}</span>
                      <span className="text-[10px] uppercase font-mono px-1 rounded bg-rose-950 border border-rose-700">
                        {inspectCivilian.urgency}
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-1 text-[11px] text-slate-400">
                      <div>Health: <strong className="text-slate-200">{inspectCivilian.health}%</strong></div>
                      <div>Status: <strong className="text-amber-300">{inspectCivilian.status}</strong></div>
                      <div>Waiting time: <strong className="text-cyan-300">{inspectCivilian.waiting_ticks ?? 0} ticks</strong></div>
                    </div>
                  </div>
                )}

                {/* Quick Route Buttons */}
                <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSetStart(inspectCell.coordinate)}
                    className="px-2 py-1.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60 font-semibold cursor-pointer text-center text-[11px]"
                  >
                    Set as Start (S)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetGoal(inspectCell.coordinate)}
                    className="px-2 py-1.5 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900/60 font-semibold cursor-pointer text-center text-[11px]"
                  >
                    Set as Goal (G)
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center py-6 text-slate-500 text-[11px]">
                Click any cell or agent on the map to inspect telemetry, responder capabilities, and civilian vitals.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Quick Actions */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700" />
            <span>Road</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-950 border border-slate-900 text-center text-[8px] leading-3 text-slate-500">■</span>
            <span>Building</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-cyan-950 border border-cyan-500 text-[8px] text-center leading-3 text-cyan-300 font-bold">⌂</span>
            <span>Shelter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-900 border border-blue-600" />
            <span>Flooded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-950 border border-amber-700 text-[8px] text-center leading-3 text-amber-400 font-bold">✕</span>
            <span>Debris</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🚑</span>
            <span>Vehicle Unit</span>
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
            <span className="w-3 h-3 rounded-sm bg-cyan-950 border border-cyan-400 text-cyan-300 text-[8px] text-center leading-3 font-bold">◦</span>
            <span>Planned Path</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {startCoord && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Start: ({startCoord.row}, {startCoord.col})
            </span>
          )}
          {goalCoord && (
            <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
              Goal: ({goalCoord.row}, {goalCoord.col})
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
