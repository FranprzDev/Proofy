import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadComfortaa } from "@remotion/google-fonts/Comfortaa";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";

// Same palette and type as the landing (apps/web/src/app/globals.css).
export const fonts = {
  heading: loadBebas("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily,
  body: loadSpaceGrotesk("normal", { weights: ["400", "500", "700"], subsets: ["latin"] }).fontFamily,
  logo: loadComfortaa("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily,
  mono: loadSpaceMono("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily,
};

export const colors = {
  lime: "#BEFF00",
  teal: "#66c5a5",
  bg: "#080a08",
  card: "#11160f",
  outline: "#cbd0c5",
  muted: "rgba(255, 255, 255, 0.58)",
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
