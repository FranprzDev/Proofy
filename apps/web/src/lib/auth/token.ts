// Minimal HMAC-SHA256 signed tokens: base64url(json).base64url(mac). Pure WebCrypto, no I/O.
const encoder = new TextEncoder();

const toB64Url = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
const fromB64Url = (value: string) => new Uint8Array(Buffer.from(value, "base64url"));

function hmacKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export async function signToken(payload: object, secret: string): Promise<string> {
  const body = toB64Url(encoder.encode(JSON.stringify(payload)));
  const mac = await crypto.subtle.sign("HMAC", await hmacKey(secret, "sign"), encoder.encode(body));
  return `${body}.${toB64Url(new Uint8Array(mac))}`;
}

/** Returns the parsed payload when the MAC is valid (constant-time), otherwise null. Callers validate the shape. */
export async function verifyToken(token: string, secret: string): Promise<unknown> {
  const [body, mac, extra] = token.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const ok = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret, "verify"),
    fromB64Url(mac) as BufferSource,
    encoder.encode(body),
  );
  if (!ok) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as unknown;
  } catch {
    return null;
  }
}
