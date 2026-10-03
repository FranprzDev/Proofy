import { address, type Address } from "@solana/kit";

export const SYSTEM_PROGRAM: Address = address("11111111111111111111111111111111");
export const MAX_MILESTONES = 8;

/** Program id plus the agreement PDA every instruction needs. */
export type EscrowAddresses = { programId: Address; agreement: Address };
