import {
  getAddressEncoder,
  getProgramDerivedAddress,
  getU64Encoder,
  getUtf8Encoder,
  type Address,
} from "@solana/kit";

const utf8 = getUtf8Encoder();
const addr = getAddressEncoder();
const u64 = getU64Encoder(); // little-endian, matches agreement_id.to_le_bytes()

export async function findConfigPda(programId: Address): Promise<Address> {
  return (await getProgramDerivedAddress({ programAddress: programId, seeds: [utf8.encode("config")] }))[0];
}

export async function findAgreementPda(programId: Address, client: Address, agreementId: bigint): Promise<Address> {
  const seeds = [utf8.encode("agreement"), addr.encode(client), u64.encode(agreementId)];
  return (await getProgramDerivedAddress({ programAddress: programId, seeds }))[0];
}

export async function findVaultPda(programId: Address, agreement: Address): Promise<Address> {
  const seeds = [utf8.encode("vault"), addr.encode(agreement)];
  return (await getProgramDerivedAddress({ programAddress: programId, seeds }))[0];
}
