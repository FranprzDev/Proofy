// TODO(auth): acceso con Phantom + SIWS (Sign-In With Solana). Conectar la wallet no basta:
// hay que verificar la firma del mensaje y emitir una sesión. Ver docs/arquitectura-web.md.
// Placeholder: hasta implementarlo, los route handlers no tienen identidad real.

export type Session = { wallet: string } | null;

export async function getSession(): Promise<Session> {
  return null;
}
