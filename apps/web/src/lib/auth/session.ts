// TODO(auth): Phantom + SIWS (Sign-In With Solana) access. Connecting the wallet is not enough:
// the message signature must be verified and a session issued. See docs/arquitectura-web.md.
// Placeholder: until implemented, route handlers have no real identity.

export type Session = { wallet: string } | null;

export async function getSession(): Promise<Session> {
  return null;
}
