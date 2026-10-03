/** Verdict values produced by the Python agent (schema `Verdict`). */
export enum Verdict {
  Favorable = "favorable",
  NeedsFix = "needs_fix",
  Inconclusive = "inconclusive",
}

export const isVerdict = (v: unknown): v is Verdict => Object.values(Verdict).includes(v as Verdict);
