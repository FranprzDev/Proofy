import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp, colors } from "./theme";

/** Punch-in zoom plus a lime flash at the start of a scene. */
export const Impact: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ scale: interpolate(frame, [0, 16], [1.1, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1), output: "perceptual-scale" }) }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: colors.lime, mixBlendMode: "screen", opacity: interpolate(frame, [0, 8], [0.35, 0], clamp) }} />
    </AbsoluteFill>
  );
};
