import { address, isAddress } from "@solana/kit";
import { agent, AgentError } from "@/lib/agent/client";
import type { CicdEvidence, CicdRequest } from "@/lib/agent/types";
import { HttpStatus, jsonError } from "@/lib/http";
import { requireSession, unauthorized } from "@/lib/agent/route-helpers";
import { assertDevnetOnly, attestorClient, loadAttestor } from "@/lib/solana/attestor";
import { getEscrowProgramId } from "@/lib/solana/config";
import {
  fetchAgreement,
  MAX_MILESTONES,
  fetchConfig,
  findAgreementPda,
  findConfigPda,
  findVaultPda,
  MilestoneStatus,
  releaseMilestoneInstruction,
  verifyAccountDiscriminators,
  verifyDiscriminators,
} from "@/lib/solana/escrow";
import { checkVerdict, evidenceHash, type Ref } from "@/lib/solana/escrow/release";

export const dynamic = "force-dynamic";

// Evidence for Agent 2: every CicdInput field except `expected`, which the server builds from the body.
type Body = { agreement: string; index: number; evidence: CicdEvidence } & Ref;

const EVIDENCE_KEYS = [
  "evidence_ref",
  "pull_request",
  "expected_test_ids",
  "e2e_junit_xml",
  "results",
  "static",
  "clauses",
  "e2e_report_json",
] as const satisfies readonly (keyof CicdEvidence)[];

function parseBody(v: unknown): Body | null {
  if (typeof v !== "object" || v === null) return null;
  const b = v as Record<string, unknown>;
  const e = b.evidence;
  if (
    typeof b.agreement !== "string" || !isAddress(b.agreement) ||
    typeof b.index !== "number" || !Number.isInteger(b.index) || b.index < 0 || b.index >= MAX_MILESTONES ||
    typeof b.milestone_id !== "string" || typeof b.contract_version !== "string" || typeof b.revision !== "string" ||
    typeof e !== "object" || e === null || Array.isArray(e)
  ) return null;
  return b as unknown as Body;
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return unauthorized();
  }
  const body = parseBody(await request.json().catch(() => null));
  if (!body) return jsonError("Invalid request", HttpStatus.BadRequest);

  const attestor = await loadAttestor();
  if (!attestor) return jsonError("Attestor not configured", HttpStatus.ServiceUnavailable);

  try {
    await verifyDiscriminators();
    await verifyAccountDiscriminators();
    const programId = getEscrowProgramId();
    const client = attestorClient(attestor);
    await assertDevnetOnly(client);
    const agreementAddr = address(body.agreement);

    // On-chain pre-checks (the program enforces them again).
    const ag = await fetchAgreement(client.rpc, programId, agreementAddr);
    if (!ag) return jsonError("Agreement not found", HttpStatus.NotFound);
    if (session.wallet !== ag.client && session.wallet !== ag.provider) {
      return jsonError("Forbidden", HttpStatus.Forbidden);
    }
    if ((await findAgreementPda(programId, ag.client, ag.agreementId)) !== agreementAddr) {
      return jsonError("Agreement not found", HttpStatus.NotFound);
    }
    const milestone = ag.milestones[body.index];
    if (!ag.funded || !milestone || milestone.status !== MilestoneStatus.Pending) {
      return jsonError("Milestone not releasable", HttpStatus.Conflict);
    }
    const config = await fetchConfig(client.rpc, programId, await findConfigPda(programId));
    if (!config || config.attestor !== attestor.address) {
      return jsonError("Attestor not authorized on-chain", HttpStatus.ServiceUnavailable);
    }

    const expected: Ref = {
      milestone_id: body.milestone_id,
      contract_version: body.contract_version,
      revision: body.revision,
    };
    const evidence = Object.fromEntries(
      EVIDENCE_KEYS.filter((k) => body.evidence[k] !== undefined).map((k) => [k, body.evidence[k]]),
    ) as CicdEvidence;
    const input: CicdRequest = { ...evidence, expected };
    // Narrowed by checkVerdict: only attestation_authorized + a matching ref may release funds.
    const verdict: unknown = await agent.cicd(input);
    const check = checkVerdict(verdict, expected);
    if (!check.authorized || !check.refMatches) {
      return jsonError("Release not authorized", HttpStatus.Conflict, { verdict, authorized: check.authorized, refMatches: check.refMatches });
    }

    const ix = releaseMilestoneInstruction({
      programId,
      agreement: agreementAddr,
      attestor,
      config: await findConfigPda(programId),
      vault: await findVaultPda(programId, agreementAddr),
      provider: ag.provider,
      treasury: config.treasury,
      index: body.index,
      evidenceHash: await evidenceHash(input),
    });
    const result = await client.sendTransaction([ix]);
    return Response.json({ signature: result.context.signature });
  } catch (e) {
    if (e instanceof AgentError) return jsonError(e.message, e.status);
    return jsonError("Release failed", HttpStatus.BadGateway);
  }
}
