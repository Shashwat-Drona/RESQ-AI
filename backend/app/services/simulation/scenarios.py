"""Catalog of reproducible built-in disaster simulation scenarios."""

from typing import Dict, List
from app.schemas.simulation import DisasterType, ScenarioInfo

BUILTIN_SCENARIOS: Dict[str, ScenarioInfo] = {
    "flooded_neighborhood": ScenarioInfo(
        id="flooded_neighborhood",
        name="Flooded Neighborhood",
        description=(
            "River overflow and broken storm levees cause progressive water inundation across "
            "low-lying residential streets, threatening civilians and cutting off low roads."
        ),
        disaster_type=DisasterType.FLOOD,
        default_seed=101,
        recommended_rows=20,
        recommended_cols=20,
        civilian_count=8,
    ),
    "earthquake_district": ScenarioInfo(
        id="earthquake_district",
        name="Earthquake-Damaged District",
        description=(
            "A high-magnitude seismic tremor collapses multi-story buildings, depositing heavy rubble "
            "and blocking crucial road intersections, trapping residents in urban sectors."
        ),
        disaster_type=DisasterType.EARTHQUAKE,
        default_seed=202,
        recommended_rows=20,
        recommended_cols=20,
        civilian_count=10,
    ),
    "severe_mixed_district": ScenarioInfo(
        id="severe_mixed_district",
        name="Severe Mixed-Obstacle Scenario",
        description=(
            "Severe disaster featuring seismic building collapses alongside ruptured high-pressure water mains, "
            "generating concurrent impassable debris choke-points and localized flash flooding."
        ),
        disaster_type=DisasterType.FLOOD,
        default_seed=303,
        recommended_rows=20,
        recommended_cols=20,
        civilian_count=12,
    ),
    "triage_benchmark_challenge": ScenarioInfo(
        id="triage_benchmark_challenge",
        name="Triage Evaluation Challenge (High Acuity)",
        description=(
            "Designed benchmark challenge featuring high-acuity deteriorating victims and progressive hazards, "
            "evaluating intelligent multi-factor triage prioritization against naive FIFO dispatch."
        ),
        disaster_type=DisasterType.FLOOD,
        default_seed=101,
        recommended_rows=20,
        recommended_cols=20,
        civilian_count=8,
    ),
}


def get_all_scenarios() -> List[ScenarioInfo]:
    """Return list of all registered scenario templates."""
    return list(BUILTIN_SCENARIOS.values())


def get_scenario_by_id(scenario_id: str) -> ScenarioInfo | None:
    """Retrieve scenario info by identifier."""
    return BUILTIN_SCENARIOS.get(scenario_id)
