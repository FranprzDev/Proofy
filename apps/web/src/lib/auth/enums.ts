/** Cookie names used by the stateless SIWS login. */
export enum SessionCookie {
  Session = "proofy_session",
  Nonce = "proofy_nonce",
}

/** Supported login methods (Phantom-only SIWS). */
export enum AuthMethod {
  SiwsPhantom = "siws-phantom",
}

/** Purpose bound into every signed token so a nonce token can never be used as a session (and vice versa). */
export enum TokenUse {
  Session = "session",
  Nonce = "nonce",
}
