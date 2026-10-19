"""Autonomous Multi-Agent Rescue Dispatch and Coordination Service for RESQ-AI.

Manages heterogeneous rescue agents, autonomous path navigation via A*,
deterministic triage dispatching, civilian pickup and transport,
shelter evacuation, collision resolution, and dynamic replanning.
"""

from typing import Dict, List, Optional, Tuple
from app.schemas.agent import (
    AgentStatus,
    AgentType,
    DispatchSummary,
    MissionStatus,
    RescueAgent,
    RescueMission,
)
from app.schemas.environment import (
    CityGrid,
    Civilian,
    CivilianStatus,
    Coordinate,
    HazardState,
    Shelter,
    TerrainType,
)
from app.schemas.evaluation import DispatchStrategy
from app.schemas.route import MovementProfile
from app.services.simulation.pathfinding import AStarPathfinder
from app.services.simulation.prioritization import RescuePrioritizer


class RescueCoordinator:
    """Central deterministic dispatch and movement coordinator for the rescue fleet."""

    # Pre-configured fleet archetype definitions
    FLEET_TEMPLATES = [
        {
            "id_suffix": "ground_1",
            "name": "Alpha-1 (Vehicle)",
            "type": AgentType.GROUND_RESPONDER,
            "movement_profile": MovementProfile.GROUND_RESPONDER,
        },
        {
            "id_suffix": "foot_1",
            "name": "Bravo-1 (Foot)",
            "type": AgentType.FOOT_RESPONDER,
            "movement_profile": MovementProfile.ON_FOOT,
        },
        {
            "id_suffix": "ground_2",
            "name": "Alpha-2 (Vehicle)",
            "type": AgentType.GROUND_RESPONDER,
            "movement_profile": MovementProfile.GROUND_RESPONDER,
        },
        {
            "id_suffix": "foot_2",
            "name": "Bravo-2 (Foot)",
            "type": AgentType.FOOT_RESPONDER,
            "movement_profile": MovementProfile.ON_FOOT,
        },
    ]

    @classmethod
    def create_default_fleet(
        cls,
        shelters: List[Shelter],
        max_agents: int = 4,
    ) -> List[RescueAgent]:
        """Instantiate a balanced fleet of ground and foot responders stationed at shelters."""
        agents: List[RescueAgent] = []
        count = min(max_agents, len(cls.FLEET_TEMPLATES))

        for i in range(count):
            template = cls.FLEET_TEMPLATES[i]
            # Distribute starting spawn positions among available shelters
            spawn_coord = Coordinate(row=0, col=0)
            if shelters:
                shelter_idx = i % len(shelters)
                spawn_coord = shelters[shelter_idx].coordinate

            agent = RescueAgent(
                id=f"agent_{template['id_suffix']}",
                name=template["name"],
                type=template["type"],
                coordinate=spawn_coord,
                status=AgentStatus.IDLE,
                movement_profile=template["movement_profile"],
                current_mission_id=None,
                target_civilian_id=None,
                carrying_civilian_id=None,
                completed_rescues=0,
                speed_cells_per_tick=1,
                active_path=[],
                metadata={
                    "spawn_location": [spawn_coord.row, spawn_coord.col],
                    "unit_type": template["type"].value,
                },
            )
            agents.append(agent)

        return agents

    @classmethod
    def find_nearest_available_shelter(
        cls,
        start_coord: Coordinate,
        shelters: List[Shelter],
        grid: CityGrid,
        profile: MovementProfile,
    ) -> Tuple[Optional[Shelter], Optional[List[Coordinate]]]:
        """Find the closest reachable evacuation shelter with available capacity using A*.
        
        Tie-breaking:
        1. Minimum A* path cost
        2. Minimum path length
        3. Shelter ID ascending
        """
        candidates: List[Tuple[float, int, str, Shelter, List[Coordinate]]] = []

        for shelter in shelters:
            # Check capacity constraints
            if shelter.current_occupancy >= shelter.capacity:
                continue

            route = AStarPathfinder.plan_route(grid, start_coord, shelter.coordinate, profile)
            if route.found:
                candidates.append((
                    route.total_cost,
                    route.path_length,
                    shelter.id,
                    shelter,
                    route.path,
                ))

        if not candidates:
            return None, None

        # Sort deterministically
        candidates.sort(key=lambda item: (item[0], item[1], item[2]))
        best_candidate = candidates[0]
        return best_candidate[3], best_candidate[4]

    @classmethod
    def dispatch_idle_agents(
        cls,
        agents: List[RescueAgent],
        civilians: List[Civilian],
        grid: CityGrid,
        current_tick: int,
        missions: List[RescueMission],
        strategy: DispatchStrategy = DispatchStrategy.AI_TRIAGE,
    ) -> Tuple[List[RescueMission], List[str]]:
        """Evaluate rescue queue and assign feasible missions to available agents.
        
        Supports two strategy modes:
        - AI_TRIAGE: Deterministic multi-factor triage priority queue (Phase 4 & 5).
        - BASELINE_FIFO: Naive FIFO / ID-ordered dispatch without triage ranking (Phase 7 baseline).
        """
        if strategy == DispatchStrategy.BASELINE_FIFO:
            return cls.dispatch_baseline_idle_agents(
                agents=agents,
                civilians=civilians,
                grid=grid,
                current_tick=current_tick,
                missions=missions,
            )

        events: List[str] = []
        new_missions: List[RescueMission] = []

        # 1. Identify active civilian targets
        active_target_ids = {
            m.civilian_id
            for m in missions
            if m.status in (MissionStatus.ASSIGNED, MissionStatus.EN_ROUTE, MissionStatus.RESCUING, MissionStatus.TRANSPORTING)
        }

        # 2. Get ranked triage queue from RescuePrioritizer
        triage_queue = RescuePrioritizer.rank_civilians(civilians, grid=grid, include_rescued=False)

        # 3. Filter candidates
        eligible_civilians: List[Tuple[Civilian, int]] = []
        civ_map = {c.id: c for c in civilians}
        for item in triage_queue:
            civ = civ_map.get(item.civilian_id)
            if (
                civ is not None
                and civ.status != CivilianStatus.RESCUED
                and civ.status != CivilianStatus.IN_TRANSIT
                and civ.id not in active_target_ids
            ):
                eligible_civilians.append((civ, item.rank))

        # 4. Find available idle agents
        available_agents = [
            a for a in agents
            if a.status == AgentStatus.IDLE and a.current_mission_id is None
        ]
        # Sort available agents deterministically by ID
        available_agents.sort(key=lambda a: a.id)

        if not available_agents or not eligible_civilians:
            return new_missions, events

        # 5. Greedy matching along triage order
        assigned_agent_ids = set()

        for civ, rank in eligible_civilians:
            # Check if any agents remain available
            idle_pool = [a for a in available_agents if a.id not in assigned_agent_ids]
            if not idle_pool:
                break

            # Evaluate route feasibility from each idle agent to this civilian
            candidate_routes: List[Tuple[float, int, str, RescueAgent, List[Coordinate]]] = []
            unreachable_reasons: List[str] = []

            for agent in idle_pool:
                route_res = AStarPathfinder.plan_route(
                    grid,
                    agent.coordinate,
                    civ.coordinate,
                    agent.movement_profile,
                )
                if route_res.found:
                    candidate_routes.append((
                        route_res.total_cost,
                        route_res.path_length,
                        agent.id,
                        agent,
                        route_res.path,
                    ))
                else:
                    unreachable_reasons.append(f"{agent.id}: {route_res.reason or 'No path'}")

            if candidate_routes:
                # Deterministic selection: minimum route cost, then path length, then agent ID
                candidate_routes.sort(key=lambda c: (c[0], c[1], c[2]))
                best_cost, _, _, chosen_agent, best_path = candidate_routes[0]

                # Create mission
                mission_id = f"mission_{civ.id}_{current_tick}_{chosen_agent.id}"
                explanation = (
                    f"Dispatched {chosen_agent.name} to rescue Civilian {civ.id} "
                    f"(Triage Rank #{rank}, urgency {civ.urgency.value}, route cost {best_cost:.1f})."
                )

                mission = RescueMission(
                    id=mission_id,
                    agent_id=chosen_agent.id,
                    civilian_id=civ.id,
                    target_coordinate=civ.coordinate,
                    shelter_id=None,
                    shelter_coordinate=None,
                    status=MissionStatus.EN_ROUTE,
                    route=best_path,
                    route_step_index=0,
                    created_at_tick=current_tick,
                    completed_at_tick=None,
                    explanation=explanation,
                )
                new_missions.append(mission)
                missions.append(mission)

                # Update agent state
                chosen_agent.status = AgentStatus.EN_ROUTE
                chosen_agent.current_mission_id = mission_id
                chosen_agent.target_civilian_id = civ.id
                # Exclude current starting cell from active_path waypoints
                chosen_agent.active_path = best_path[1:] if len(best_path) > 1 else []

                assigned_agent_ids.add(chosen_agent.id)
                events.append(f"Autonomous Dispatch: {explanation}")
            else:
                # Target currently unreachable by all idle responders; log and proceed to next civilian
                events.append(
                    f"Civilian {civ.id} (Triage #{rank}) is currently unreachable by available agents. Deferring to next priority."
                )

        return new_missions, events

    @classmethod
    def dispatch_baseline_idle_agents(
        cls,
        agents: List[RescueAgent],
        civilians: List[Civilian],
        grid: CityGrid,
        current_tick: int,
        missions: List[RescueMission],
    ) -> Tuple[List[RescueMission], List[str]]:
        """Baseline strategy: Dispatch idle agents to eligible civilians in naive fixed ID order.
        
        Guarantees:
        - Evaluates eligible unrescued civilians in simple alphanumeric ID order (naive FIFO queue).
        - Does NOT use civilian health, urgency, hazard exposure, or triage priority scores.
        - Assigns nearest reachable idle agent using standard A* pathfinding.
        - Same environmental safety and collision rules as the AI coordinator for fair comparison.
        """
        events: List[str] = []
        new_missions: List[RescueMission] = []

        # 1. Identify active civilian targets
        active_target_ids = {
            m.civilian_id
            for m in missions
            if m.status in (MissionStatus.ASSIGNED, MissionStatus.EN_ROUTE, MissionStatus.RESCUING, MissionStatus.TRANSPORTING)
        }

        # 2. Select eligible civilians ordered strictly by civilian ID (naive ordering)
        eligible_civilians = [
            c for c in sorted(civilians, key=lambda civ: civ.id)
            if c.status not in (CivilianStatus.RESCUED, CivilianStatus.IN_TRANSIT)
            and c.id not in active_target_ids
        ]

        # 3. Find available idle agents sorted deterministically by ID
        available_agents = [
            a for a in agents
            if a.status == AgentStatus.IDLE and a.current_mission_id is None
        ]
        available_agents.sort(key=lambda a: a.id)

        if not available_agents or not eligible_civilians:
            return new_missions, events

        # 4. Greedy matching along fixed ID order
        assigned_agent_ids = set()

        for civ in eligible_civilians:
            idle_pool = [a for a in available_agents if a.id not in assigned_agent_ids]
            if not idle_pool:
                break

            candidate_routes: List[Tuple[float, int, str, RescueAgent, List[Coordinate]]] = []

            for agent in idle_pool:
                route_res = AStarPathfinder.plan_route(
                    grid,
                    agent.coordinate,
                    civ.coordinate,
                    agent.movement_profile,
                )
                if route_res.found:
                    candidate_routes.append((
                        route_res.total_cost,
                        route_res.path_length,
                        agent.id,
                        agent,
                        route_res.path,
                    ))

            if candidate_routes:
                # Select nearest reachable agent: minimum route cost, path length, agent ID
                candidate_routes.sort(key=lambda c: (c[0], c[1], c[2]))
                best_cost, _, _, chosen_agent, best_path = candidate_routes[0]

                mission_id = f"mission_baseline_{civ.id}_{current_tick}_{chosen_agent.id}"
                explanation = (
                    f"Baseline Dispatch: Dispatched {chosen_agent.name} to rescue Civilian {civ.id} "
                    f"(Naive ID order, route cost {best_cost:.1f})."
                )

                mission = RescueMission(
                    id=mission_id,
                    agent_id=chosen_agent.id,
                    civilian_id=civ.id,
                    target_coordinate=civ.coordinate,
                    shelter_id=None,
                    shelter_coordinate=None,
                    status=MissionStatus.EN_ROUTE,
                    route=best_path,
                    route_step_index=0,
                    created_at_tick=current_tick,
                    completed_at_tick=None,
                    explanation=explanation,
                )
                new_missions.append(mission)
                missions.append(mission)

                chosen_agent.status = AgentStatus.EN_ROUTE
                chosen_agent.current_mission_id = mission_id
                chosen_agent.target_civilian_id = civ.id
                chosen_agent.active_path = best_path[1:] if len(best_path) > 1 else []

                assigned_agent_ids.add(chosen_agent.id)
                events.append(explanation)
            else:
                events.append(
                    f"Baseline Dispatch: Civilian {civ.id} is currently unreachable by available agents. Deferring."
                )

        return new_missions, events

    @classmethod
    def step_agents_and_missions(
        cls,
        agents: List[RescueAgent],
        missions: List[RescueMission],
        civilians: List[Civilian],
        shelters: List[Shelter],
        grid: CityGrid,
        current_tick: int,
    ) -> Tuple[int, List[str]]:
        """Advance agent movement, execute rescue actions, handle transport and replanning.
        
        Returns:
            Tuple of (newly_completed_rescues_count, log_events)
        """
        events: List[str] = []
        newly_rescued = 0

        civ_map = {c.id: c for c in civilians}
        shelter_map = {s.id: s for s in shelters}
        active_missions_map = {m.id: m for m in missions}

        # 1. Validate active missions and check route viability
        # Sort agents deterministically by ID to ensure reproducible execution order
        sorted_agents = sorted(agents, key=lambda a: a.id)

        for agent in sorted_agents:
            if agent.status in (AgentStatus.IDLE, AgentStatus.UNAVAILABLE):
                continue

            mission = active_missions_map.get(agent.current_mission_id or "")
            if not mission:
                agent.status = AgentStatus.IDLE
                agent.current_mission_id = None
                agent.target_civilian_id = None
                agent.carrying_civilian_id = None
                agent.active_path = []
                continue

            target_civ = civ_map.get(mission.civilian_id)
            if not target_civ:
                mission.status = MissionStatus.CANCELLED
                mission.explanation = f"Civilian {mission.civilian_id} no longer exists."
                agent.status = AgentStatus.IDLE
                agent.current_mission_id = None
                agent.target_civilian_id = None
                agent.carrying_civilian_id = None
                agent.active_path = []
                events.append(f"Mission {mission.id} cancelled: Target civilian not found.")
                continue

            # Verify if route ahead is still passable against current grid hazards
            needs_replan = False
            if agent.active_path:
                next_cell_coord = agent.active_path[0]
                cell = grid.cells[next_cell_coord.row][next_cell_coord.col]
                cost = AStarPathfinder.get_cell_cost(cell, agent.movement_profile)
                if cost is None:
                    needs_replan = True

            if needs_replan:
                events.append(
                    f"Hazard Warning: Path for {agent.name} blocked at ({agent.active_path[0].row}, {agent.active_path[0].col}). Replanning with A*..."
                )
                destination = mission.target_coordinate if agent.status == AgentStatus.EN_ROUTE else mission.shelter_coordinate
                if destination:
                    new_route = AStarPathfinder.plan_route(grid, agent.coordinate, destination, agent.movement_profile)
                    if new_route.found:
                        mission.route = new_route.path
                        agent.active_path = new_route.path[1:] if len(new_route.path) > 1 else []
                        events.append(f"Replanning Success: {agent.name} rerouted (Path length: {new_route.path_length}).")
                    else:
                        # Path completely blocked
                        events.append(f"Replanning Failed: Destination unreachable for {agent.name}.")
                        if agent.status == AgentStatus.EN_ROUTE:
                            mission.status = MissionStatus.FAILED
                            mission.explanation = f"Civilian {target_civ.id} became unreachable due to environmental hazards."
                            agent.status = AgentStatus.IDLE
                            agent.current_mission_id = None
                            agent.target_civilian_id = None
                            agent.active_path = []
                            continue
                        elif agent.status == AgentStatus.TRANSPORTING:
                            # Try alternative shelters
                            alt_shelter, alt_path = cls.find_nearest_available_shelter(
                                agent.coordinate, shelters, grid, agent.movement_profile
                            )
                            if alt_shelter and alt_path:
                                mission.shelter_id = alt_shelter.id
                                mission.shelter_coordinate = alt_shelter.coordinate
                                mission.route = alt_path
                                agent.active_path = alt_path[1:] if len(alt_path) > 1 else []
                                events.append(f"Diverting {agent.name} to alternate Shelter {alt_shelter.id}.")
                            else:
                                events.append(f"Critical: All shelters unreachable for {agent.name} carrying Civilian {target_civ.id}!")
                                mission.status = MissionStatus.FAILED
                                mission.explanation = "All evacuation shelters unreachable due to flood/debris barriers."
                                agent.status = AgentStatus.UNAVAILABLE
                                agent.active_path = []
                                continue

        # 2. Movement Phase with Collision Avoidance
        # Determine intended next cell for each agent
        intended_moves: Dict[str, Coordinate] = {}
        for agent in sorted_agents:
            if agent.status in (AgentStatus.EN_ROUTE, AgentStatus.TRANSPORTING) and agent.active_path:
                intended_moves[agent.id] = agent.active_path[0]
            else:
                intended_moves[agent.id] = agent.coordinate

        # Check for destination collisions between moving agents (allow sharing shelter cells)
        shelter_coords = {(s.coordinate.row, s.coordinate.col) for s in shelters}
        dest_claims: Dict[Tuple[int, int], List[str]] = {}
        for agent_id, dest in intended_moves.items():
            dest_key = (dest.row, dest.col)
            if dest_key not in shelter_coords:
                dest_claims.setdefault(dest_key, []).append(agent_id)

        # Execute validated single-step moves
        for agent in sorted_agents:
            if not agent.active_path or agent.status not in (AgentStatus.EN_ROUTE, AgentStatus.TRANSPORTING):
                continue

            target_dest = intended_moves[agent.id]
            target_key = (target_dest.row, target_dest.col)

            # If multiple agents claimed this non-shelter cell, only the lowest ID moves; others yield
            claimants = dest_claims.get(target_key, [])
            if len(claimants) > 1 and claimants[0] != agent.id:
                events.append(f"{agent.name} yielded right-of-way at ({target_dest.row}, {target_dest.col}) to {claimants[0]}.")
                continue

            # Step forward
            agent.coordinate = target_dest
            agent.active_path.pop(0)

            # Update mission step progress
            mission = active_missions_map.get(agent.current_mission_id or "")
            if mission:
                mission.route_step_index += 1

            # If carrying civilian, update civilian coordinate
            if agent.carrying_civilian_id:
                civ = civ_map.get(agent.carrying_civilian_id)
                if civ:
                    civ.coordinate = agent.coordinate

        # 3. Process Arrival Transitions
        for agent in sorted_agents:
            mission = active_missions_map.get(agent.current_mission_id or "")
            if not mission:
                continue
            target_civ = civ_map.get(mission.civilian_id)
            if not target_civ:
                continue

            # Arrival at Civilian (EN_ROUTE -> RESCUING / TRANSPORTING)
            if agent.status == AgentStatus.EN_ROUTE and agent.coordinate == mission.target_coordinate:
                events.append(
                    f"Extraction: {agent.name} reached Civilian {target_civ.id} at ({agent.coordinate.row}, {agent.coordinate.col}). Securing patient."
                )
                agent.status = AgentStatus.RESCUING
                mission.status = MissionStatus.RESCUING
                target_civ.status = CivilianStatus.IN_TRANSIT
                agent.carrying_civilian_id = target_civ.id

                # Select nearest reachable shelter with capacity
                dest_shelter, shelter_path = cls.find_nearest_available_shelter(
                    agent.coordinate, shelters, grid, agent.movement_profile
                )

                if dest_shelter and shelter_path:
                    mission.shelter_id = dest_shelter.id
                    mission.shelter_coordinate = dest_shelter.coordinate
                    mission.status = MissionStatus.TRANSPORTING
                    agent.status = AgentStatus.TRANSPORTING
                    mission.route = shelter_path
                    mission.route_step_index = 0
                    agent.active_path = shelter_path[1:] if len(shelter_path) > 1 else []
                    mission.explanation = (
                        f"Civilian {target_civ.id} secured aboard {agent.name}. Transporting to Shelter {dest_shelter.name}."
                    )
                    events.append(
                        f"Transport: {agent.name} evacuating Civilian {target_civ.id} to Shelter {dest_shelter.name} ({len(shelter_path) - 1} steps)."
                    )
                else:
                    events.append(
                        f"Evacuation Hazard: No reachable shelter with capacity for {agent.name} with Civilian {target_civ.id}. Holding position."
                    )
                    mission.explanation = "No reachable shelter has available capacity. Patient held safely at extraction site."

            # Arrival at Shelter (TRANSPORTING -> COMPLETED)
            elif (
                agent.status == AgentStatus.TRANSPORTING
                and mission.shelter_coordinate is not None
                and agent.coordinate == mission.shelter_coordinate
            ):
                dest_shelter = shelter_map.get(mission.shelter_id or "")
                shelter_name = dest_shelter.name if dest_shelter else "Shelter"

                # Safely evacuate civilian into shelter
                target_civ.status = CivilianStatus.RESCUED
                target_civ.coordinate = agent.coordinate
                if dest_shelter:
                    dest_shelter.current_occupancy += 1

                agent.completed_rescues += 1
                newly_rescued += 1

                mission.status = MissionStatus.COMPLETED
                mission.completed_at_tick = current_tick
                mission.explanation = (
                    f"Civilian {target_civ.id} safely evacuated into {shelter_name} by {agent.name} at tick {current_tick}."
                )

                # Reset agent to idle
                agent.status = AgentStatus.IDLE
                agent.carrying_civilian_id = None
                agent.target_civilian_id = None
                agent.current_mission_id = None
                agent.active_path = []

                events.append(
                    f"Rescue Complete: Civilian {target_civ.id} successfully evacuated to {shelter_name} by {agent.name}!"
                )

        return newly_rescued, events

    @classmethod
    def get_summary(
        cls,
        agents: List[RescueAgent],
        missions: List[RescueMission],
    ) -> DispatchSummary:
        """Compute aggregate dispatch summary statistics."""
        total_agents = len(agents)
        available = sum(1 for a in agents if a.status == AgentStatus.IDLE)
        active_missions = sum(
            1 for m in missions
            if m.status in (MissionStatus.ASSIGNED, MissionStatus.EN_ROUTE, MissionStatus.RESCUING, MissionStatus.TRANSPORTING)
        )
        completed = sum(1 for m in missions if m.status == MissionStatus.COMPLETED)
        failed = sum(1 for m in missions if m.status in (MissionStatus.FAILED, MissionStatus.CANCELLED))

        return DispatchSummary(
            total_agents=total_agents,
            available_agents=available,
            active_missions=active_missions,
            completed_evacuations=completed,
            failed_missions=failed,
        )
