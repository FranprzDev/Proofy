// Hand-written instruction builders for programs/frontier-escrow. Swappable for a Codama client later.
import {
  AccountRole,
  getArrayEncoder,
  getBooleanEncoder,
  getBytesEncoder,
  getStructEncoder,
  getU64Encoder,
  getU8Encoder,
  fixEncoderSize,
  type AccountMeta,
  type AccountSignerMeta,
  type Address,
  type Instruction,
  type ReadonlyUint8Array,
  type TransactionSigner,
} from "@solana/kit";
import { SYSTEM_PROGRAM, type EscrowAddresses } from "./constants";
import { sha256 } from "../hash";

/** Anchor discriminators = sha256("global:<name>")[..8], precomputed. Checked by verifyDiscriminators(). */
export const INSTRUCTION_DISCRIMINATORS = {
  initialize_config: Uint8Array.from([208, 127, 21, 1, 194, 190, 196, 70]),
  create_agreement: Uint8Array.from([220, 156, 65, 172, 252, 68, 74, 233]),
  accept_agreement: Uint8Array.from([69, 99, 1, 250, 152, 135, 196, 160]),
  fund_agreement: Uint8Array.from([107, 79, 10, 20, 10, 243, 34, 18]),
  release_milestone: Uint8Array.from([56, 2, 199, 164, 184, 108, 167, 222]),
  open_dispute: Uint8Array.from([137, 25, 99, 119, 23, 223, 161, 42]),
  resolve_dispute: Uint8Array.from([231, 6, 202, 6, 96, 103, 12, 230]),
} as const;

export async function anchorDiscriminator(preimage: string): Promise<Uint8Array> {
  return (await sha256(preimage)).subarray(0, 8);
}

/** Recomputes every instruction discriminator from its name and throws on mismatch. */
export async function verifyDiscriminators(): Promise<void> {
  for (const [name, expected] of Object.entries(INSTRUCTION_DISCRIMINATORS)) {
    const actual = await anchorDiscriminator(`global:${name}`);
    if (actual.length !== expected.length || actual.some((b, i) => b !== expected[i])) {
      throw new Error(`Discriminator mismatch for instruction ${name}`);
    }
  }
}

const hash32 = fixEncoderSize(getBytesEncoder(), 32);
const u64 = getU64Encoder();
const u8 = getU8Encoder();

function data(name: keyof typeof INSTRUCTION_DISCRIMINATORS, args: ReadonlyUint8Array = new Uint8Array()): Uint8Array {
  const disc = INSTRUCTION_DISCRIMINATORS[name];
  const out = new Uint8Array(disc.length + args.length);
  out.set(disc);
  out.set(args, disc.length);
  return out;
}

const writable = (a: Address): AccountMeta => ({ address: a, role: AccountRole.WRITABLE });
const readonly = (a: Address): AccountMeta => ({ address: a, role: AccountRole.READONLY });
const signer = (s: TransactionSigner, mut = false): AccountSignerMeta => ({
  address: s.address,
  role: mut ? AccountRole.WRITABLE_SIGNER : AccountRole.READONLY_SIGNER,
  signer: s,
});

function ix(programId: Address, accounts: readonly (AccountMeta | AccountSignerMeta)[], d: Uint8Array): Instruction {
  return { programAddress: programId, accounts, data: d };
}

export function createAgreementInstruction(
  p: EscrowAddresses & { client: TransactionSigner; provider: Address; agreementId: bigint; contractHash: ReadonlyUint8Array; amounts: readonly bigint[] },
): Instruction {
  const args = getStructEncoder([
    ["agreementId", u64],
    ["contractHash", hash32],
    ["amounts", getArrayEncoder(u64)], // Borsh Vec<u64>: u32 length prefix
  ]).encode({ agreementId: p.agreementId, contractHash: p.contractHash, amounts: [...p.amounts] });
  return ix(
    p.programId,
    [signer(p.client, true), readonly(p.provider), writable(p.agreement), readonly(SYSTEM_PROGRAM)],
    data("create_agreement", args),
  );
}

export function acceptAgreementInstruction(
  p: EscrowAddresses & { provider: TransactionSigner; contractHash: ReadonlyUint8Array },
): Instruction {
  return ix(p.programId, [signer(p.provider), writable(p.agreement)], data("accept_agreement", hash32.encode(p.contractHash)));
}

export function fundAgreementInstruction(p: EscrowAddresses & { client: TransactionSigner; vault: Address }): Instruction {
  return ix(
    p.programId,
    [signer(p.client, true), writable(p.agreement), writable(p.vault), readonly(SYSTEM_PROGRAM)],
    data("fund_agreement"),
  );
}

export function releaseMilestoneInstruction(
  p: EscrowAddresses & {
    attestor: TransactionSigner;
    config: Address;
    vault: Address;
    provider: Address;
    treasury: Address;
    index: number;
    evidenceHash: ReadonlyUint8Array;
  },
): Instruction {
  const args = getStructEncoder([
    ["index", u8],
    ["evidenceHash", hash32],
  ]).encode({ index: p.index, evidenceHash: p.evidenceHash });
  return ix(
    p.programId,
    [
      signer(p.attestor),
      readonly(p.config),
      writable(p.agreement),
      writable(p.vault),
      writable(p.provider),
      writable(p.treasury),
      readonly(SYSTEM_PROGRAM),
    ],
    data("release_milestone", args),
  );
}

export function openDisputeInstruction(p: EscrowAddresses & { signer: TransactionSigner; index: number }): Instruction {
  return ix(p.programId, [signer(p.signer), writable(p.agreement)], data("open_dispute", u8.encode(p.index)));
}

export function resolveDisputeInstruction(
  p: EscrowAddresses & {
    admin: TransactionSigner;
    config: Address;
    vault: Address;
    provider: Address;
    client: Address;
    treasury: Address;
    index: number;
    releaseToProvider: boolean;
  },
): Instruction {
  const args = getStructEncoder([
    ["index", u8],
    ["releaseToProvider", getBooleanEncoder()],
  ]).encode({ index: p.index, releaseToProvider: p.releaseToProvider });
  return ix(
    p.programId,
    [
      signer(p.admin),
      readonly(p.config),
      writable(p.agreement),
      writable(p.vault),
      writable(p.provider),
      writable(p.client),
      writable(p.treasury),
      readonly(SYSTEM_PROGRAM),
    ],
    data("resolve_dispute", args),
  );
}
