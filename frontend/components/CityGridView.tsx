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
        <div className="text-slate-200 text-sm font-bold">City Grid Standby</div>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h2 className="text-sm font-bold text-slate-100 tracking-wide">
              TACTICAL CITY GRID &amp; INCIDENT MAP
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
              {grid.rows} × {grid.cols} Matrix
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any responder, civilian, or cell to inspect telemetry, hazards, and autonomous waypoints.
          </p>
        </div>

        {/* Live Hover Telemetry Bar */}
        <div className="h-7 text-xs font-mono text-slate-300 flex items-center gap-2">
          {hoveredCell ? (
            <div className="px-3 py-1 rounded-full glass-card text-[11px] flex items-center gap-2 flex-wrap border-cyan-500/30">
              <span className="text-cyan-400 font-bold">
                ({hoveredCell.r}, {hoveredCell.c})
              </span>
              <span className="text-slate-300 uppercase font-medium">
                {hoveredCell.terrain}
              </span>
              <span className="text-slate-600">|</span>
              <span
                className={
                  hoveredCell.hazard === "safe"
                    ? "text-emerald-400 font-medium"
                    : hoveredCell.hazard === "dangerous"
                    ? "text-rose-400 font-bold"
                    : "text-amber-400 font-medium"
                }
              >
                {hoveredCell.hazard.toUpperCase()}
              </span>
              {hoveredCell.water > 0 && (
                <span className="text-blue-400">🌊 {hoveredCell.water.toFixed(1)}m</span>
              )}
              {hoveredCell.debris > 0 && (
                <span className="text-amber-400">🧱 {hoveredCell.debris.toFixed(1)}</span>
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
            <span className="text-slate-500 text-[11px] font-mono hidden sm:inline">
              Hover over grid cell for instant sensor telemetry
            </span>
          )}
        </div>
      </div>

      {/* Grid Canvas & Detail Inspector Layout */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Grid View */}
        <div className="lg:col-span-9 overflow-x-auto pb-2 flex justify-center bg-[#060810] p-4 rounded-2xl border border-white/[0.08] shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)]">
          <div
            className="inline-grid gap-1 p-2 rounded-xl bg-[#04060A] border border-slate-800/90 shadow-2xl"
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

                let bgColor = "bg-[#0D1322]"; // High-tech Road
                let borderClass = "border-slate-800/80";
                let content: React.ReactNode = "";

                // 1. Terrain classification
                if (cell.terrain === "building") {
                  bgColor = "bg-[#04060A]";
                  borderClass = "border-[#0A0E18]";
                  content = <span className="text-slate-700 text-[8px]">■</span>;
                } else if (cell.terrain === "open_ground") {
                  bgColor = "bg-emerald-950/30";
                  borderClass = "border-emerald-900/30";
                } else if (cell.terrain === "shelter") {
                  bgColor = "bg-cyan-950/90";
                  borderClass = "border-cyan-400 ring-1 ring-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]";
                  content = <span className="text-cyan-300 font-bold text-xs">⌂</span>;
                }

                // 2. Hazard overlay
                if (cell.hazard === "dangerous") {
                  bgColor = "bg-rose-950/90";
                  borderClass = "border-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.3)]";
                } else if (cell.hazard === "flooded") {
                  bgColor = "bg-blue-950/90";
                  borderClass = "border-blue-500/70 shadow-[inset_0_0_8px_rgba(59,130,246,0.3)]";
                } else if (cell.hazard === "debris_blocked") {
                  bgColor = "bg-amber-950/90";
                  borderClass = "border-amber-600/80 shadow-[inset_0_0_6px_rgba(245,158,11,0.25)]";
                  content = <span className="text-amber-400 text-[9px] font-bold">✕</span>;
                }

                // 3. Path Overlays (Route Planner or Agent Autonomous Waypoint)
                if (start) {
                  bgColor = "bg-emerald-500";
                  borderClass = "border-white ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)] z-10";
                  content = <span className="text-slate-950 font-black text-[10px]">S</span>;
                } else if (goal) {
                  bgColor = "bg-rose-500";
                  borderClass = "border-white ring-2 ring-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.8)] z-10";
                  content = <span className="text-slate-950 font-black text-[10px]">G</span>;
                } else if (inPath) {
                  bgColor = "bg-amber-400";
                  borderClass = "border-white ring-1 ring-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
                  content = <span className="text-slate-950 font-bold text-[9px]">•</span>;
                } else if (inAgentRoute) {
                  bgColor = "bg-cyan-500/25";
                  borderClass = "border-cyan-400 ring-1 ring-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]";
                  content = <span className="text-cyan-300 font-mono text-[9px] font-bold">◦</span>;
                } else if (isHighlightedCiv) {
                  borderClass = "border-purple-400 ring-2 ring-purple-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_12px_rgba(168,85,247,0.7)] z-10";
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

                  let statusHalo = "ring-1 ring-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                  if (agentAtCell.status === "en_route") {
                    statusHalo = "ring-2 ring-sky-400 animate-pulse shadow-[0_0_10px_rgba(56,189,248,0.7)]";
                  } else if (agentAtCell.status === "rescuing") {
                    statusHalo = "ring-2 ring-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.7)]";
                  } else if (agentAtCell.status === "transporting") {
                    statusHalo = "ring-2 ring-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.7)]";
                  } else if (agentAtCell.status === "unavailable") {
                    statusHalo = "ring-2 ring-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]";
                  }

                  if (isAgentSelected) {
                    statusHalo = "ring-2 ring-cyan-300 ring-offset-1 ring-offset-slate-950 scale-110 z-20 shadow-[0_0_15px_rgba(6,182,212,0.9)]";
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
                  borderClass += " ring-2 ring-white ring-offset-1 ring-offset-slate-950 z-20 shadow-[0_0_12px_rgba(255,255,255,0.8)]";
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
                    className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded-sm border cursor-pointer transition-all select-none relative ${bgColor} ${borderClass} hover:ring-2 hover:ring-cyan-400 hover:scale-105`}
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
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Tactical Inspector</span>
              </span>
              {inspectCell && (
                <span className="font-mono text-cyan-300 font-bold text-xs bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/60">
                  ({inspectCell.coordinate.row}, {inspectCell.coordinate.col})
                </span>
              )}
            </div>

            {inspectCell ? (
              <div className="mt-3 space-y-2.5">
                {/* Terrain & Hazard Info */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-mono">Terrain</span>
                    <div className="font-bold text-slate-100 uppercase mt-0.5">
                      {inspectCell.terrain}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-mono">Hazard</span>
                    <div
                      className={`font-bold uppercase mt-0.5 ${
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
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-mono">Water Depth</span>
                    <div className="font-mono text-blue-400 font-bold mt-0.5">
                      {inspectCell.water_level.toFixed(2)}m
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-mono">Debris Index</span>
                    <div className="font-mono text-amber-400 font-bold mt-0.5">
                      {inspectCell.debris_severity.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Resident Agent Details */}
                {inspectAgent && (
                  <div className="mt-2 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <div className="flex items-center justify-between text-cyan-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span>🚑</span>
                        <span>{inspectAgent.name}</span>
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-600 text-cyan-300">
                        {inspectAgent.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-300 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Type:</span>
                        <span className="font-bold">{inspectAgent.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Completed:</span>
                        <span className="text-emerald-400 font-bold">{inspectAgent.completed_rescues} lives</span>
                      </div>
                      {inspectAgent.target_civilian_id && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Target:</span>
                          <span className="text-amber-300 font-bold">{inspectAgent.target_civilian_id}</span>
                        </div>
                      )}
                      {inspectAgent.carrying_civilian_id && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Carrying:</span>
                          <span className="text-purple-300 font-bold">{inspectAgent.carrying_civilian_id}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Waypoints:</span>
                        <span className="text-cyan-400 font-bold">{inspectAgent.active_path.length} steps</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resident Civilian Details */}
                {inspectCivilian && (
                  <div className="mt-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                    <div className="flex items-center justify-between text-rose-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span>👤</span>
                        <span>Civilian {inspectCivilian.id}</span>
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-950 border border-rose-600 text-rose-300">
                        {inspectCivilian.urgency}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-300 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Health:</span>
                        <span className="font-bold text-white">{inspectCivilian.health}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="text-amber-300 font-bold">{inspectCivilian.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Wait:</span>
                        <span className="text-cyan-400 font-bold">{inspectCivilian.waiting_ticks ?? 0} ticks</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Route Buttons */}
                <div className="pt-2 border-t border-white/[0.08] grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSetStart(inspectCell.coordinate)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900 hover:border-emerald-500 font-bold cursor-pointer text-center text-[11px] transition-all shadow-xs"
                  >
                    Set as Start (S)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetGoal(inspectCell.coordinate)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-700/80 hover:bg-rose-900 hover:border-rose-500 font-bold cursor-pointer text-center text-[11px] transition-all shadow-xs"
                  >
                    Set as Goal (G)
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center py-6 text-slate-400 text-xs font-mono">
                Click any cell or agent on the map to inspect live telemetry.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Quick Actions */}
      <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#0D1322] border border-slate-700" />
            <span>Road</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#04060A] border border-slate-900 text-center text-[8px] leading-3 text-slate-600">■</span>
            <span>Building</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-cyan-950 border border-cyan-400 text-[8px] text-center leading-3 text-cyan-300 font-bold shadow-[0_0_6px_rgba(6,182,212,0.5)]">⌂</span>
            <span>Shelter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-950 border border-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
            <span>Flooded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-950 border border-amber-600 text-[8px] text-center leading-3 text-amber-400 font-bold">✕</span>
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
            <span className="w-3 h-3 rounded-sm bg-cyan-500/25 border border-cyan-400 text-cyan-300 text-[8px] text-center leading-3 font-bold shadow-[0_0_6px_rgba(6,182,212,0.6)]">◦</span>
            <span>A* Route</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {startCoord && (
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-700/80 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
              Start: ({startCoord.row}, {startCoord.col})
            </span>
          )}
          {goalCoord && (
            <span className="text-[11px] font-mono text-rose-300 bg-rose-950/70 px-2.5 py-0.5 rounded-full border border-rose-700/80 shadow-[0_0_8px_rgba(239,68,68,0.25)]">
              Goal: ({goalCoord.row}, {goalCoord.col})
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
