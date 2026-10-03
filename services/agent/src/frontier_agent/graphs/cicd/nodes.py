from typing import Any

from frontier_agent.graphs.cicd.state import CicdState, ScenarioStatus
from frontier_agent.schemas import Verdict


def analyze(state: CicdState) -> dict[str, Any]:
    """Analysis: proposes a verdict from the evidence. Authorizes nothing."""
    if not state.results:
        return {"analysis": Verdict.INCONCLUSIVE, "observations": ["No pipeline evidence."]}
    statuses = {r.status for r in state.results}
    if ScenarioStatus.FAILED in statuses:
        failed = [r.scenario_id for r in state.results if r.status == ScenarioStatus.FAILED]
        return {
            "analysis": Verdict.NEEDS_FIX,
            "observations": [f"Failed scenarios: {', '.join(failed)}"],
        }
    if statuses != {ScenarioStatus.PASSED}:
        return {
            "analysis": Verdict.INCONCLUSIVE,
            "observations": ["Skipped tests or environment errors; not attributing failure."],
        }
    return {"analysis": Verdict.FAVORABLE}


def validate_and_authorize(state: CicdState) -> dict[str, Any]:
    """Validation: favorable requires evidence for the same milestone, version and revision."""
    verdict = state.analysis or Verdict.INCONCLUSIVE
    obs = list(state.observations)
    if verdict == Verdict.FAVORABLE and state.evidence_ref != state.expected:
        verdict = Verdict.INCONCLUSIVE
        obs.append("Evidence does not match the expected milestone, version and revision.")
    return {
        "verdict": verdict,
        "attestation_authorized": verdict == Verdict.FAVORABLE,
        "observations": obs,
    }
