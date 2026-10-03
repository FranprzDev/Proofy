import type { SVGProps } from "react";

const paths = {
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  shield: <><path d="m12 3 8 4v5c0 5-4 8-8 10-4-2-8-5-8-10V7l8-4Z" /><path d="m8 12 3 3 5-6" /></>,
  code: <><path d="m7 7-5 5 5 5m10-10 5 5-5 5m-4-14-2 18" /></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /></>,
  wallet: <><path d="M20 8H5a2 2 0 0 1 0-4h13v4M3 6v12a2 2 0 0 0 2 2h15V8" /><path d="M20 12h-5v4h5" /></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
  solana: <><path d="M6 5h15l-3 3H3l3-3Zm-3 6h15l3 3H6l-3-3Zm3 6h15l-3 3H3l3-3Z" fill="currentColor" stroke="none" /></>,
};

export type LandingIconName = keyof typeof paths;

export function LandingIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: LandingIconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
