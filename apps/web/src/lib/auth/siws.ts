// Sign-In With Solana message format (EIP-4361 style). Pure: shared by the browser and the server.
export const SIWS_STATEMENT = "Sign in to Proofy. This request does not trigger a transaction or cost any fees.";
export const SIWS_TTL_MS = 5 * 60 * 1000;

export type SiwsFields = {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  chainId: string;
  nonce: string;
  issuedAt: string; // ISO 8601
  expirationTime: string; // ISO 8601
};

export function buildSiwsMessage(f: SiwsFields): string {
  return [
    `${f.domain} wants you to sign in with your Solana account:`,
    f.address,
    "",
    f.statement,
    "",
    `URI: ${f.uri}`,
    "Version: 1",
    `Chain ID: ${f.chainId}`,
    `Nonce: ${f.nonce}`,
    `Issued At: ${f.issuedAt}`,
    `Expiration Time: ${f.expirationTime}`,
  ].join("\n");
}

const LINE = "([^\\n]+)";
const PATTERN = new RegExp(
  `^${LINE} wants you to sign in with your Solana account:\\n${LINE}\\n\\n${LINE}\\n\\n` +
    `URI: ${LINE}\\nVersion: 1\\nChain ID: ${LINE}\\nNonce: ${LINE}\\nIssued At: ${LINE}\\nExpiration Time: ${LINE}$`,
);

export function parseSiwsMessage(message: string): SiwsFields | null {
  const m = PATTERN.exec(message);
  if (!m) return null;
  const [, domain, address, statement, uri, chainId, nonce, issuedAt, expirationTime] = m;
  const fields = { domain, address, statement, uri, chainId, nonce, issuedAt, expirationTime };
  // Canonical form only: re-serialising must reproduce the signed text byte for byte.
  return buildSiwsMessage(fields) === message ? fields : null;
}

export type SiwsExpectations = { domain: string; address: string; chainId: string; nonce: string; now: number };

/** Field-level checks (domain, address, chain, nonce, validity window). Returns an error string or null. */
export function checkSiwsFields(f: SiwsFields, e: SiwsExpectations): string | null {
  if (f.domain !== e.domain) return "domain";
  if (f.address !== e.address) return "address";
  if (f.chainId !== e.chainId) return "chain";
  if (f.nonce !== e.nonce) return "nonce";
  if (f.statement !== SIWS_STATEMENT) return "statement";
  let uriHost: string;
  try {
    uriHost = new URL(f.uri).host;
  } catch {
    return "uri";
  }
  if (uriHost !== e.domain) return "uri";
  const issued = Date.parse(f.issuedAt);
  const expires = Date.parse(f.expirationTime);
  if (Number.isNaN(issued) || Number.isNaN(expires)) return "time";
  if (issued > e.now + 60_000 || e.now > expires || expires - issued > SIWS_TTL_MS) return "expired";
  return null;
}
