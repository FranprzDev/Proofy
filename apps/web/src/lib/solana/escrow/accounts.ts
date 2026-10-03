// Decoders for the Config and Agreement accounts (Borsh, preceded by an 8-byte Anchor discriminator).
import {
  fetchEncodedAccount,
  fixDecoderSize,
  getAddressDecoder,
  getArrayDecoder,
  getBase64Encoder,
  getBooleanDecoder,
  getBytesDecoder,
  getStructDecoder,
  getU16Decoder,
  getU64Decoder,
  getU8Decoder,
  type Address,
  type Base58EncodedBytes,
  type ReadonlyUint8Array,
  type Rpc,
  type GetProgramAccountsApi,
  type GetAccountInfoApi,
  type GetMultipleAccountsApi,
} from "@solana/kit";
import { MAX_MILESTONES } from "./constants";
import { anchorDiscriminator } from "./instructions";

export const ACCOUNT_DISCRIMINATORS = {
  Config: Uint8Array.from([155, 12, 170, 224, 30, 250, 204, 130]),
  Agreement: Uint8Array.from([83, 212, 5, 110, 225, 249, 197, 84]),
} as const;

export async function verifyAccountDiscriminators(): Promise<void> {
  for (const [name, expected] of Object.entries(ACCOUNT_DISCRIMINATORS)) {
    const actual = await anchorDiscriminator(`account:${name}`);
    if (actual.some((b, i) => b !== expected[i])) throw new Error(`Discriminator mismatch for account ${name}`);
  }
}

export const MilestoneStatus = { Pending: 0, Released: 1, Disputed: 2, Refunded: 3 } as const;
export const MILESTONE_STATUS_LABEL: Record<number, string> = { 0: "Pending", 1: "Released", 2: "Disputed", 3: "Refunded" };

export type Milestone = { amount: bigint; status: number; evidenceHash: ReadonlyUint8Array };
export type Agreement = {
  client: Address;
  provider: Address;
  agreementId: bigint;
  contractHash: ReadonlyUint8Array;
  providerAccepted: boolean;
  funded: boolean;
  milestoneCount: number;
  milestones: Milestone[]; // only the first milestoneCount entries
  bump: number;
  vaultBump: number;
};
export type EscrowConfig = { admin: Address; attestor: Address; treasury: Address; feeBps: number; bump: number };

const hash32 = fixDecoderSize(getBytesDecoder(), 32);
const milestoneDecoder = getStructDecoder([
  ["amount", getU64Decoder()],
  ["status", getU8Decoder()],
  ["evidenceHash", hash32],
]);
const agreementDecoder = getStructDecoder([
  ["client", getAddressDecoder()],
  ["provider", getAddressDecoder()],
  ["agreementId", getU64Decoder()],
  ["contractHash", hash32],
  ["providerAccepted", getBooleanDecoder()],
  ["funded", getBooleanDecoder()],
  ["milestoneCount", getU8Decoder()],
  ["milestones", getArrayDecoder(milestoneDecoder, { size: MAX_MILESTONES })],
  ["bump", getU8Decoder()],
  ["vaultBump", getU8Decoder()],
]);
const configDecoder = getStructDecoder([
  ["admin", getAddressDecoder()],
  ["attestor", getAddressDecoder()],
  ["treasury", getAddressDecoder()],
  ["feeBps", getU16Decoder()],
  ["bump", getU8Decoder()],
]);

function body(bytes: Uint8Array, expected: Uint8Array): Uint8Array | null {
  if (bytes.length < expected.length || expected.some((b, i) => bytes[i] !== b)) return null;
  return bytes.subarray(expected.length);
}

/** Returns null when the discriminator, length or contents are not a valid Agreement. */
export function decodeAgreement(bytes: Uint8Array): Agreement | null {
  const payload = body(bytes, ACCOUNT_DISCRIMINATORS.Agreement);
  if (!payload) return null;
  try {
    const a = agreementDecoder.decode(payload);
    if (a.milestoneCount < 1 || a.milestoneCount > MAX_MILESTONES) return null;
    return { ...a, milestones: a.milestones.slice(0, a.milestoneCount) };
  } catch {
    return null;
  }
}

export function decodeConfig(bytes: Uint8Array): EscrowConfig | null {
  const payload = body(bytes, ACCOUNT_DISCRIMINATORS.Config);
  if (!payload) return null;
  try {
    return configDecoder.decode(payload);
  } catch {
    return null;
  }
}

type AccountsRpc = Rpc<GetAccountInfoApi & GetMultipleAccountsApi & GetProgramAccountsApi>;

async function fetchOwned(rpc: AccountsRpc, programId: Address, at: Address): Promise<Uint8Array | null> {
  const account = await fetchEncodedAccount(rpc, at, { commitment: "confirmed" });
  // Treat on-chain data as untrusted: it must exist and be owned by the escrow program.
  if (!account.exists || account.programAddress !== programId) return null;
  return account.data;
}

export async function fetchAgreement(rpc: AccountsRpc, programId: Address, at: Address): Promise<Agreement | null> {
  const data = await fetchOwned(rpc, programId, at);
  return data ? decodeAgreement(data) : null;
}

export async function fetchConfig(rpc: AccountsRpc, programId: Address, at: Address): Promise<EscrowConfig | null> {
  const data = await fetchOwned(rpc, programId, at);
  return data ? decodeConfig(data) : null;
}

const AGREEMENT_CLIENT_OFFSET = 8n;
const AGREEMENT_PROVIDER_OFFSET = 40n;

/** Agreements where `wallet` is the client or the provider (two getProgramAccounts calls). */
export async function listAgreementsFor(
  rpc: AccountsRpc,
  programId: Address,
  wallet: Address,
): Promise<{ address: Address; agreement: Agreement }[]> {
  const b64 = getBase64Encoder();
  const found = new Map<Address, Agreement>();
  for (const offset of [AGREEMENT_CLIENT_OFFSET, AGREEMENT_PROVIDER_OFFSET]) {
    const rows = await rpc
      .getProgramAccounts(programId, {
        commitment: "confirmed",
        encoding: "base64",
        filters: [{ memcmp: { offset, bytes: wallet as unknown as Base58EncodedBytes, encoding: "base58" } }],
      })
      .send();
    for (const row of rows) {
      const agreement = decodeAgreement(Uint8Array.from(b64.encode(row.account.data[0])));
      if (agreement) found.set(row.pubkey, agreement);
    }
  }
  return [...found].map(([address, agreement]) => ({ address, agreement }));
}
