import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../Background";
import { clamp, colors, fonts } from "../theme";

const rise = (frame: number, start: number) => ({
  clipPath: `inset(0 0 ${interpolate(frame, [start, start + 18], [100, 0], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })}% 0)`,
  translate: interpolate(frame, [start, start + 18], ["0px 80px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
});

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Background haloX={0.7} />
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 180, gap: 10, fontFamily: fonts.heading, lineHeight: 0.95 }}>
        <div style={{ fontSize: 230, color: "white", ...rise(frame, 4) }}>EL TRABAJO</div>
        <div style={{ fontSize: 230, color: "white", ...rise(frame, 12) }}>EVOLUCIONA.</div>
        <div
          style={{
            fontSize: 230,
            color: colors.lime,
            textShadow: `0 0 50px ${colors.lime}55`,
            ...rise(frame, 42),
          }}
        >
          EL PAGO TAMBIÉN.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
