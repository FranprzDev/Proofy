import { AbsoluteFill, CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../Background";
import { clamp, colors, fonts } from "../theme";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Background haloY={0.5} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            opacity: interpolate(frame, [0, 14], [0, 1], clamp),
            scale: interpolate(frame, [0, 20], [0.8, 1], { ...clamp, easing: ease, output: "perceptual-scale" }),
          }}
        >
          <CanvasImage name="Logo" src={staticFile("proofy-lime.svg")} premountFor={fps} width={130} height={130} style={{ filter: `drop-shadow(0 0 30px ${colors.lime}66)` }} />
          <span style={{ fontFamily: fonts.logo, fontWeight: 700, fontSize: 110, color: "white" }}>Proofy</span>
        </div>
        <div style={{ marginTop: 50, fontFamily: fonts.heading, fontSize: 170, lineHeight: 1 }}>
          <div
            style={{
              color: "white",
              opacity: interpolate(frame, [12, 28], [0, 1], clamp),
              translate: interpolate(frame, [12, 28], ["0px 40px", "0px 0px"], { ...clamp, easing: ease }),
            }}
          >
            ENTREGAS VERIFICADAS.
          </div>
          <div
            style={{
              color: colors.lime,
              textShadow: `0 0 50px ${colors.lime}55`,
              opacity: interpolate(frame, [24, 40], [0, 1], clamp),
              translate: interpolate(frame, [24, 40], ["0px 40px", "0px 0px"], { ...clamp, easing: ease }),
            }}
          >
            PAGOS AUTOMÁTICOS.
          </div>
        </div>
        <div
          style={{
            marginTop: 64,
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "28px 56px",
            borderRadius: 999,
            backgroundColor: colors.lime,
            color: "black",
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: 48,
            boxShadow: `0 0 ${interpolate(frame % 45, [0, 22, 45], [30, 70, 30])}px ${colors.lime}80`,
            scale: interpolate(frame, [44, 60], [0.7, 1], { ...clamp, easing: Easing.spring({ damping: 11 }), output: "perceptual-scale" }),
            opacity: interpolate(frame, [44, 50], [0, 1], clamp),
          }}
        >
          Sumate al acceso temprano →
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 110,
            fontFamily: fonts.mono,
            fontSize: 30,
            letterSpacing: "0.2em",
            color: "#ffffff80",
            opacity: interpolate(frame, [60, 76], [0, 1], clamp),
          }}
        >
          ESCROW ON-CHAIN · VERIFICACIÓN CON IA · CONSTRUIDO EN SOLANA
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
