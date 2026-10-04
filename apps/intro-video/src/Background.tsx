import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { colors } from "./theme";

const PARTICLES = Array.from({ length: 46 }, (_, i) => ({
  x: random(`x-${i}`) * 1920,
  y: random(`y-${i}`) * 1080,
  size: 2 + random(`s-${i}`) * 5,
  speed: 0.4 + random(`v-${i}`) * 1.6,
  phase: random(`p-${i}`) * Math.PI * 2,
}));

const blob = (frame: number, x: number, y: number, size: number, color: string, speed: number) => ({
  position: "absolute" as const,
  width: size,
  height: size,
  left: x - size / 2 + Math.sin(frame / (40 * speed)) * 160,
  top: y - size / 2 + Math.cos(frame / (52 * speed)) * 110,
  borderRadius: "50%",
  background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
  filter: "blur(40px)",
});

/** Aurora blobs, drifting particles and a streaming perspective floor, echoing the landing hero shader. */
export const Background: React.FC<{ readonly haloX?: number; readonly haloY?: number; readonly floor?: boolean }> = ({
  haloX = 0.5,
  haloY = 0.45,
  floor = true,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, overflow: "hidden" }}>
      <div style={blob(frame, 1920 * haloX, 1080 * haloY, 1300, "#beff0030", 1)} />
      <div style={blob(frame, 1920 * haloX + 380, 1080 * haloY - 260, 900, "#66c5a52a", 1.4)} />
      <div style={blob(frame, 1920 * (1 - haloX), 1080 * 0.9, 1000, "#beff0016", 0.8)} />

      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(#beff000b 1px, transparent 1px), linear-gradient(90deg, #beff000b 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          backgroundPosition: `0px ${frame * 0.8}px`,
          maskImage: "radial-gradient(ellipse at center, #000 20%, transparent 70%)",
        }}
      />

      {floor ? (
        <div style={{ position: "absolute", left: -600, right: -600, bottom: -40, height: 520, perspective: 700, maskImage: "linear-gradient(to bottom, transparent, #000 45%)" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "50% 100%",
              rotate: "x 68deg",
              backgroundImage: `linear-gradient(${colors.lime}55 2px, transparent 2px), linear-gradient(90deg, ${colors.lime}40 2px, transparent 2px)`,
              backgroundSize: "120px 120px",
              backgroundPosition: `0px ${frame * 7}px`,
            }}
          />
        </div>
      ) : null}

      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x + Math.sin(frame / 30 + p.phase) * 20,
            top: (((p.y - frame * p.speed) % 1080) + 1080) % 1080,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: colors.lime,
            boxShadow: `0 0 ${p.size * 3}px ${colors.lime}`,
            opacity: 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(frame / 12 + p.phase)),
          }}
        />
      ))}

      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 40%, #000000c8 100%)" }} />
    </AbsoluteFill>
  );
};
