import { AbsoluteFill, CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../Background";
import { clamp, colors, fonts } from "../theme";

export const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* Shockwave ring behind the logo */}
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            border: `3px solid ${colors.lime}`,
            boxShadow: `0 0 60px ${colors.lime}80`,
            scale: interpolate(frame, [6, 50], [0.4, 3.2], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
            opacity: interpolate(frame, [6, 50], [0.9, 0], clamp),
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <CanvasImage
            name="Logo"
            src={staticFile("proofy-white.svg")}
            premountFor={fps}
            width={260}
            height={260}
            style={{
              filter: `drop-shadow(0 0 40px ${colors.lime}55)`,
              scale: interpolate(frame, [0, 24], [0.55, 1], { ...clamp, easing: Easing.spring({ damping: 12 }), output: "perceptual-scale" }),
              opacity: interpolate(frame, [0, 10], [0, 1], clamp),
            }}
          />
          <div
            style={{
              fontFamily: fonts.logo,
              fontWeight: 700,
              fontSize: 230,
              color: "white",
              letterSpacing: "-0.02em",
              clipPath: `inset(0 ${interpolate(frame, [16, 42], [100, 0], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })}% 0 0)`,
              translate: interpolate(frame, [16, 42], ["-40px 0px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
            }}
          >
            Proofy
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 230,
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontFamily: fonts.mono,
            fontSize: 40,
            letterSpacing: "0.2em",
            color: "#b0b9a4",
            opacity: interpolate(frame, [40, 56], [0, 1], clamp),
            translate: interpolate(frame, [40, 56], ["0px 20px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          }}
        >
          <span style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: colors.lime, boxShadow: `0 0 20px ${colors.lime}` }} />
          CÓDIGO → CONFIANZA
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
