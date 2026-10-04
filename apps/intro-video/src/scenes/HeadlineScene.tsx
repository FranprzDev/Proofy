import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../Background";
import { clamp, colors, fonts } from "../theme";

const slide = (frame: number, start: number) => ({
  clipPath: `inset(0 ${interpolate(frame, [start, start + 20], [100, 0], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })}% 0 0)`,
  translate: interpolate(frame, [start, start + 20], ["-60px 0px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
});

export const HeadlineScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Background haloX={0.85} haloY={0.3} />
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 180, fontFamily: fonts.heading, fontSize: 196, lineHeight: 1.02 }}>
        <div style={{ color: "white", ...slide(frame, 4) }}>ENTREGÁ CÓDIGO.</div>
        <div style={{ color: "transparent", WebkitTextStroke: `3px ${colors.outline}`, ...slide(frame, 20) }}>GENERÁ CONFIANZA.</div>
        <div style={{ color: colors.lime, ...slide(frame, 36) }}>
          COBRÁ SIN VUELTAS<span style={{ color: "white" }}>.</span>
        </div>
        <div
          style={{
            marginTop: 48,
            fontFamily: fonts.body,
            fontSize: 64,
            color: colors.muted,
            opacity: interpolate(frame, [64, 84], [0, 1], clamp),
            translate: interpolate(frame, [64, 84], ["0px 24px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          }}
        >
          Vos construís. <span style={{ color: "white" }}>La IA verifica.</span> <span style={{ color: colors.lime }}>Solana paga.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
