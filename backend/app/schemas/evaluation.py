"""Pydantic schemas and contracts for Phase 7 Strategy Evaluation and Benchmark Comparison."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class DispatchStrategy(str, Enum):
    """Operational dispatch strategy archetype for rescue coordination."""

    AI_TRIAGE = "ai_triage"        # Multi-factor intelligent triage priority queue (Phase 4 & 5)
    BASELINE_FIFO = "baseline_fifo"  # Naive FIFO / ID-ordered dispatch without triage ranking (Phase 7 baseline)


class StrategyMetrics(BaseModel):
    """Telemetry and performance metrics captured for a single strategy trial."""

    strategy: DispatchStrategy = Field(..., description="Dispatch strategy evaluated")
    strategy_name: str = Field(..., description="Human-readable strategy name")
    description: str = Field(..., description="Brief description of the strategy mechanics")
    civilians_rescued: int = Field(..., description="Total count of civilians safely transported to shelters")
    civilians_unrescued: int = Field(..., description="Civilians remaining unrescued at end of evaluation")
    critical_rescued: int = Field(..., description="Critical urgency civilians safely evacuated")
    critical_unrescued: int = Field(..., description="Critical urgency civilians not reached or remaining in peril")
    average_rescue_tick: Optional[float] = Field(
        None, description="Average simulation tick at which evacuated civilians reached shelters"
    )
    average_final_health: float = Field(
        ..., description="Average health percentage across all civilians at simulation termination"
    )
    failed_missions: int = Field(..., description="Missions aborted due to impassable environmental barriers")
    total_ticks: int = Field(..., description="Total simulation ticks elapsed in the trial")
    tick_cumulative_rescues: List[int] = Field(
        default_factory=list, description="Cumulative civilian rescue count at each tick step"
    )


class EvaluationTrialResult(BaseModel):
    """Deterministic comparative trial between AI Triage and Naive Baseline on identical scenario/seed."""

    scenario_id: str = Field(..., description="Scenario identifier tested")
    scenario_name: str = Field(..., description="Scenario display name")
    seed: int = Field(..., description="Pseudorandom seed ensuring identical initial grid and disaster state")
    max_ticks: int = Field(..., description="Maximum simulation tick horizon")
    ai_metrics: StrategyMetrics = Field(..., description="Metrics achieved by the AI triage strategy")
    baseline_metrics: StrategyMetrics = Field(..., description="Metrics achieved by the baseline strategy")


class EvaluationSummaryMetrics(BaseModel):
    """Aggregated performance metrics across all evaluation trials for a strategy."""

    total_rescued: int = Field(..., description="Sum of civilians rescued across all trials")
    total_unrescued: int = Field(..., description="Sum of unrescued civilians across all trials")
    critical_rescued: int = Field(..., description="Sum of critical civilians rescued")
    critical_unrescued: int = Field(..., description="Sum of critical civilians remaining unrescued")
    avg_rescue_tick: Optional[float] = Field(
        None, description="Mean tick step to achieve evacuation across rescued victims"
    )
    avg_final_health: float = Field(
        ..., description="Mean final civilian health percentage across all civilians in all trials"
    )
    failed_missions: int = Field(..., description="Sum of failed or blocked missions")


class EvaluationDelta(BaseModel):
    """Quantitative performance delta comparing AI Triage strategy against Naive Baseline (AI - Baseline)."""

    rescued_diff: int = Field(..., description="Net civilian rescues difference (positive indicates AI rescued more)")
    critical_rescued_diff: int = Field(
        ..., description="Net critical civilian rescues difference"
    )
    avg_rescue_tick_diff: Optional[float] = Field(
        None, description="Rescue speed difference in ticks (negative indicates AI evacuated faster)"
    )
    avg_final_health_diff: float = Field(
        ..., description="Mean final civilian health percentage delta (positive indicates AI better preserved health)"
    )
    failed_missions_diff: int = Field(
        ..., description="Difference in failed missions count"
    )


class EvaluationSummary(BaseModel):
    """High-level summary of empirical benchmark results comparing both strategies."""

    ai_summary: EvaluationSummaryMetrics = Field(..., description="Aggregated metrics for AI Triage")
    baseline_summary: EvaluationSummaryMetrics = Field(..., description="Aggregated metrics for Baseline FIFO")
    delta: EvaluationDelta = Field(..., description="Quantitative comparison delta")
    analytical_conclusion: str = Field(..., description="Data-driven explanation of comparative outcomes")


class EvaluationRequest(BaseModel):
    """Payload to initiate a deterministic benchmark evaluation."""

    scenario_id: Optional[str] = Field(
        None, description="Optional single scenario ID to evaluate. If omitted, evaluates standard scenario suite."
    )
    seeds: Optional[List[int]] = Field(
        None, description="Optional custom seeds to test. Defaults to [42, 101]."
    )
    max_ticks: int = Field(
        default=25, ge=5, le=100, description="Number of simulation ticks to run each trial"
    )


class EvaluationResponse(BaseModel):
    """Complete benchmark report comparing AI Triage against Naive Baseline."""

    benchmark_id: str = Field(..., description="Unique benchmark execution identifier")
    timestamp: str = Field(..., description="ISO UTC timestamp when the benchmark was executed")
    scenarios_evaluated: List[str] = Field(..., description="List of scenario IDs tested")
    trials_count: int = Field(..., description="Total paired comparison trials conducted")
    max_ticks: int = Field(..., description="Tick limit per trial")
    summary: EvaluationSummary = Field(..., description="Aggregated comparative results")
    trials: List[EvaluationTrialResult] = Field(..., description="Detailed per-trial comparative telemetry")
