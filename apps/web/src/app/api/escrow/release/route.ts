import { address, isAddress } from "@solana/kit";
import { agent, AgentError } from "@/lib/agent/client";
import type { CicdInput } from "@/lib/agent/types";
import { requireSession, unauthorized } from "@/lib/agent/route-helpers";
import { attestorClient, loadAttestor } from "@/lib/solana/attestor";
import { getEscrowProgramId } from "@/lib/solana/config";
import {
  fetchAgreement,
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
type Evidence = Omit<CicdInput, "expected">;
type Body = { agreement: string; index: number; evidence: Evidence } & Ref;

const EVIDENCE_KEYS = [
  "evidence_ref",
  "pull_request",
  "expected_test_ids",
  "e2e_junit_xml",
  "results",
  "static",
  "clauses",
] as const satisfies readonly (keyof Evidence)[];

function parseBody(v: unknown): Body | null {
  if (typeof v !== "object" || v === null) return null;
  const b = v as Record<string, unknown>;
  const e = b.evidence;
  if (
    typeof b.agreement !== "string" || !isAddress(b.agreement) ||
    typeof b.index !== "number" || !Number.isInteger(b.index) || b.index < 0 || b.index > 7 ||
    typeof b.milestone_id !== "string" || typeof b.contract_version !== "string" || typeof b.revision !== "string" ||
    typeof e !== "object" || e === null
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
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const attestor = await loadAttestor();
  if (!attestor) return Response.json({ error: "Attestor not configured" }, { status: 503 });

  try {
    await verifyDiscriminators();
    await verifyAccountDiscriminators();
    const programId = getEscrowProgramId();
    const client = attestorClient(attestor);
    const agreementAddr = address(body.agreement);

    // On-chain pre-checks (the program enforces them again).
    const ag = await fetchAgreement(client.rpc, programId, agreementAddr);
    if (!ag) return Response.json({ error: "Agreement not found" }, { status: 404 });
    if (session.wallet !== ag.client && session.wallet !== ag.provider) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if ((await findAgreementPda(programId, ag.client, ag.agreementId)) !== agreementAddr) {
      return Response.json({ error: "Agreement not found" }, { status: 404 });
    }
    const milestone = ag.milestones[body.index];
    if (!ag.funded || !milestone || milestone.status !== MilestoneStatus.Pending) {
      return Response.json({ error: "Milestone not releasable" }, { status: 409 });
    }
    const config = await fetchConfig(client.rpc, programId, await findConfigPda(programId));
    if (!config || config.attestor !== attestor.address) {
      return Response.json({ error: "Attestor not authorized on-chain" }, { status: 503 });
    }

    const expected: Ref = {
      milestone_id: body.milestone_id,
      contract_version: body.contract_version,
      revision: body.revision,
    };
    const evidence = Object.fromEntries(
      EVIDENCE_KEYS.filter((k) => body.evidence[k] !== undefined).map((k) => [k, body.evidence[k]]),
    ) as Evidence;
    const input: CicdInput = { ...evidence, expected };
    // Narrowed by checkVerdict: only attestation_authorized + a matching ref may release funds.
    const verdict: unknown = await agent.cicd(input);
    const check = checkVerdict(verdict, expected);
    if (!check.authorized || !check.refMatches) {
      return Response.json({ error: "Release not authorized", verdict, ...check }, { status: 409 });
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
    if (e instanceof AgentError) return Response.json({ error: e.message }, { status: e.status });
    return Response.json({ error: "Release failed" }, { status: 502 });
  }
}
