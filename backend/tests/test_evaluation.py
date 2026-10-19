"""Unit and integration tests for Phase 7 Strategy Evaluation and Baseline Comparison."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.environment import (
    Civilian,
    CivilianStatus,
    Coordinate,
    HazardState,
    Shelter,
    UrgencyLevel,
)
from app.schemas.evaluation import (
    DispatchStrategy,
    EvaluationRequest,
    EvaluationResponse,
)
from app.schemas.simulation import StartSimulationRequest
from app.services.simulation.dispatcher import RescueCoordinator
from app.services.simulation.engine import SimulationEngine
from app.services.simulation.evaluator import SimulationEvaluator
from app.services.simulation.grid_generator import CityGridGenerator
from app.services.simulation_service import SimulationService


@pytest.fixture
def client():
    return TestClient(app)


def test_baseline_dispatch_uses_id_order_and_ignores_triage():
    """Verify that baseline dispatch selects civilians strictly in fixed ID order, ignoring urgency."""
    grid, _, shelters = CityGridGenerator.generate(rows=15, cols=15, num_civilians=4, seed=42)
    agents = RescueCoordinator.create_default_fleet(shelters, max_agents=1)

    # Handcraft 3 eligible civilians:
    # civ_a: LOW urgency, ID 'civ_1'
    # civ_b: CRITICAL urgency, trapped, ID 'civ_2'
    # civ_c: HIGH urgency, ID 'civ_3'
    # Located on traversable coordinates
    civ_a = Civilian(
        id="civ_1",
        coordinate=Coordinate(row=0, col=1),
        status=CivilianStatus.WAITING,
        urgency=UrgencyLevel.LOW,
        health=95,
        waiting_ticks=0,
    )
    civ_b = Civilian(
        id="civ_2",
        coordinate=Coordinate(row=0, col=2),
        status=CivilianStatus.TRAPPED,
        urgency=UrgencyLevel.CRITICAL,
        health=20,
        waiting_ticks=5,
    )
    civ_c = Civilian(
        id="civ_3",
        coordinate=Coordinate(row=0, col=3),
        status=CivilianStatus.WAITING,
        urgency=UrgencyLevel.HIGH,
        health=60,
        waiting_ticks=2,
    )
    civilians = [civ_c, civ_b, civ_a]  # Shuffled input order

    # 1. Baseline dispatch should select 'civ_1' first because of lowest ID, despite LOW urgency
    missions, events = RescueCoordinator.dispatch_idle_agents(
        agents=agents,
        civilians=civilians,
        grid=grid,
        current_tick=0,
        missions=[],
        strategy=DispatchStrategy.BASELINE_FIFO,
    )
    assert len(missions) == 1
    assert missions[0].civilian_id == "civ_1"
    assert "Baseline Dispatch" in missions[0].explanation


def test_ai_triage_dispatch_prioritizes_critical_urgency():
    """Verify that AI triage strategy prioritizes CRITICAL urgency over naive ID order."""
    grid, _, shelters = CityGridGenerator.generate(rows=15, cols=15, num_civilians=4, seed=42)
    agents = RescueCoordinator.create_default_fleet(shelters, max_agents=1)

    civ_a = Civilian(
        id="civ_1",
        coordinate=Coordinate(row=0, col=1),
        status=CivilianStatus.WAITING,
        urgency=UrgencyLevel.LOW,
        health=95,
        waiting_ticks=0,
    )
    civ_b = Civilian(
        id="civ_2",
        coordinate=Coordinate(row=0, col=2),
        status=CivilianStatus.TRAPPED,
        urgency=UrgencyLevel.CRITICAL,
        health=20,
        waiting_ticks=5,
    )
    civilians = [civ_a, civ_b]

    # AI triage MUST dispatch civ_2 (CRITICAL) before civ_1 (LOW)
    missions, events = RescueCoordinator.dispatch_idle_agents(
        agents=agents,
        civilians=civilians,
        grid=grid,
        current_tick=0,
        missions=[],
        strategy=DispatchStrategy.AI_TRIAGE,
    )
    assert len(missions) == 1
    assert missions[0].civilian_id == "civ_2"
    assert "Triage Rank #1" in missions[0].explanation


def test_single_strategy_trial_execution_and_metrics():
    """Verify single strategy trial execution computes consistent metrics."""
    metrics_ai = SimulationEvaluator.run_single_strategy_trial(
        scenario_id="flash_flood_riverside",
        seed=42,
        max_ticks=10,
        strategy=DispatchStrategy.AI_TRIAGE,
    )
    assert metrics_ai.strategy == DispatchStrategy.AI_TRIAGE
    assert metrics_ai.total_ticks > 0
    assert metrics_ai.civilians_rescued + metrics_ai.civilians_unrescued > 0
    assert 0 <= metrics_ai.average_final_health <= 100
    assert len(metrics_ai.tick_cumulative_rescues) == metrics_ai.total_ticks + 1


def test_evaluation_benchmark_repeatability():
    """Verify that running identical evaluation benchmarks produces strictly deterministic results."""
    req = EvaluationRequest(scenario_id="flash_flood_riverside", seeds=[42], max_ticks=8)
    res1 = SimulationEvaluator.evaluate(req)
    res2 = SimulationEvaluator.evaluate(req)

    assert res1.trials_count == 1
    assert res2.trials_count == 1
    assert res1.summary.ai_summary.total_rescued == res2.summary.ai_summary.total_rescued
    assert res1.summary.baseline_summary.total_rescued == res2.summary.baseline_summary.total_rescued
    assert res1.summary.delta.rescued_diff == res2.summary.delta.rescued_diff
    assert res1.summary.delta.avg_final_health_diff == res2.summary.delta.avg_final_health_diff


def test_evaluation_does_not_mutate_active_dashboard_simulation(client):
    """Verify that running an evaluation benchmark does not modify or advance the user's active session."""
    # 1. Start user simulation scenario
    start_res = client.post(
        "/api/v1/simulation/start",
        json={"scenario_id": "flash_flood_riverside", "seed": 42},
    )
    assert start_res.status_code == 200
    init_state = start_res.json()
    assert init_state["current_tick"] == 0

    # Advance user simulation by exactly 2 ticks
    client.post("/api/v1/simulation/tick")
    user_tick2_res = client.post("/api/v1/simulation/tick")
    assert user_tick2_res.json()["current_tick"] == 2

    # 2. Run a heavy comparative evaluation (multi-scenario, multi-seed)
    eval_res = client.post(
        "/api/v1/simulation/evaluate",
        json={"scenario_id": "earthquake_district", "seeds": [99], "max_ticks": 15},
    )
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["trials_count"] == 1

    # 3. Verify user's active session state is still exactly at tick 2, scenario flash_flood_riverside!
    state_res = client.get("/api/v1/simulation/state")
    assert state_res.status_code == 200
    state_after = state_res.json()
    assert state_after["current_tick"] == 2
    assert state_after["scenario_id"] == "flash_flood_riverside"


def test_api_evaluate_and_latest_endpoints(client):
    """Test POST /simulation/evaluate and GET /simulation/evaluate/latest endpoints."""
    # Test POST evaluate
    eval_res = client.post(
        "/api/v1/simulation/evaluate",
        json={"seeds": [42], "max_ticks": 10},
    )
    assert eval_res.status_code == 200
    data = eval_res.json()
    assert "benchmark_id" in data
    assert "summary" in data
    assert data["trials_count"] >= 1

    # Test GET evaluate/latest returns the cached result
    latest_res = client.get("/api/v1/simulation/evaluate/latest")
    assert latest_res.status_code == 200
    latest_data = latest_res.json()
    assert latest_data is not None
    assert latest_data["benchmark_id"] == data["benchmark_id"]
