import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSiwsMessage, checkSiwsFields, parseSiwsMessage, SIWS_STATEMENT, type SiwsFields } from "@/lib/auth/siws";
import { signToken, verifyToken } from "@/lib/auth/token";
import { decodeSignatures } from "@/lib/auth/verify";
import { ACCOUNT_DISCRIMINATORS, MilestoneStatus, verifyAccountDiscriminators, verifyDiscriminators } from "@/lib/solana/escrow";
import { INSTRUCTION_DISCRIMINATORS } from "@/lib/solana/escrow/instructions";
import { checkVerdict } from "@/lib/solana/escrow/release";

const now = Date.parse("2026-01-01T00:00:00Z");
const fields: SiwsFields = {
  domain: "proofy.test",
  address: "11111111111111111111111111111111",
  statement: SIWS_STATEMENT,
  uri: "https://proofy.test",
  chainId: "devnet",
  nonce: "abc123",
  issuedAt: new Date(now).toISOString(),
  expirationTime: new Date(now + 60_000).toISOString(),
};
const expect_ = { domain: "proofy.test", address: fields.address, chainId: "devnet", nonce: "abc123", now };

describe("siws", () => {
  it("round-trips and validates", () => {
    const parsed = parseSiwsMessage(buildSiwsMessage(fields));
    expect(parsed).toEqual(fields);
    expect(checkSiwsFields(fields, expect_)).toBeNull();
  });
  it("rejects tampering, wrong nonce, expiry", () => {
    expect(parseSiwsMessage(buildSiwsMessage(fields) + "\n")).toBeNull();
    expect(checkSiwsFields(fields, { ...expect_, nonce: "x" })).toBe("nonce");
    expect(checkSiwsFields(fields, { ...expect_, now: now + 120_000 })).toBe("expired");
    expect(checkSiwsFields({ ...fields, uri: "https://evil.test" }, expect_)).toBe("uri");
  });
});

describe("token", () => {
  const secret = "s".repeat(32);
  it("signs and verifies", async () => {
    const t = await signToken({ a: 1 }, secret);
    expect(await verifyToken(t, secret)).toEqual({ a: 1 });
    expect(await verifyToken(t, "z".repeat(32))).toBeNull();
    expect(await verifyToken(t.replace(/.$/, "A"), secret)).toBeNull();
    expect(await verifyToken(`${t}.x`, secret)).toBeNull();
  });
});

describe("decodeSignatures", () => {
  it("accepts 64-byte base64 and rejects junk", () => {
    const b64 = Buffer.alloc(64, 7).toString("base64");
    expect(decodeSignatures(b64)).toHaveLength(1);
    expect(decodeSignatures("nope")).toHaveLength(0);
  });
});

describe("escrow layout", () => {
  const idl = JSON.parse(readFileSync("../../programs/frontier-escrow/idl/frontier_escrow.json", "utf8"));
  it("discriminators match the IDL and sha256", async () => {
    for (const i of idl.instructions) {
      expect([...INSTRUCTION_DISCRIMINATORS[i.name as keyof typeof INSTRUCTION_DISCRIMINATORS]]).toEqual(i.discriminator);
    }
    for (const a of idl.accounts) {
      expect([...ACCOUNT_DISCRIMINATORS[a.name as keyof typeof ACCOUNT_DISCRIMINATORS]]).toEqual(a.discriminator);
    }
    await verifyDiscriminators();
    await verifyAccountDiscriminators();
  });
  it("milestone status bytes", () => {
    expect([MilestoneStatus.Pending, MilestoneStatus.Released, MilestoneStatus.Disputed, MilestoneStatus.Refunded]).toEqual([0, 1, 2, 3]);
  });
});

describe("checkVerdict", () => {
  const ref = { milestone_id: "m", contract_version: "1", revision: "r" };
  it("requires authorization and matching ref", () => {
    expect(checkVerdict({ attestation_authorized: true, expected: ref, verdict: "favorable" }, ref)).toMatchObject({ authorized: true, refMatches: true });
    expect(checkVerdict({ attestation_authorized: "true", expected: ref }, ref).authorized).toBe(false);
    expect(checkVerdict({ attestation_authorized: true, expected: { ...ref, revision: "x" } }, ref).refMatches).toBe(false);
  });
});

describe("phantom sign-in helpers", () => {
  it("builds a SIWS message the server accepts", async () => {
    const { buildSignInMessage, bytesToBase64 } = await import("@/lib/auth/phantom");
    const msg = buildSignInMessage({ address: fields.address, nonce: "abc123", host: "proofy.test", origin: "https://proofy.test", now });
    const parsed = parseSiwsMessage(msg);
    expect(parsed).not.toBeNull();
    expect(checkSiwsFields(parsed!, expect_)).toBeNull();
    const sig = new Uint8Array(64).fill(9);
    expect(decodeSignatures(bytesToBase64(sig))).toEqual([sig]);
  });
  it("detects user rejection", async () => {
    const { isUserRejection } = await import("@/lib/auth/phantom");
    expect(isUserRejection({ code: 4001, message: "User rejected" })).toBe(true);
    expect(isUserRejection(new Error("x"))).toBe(false);
  });
});
