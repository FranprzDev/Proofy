// Pure helpers for the release attestation flow (no I/O).
import { isVerdict, type Verdict } from "@/lib/agent/enums";
import { sha256 } from "../hash";

export type Ref = { milestone_id: string; contract_version: string; revision: string };
export type VerdictCheck = { authorized: boolean; refMatches: boolean; verdict: Verdict | null };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export function isRef(v: unknown): v is Ref {
  return (
    isRecord(v) &&
    typeof v.milestone_id === "string" &&
    typeof v.contract_version === "string" &&
    typeof v.revision === "string"
  );
}

/** Narrows the loosely typed agent response: authorization flag plus the echoed expected ref. */
export function checkVerdict(response: unknown, expected: Ref): VerdictCheck {
  if (!isRecord(response)) return { authorized: false, refMatches: false, verdict: null };
  const ref = response.expected;
  const refMatches =
    isRef(ref) &&
    ref.milestone_id === expected.milestone_id &&
    ref.contract_version === expected.contract_version &&
    ref.revision === expected.revision;
  return {
    authorized: response.attestation_authorized === true,
    refMatches,
    verdict: isVerdict(response.verdict) ? response.verdict : null,
  };
}

/** Deterministic evidence hash stored on-chain: sha256 of the canonical JSON sent to the agent. */
export async function evidenceHash(input: { expected: Ref; evidence_ref?: unknown; results?: unknown }): Promise<Uint8Array> {
  return sha256(JSON.stringify([input.expected, input.evidence_ref ?? null, input.results ?? []]));
}
