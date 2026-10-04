import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../Background";
import { clamp, colors, fonts } from "../theme";

// Same pipeline the landing's Architecture terminal prints.
const lines = [
  "Cliente + Proveedor → Next.js + Phantom",
  "→ Acuerdo bilateral con IA",
  "→ Frontier Agent (Python + LangGraph)",
  "   ├─ Agente Documental",
  "   └─ Agente CI/CD → GitHub PRs",
  "→ Pipeline aislado: ejecución y pruebas",
  "→ Verificación → Atestación técnica",
  "→ Programa Solana → Pago + Comisión ✓",
];
const LINE_DELAY = 9;
const CHARS_PER_FRAME = 3.2;

export const ArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Background haloY={0.6} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: 130,
            color: "white",
            opacity: interpolate(frame, [0, 14], [0, 1], clamp),
            translate: interpolate(frame, [0, 14], ["0px -30px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          }}
        >
          BAJO EL <span style={{ color: colors.lime }}>CAPÓ</span>
        </div>
        <div
          style={{
            width: 1440,
            borderRadius: 28,
            border: "2px solid #ffffff18",
            backgroundColor: "#0b0e0bf0",
            boxShadow: "0 40px 120px #000c, 0 0 80px #beff000c",
            overflow: "hidden",
            opacity: interpolate(frame, [4, 18], [0, 1], clamp),
            scale: interpolate(frame, [4, 22], [0.94, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1), output: "perceptual-scale" }),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 30px", borderBottom: "1px solid #ffffff12" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <span key={c} style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: c }} />
            ))}
            <span style={{ marginLeft: 20, fontFamily: fonts.mono, fontSize: 26, color: "#ffffff70" }}>proofy-engine — pipeline</span>
          </div>
          <div style={{ padding: "34px 44px 40px", fontFamily: fonts.mono, fontSize: 40, lineHeight: 1.6 }}>
            {lines.map((line, i) => {
              const typed = Math.max(0, Math.floor((frame - 12 - i * LINE_DELAY) * CHARS_PER_FRAME));
              const isLast = i === lines.length - 1;
              const typing = typed > 0 && typed < line.length;
              return (
                <div key={line} style={{ whiteSpace: "pre", color: isLast ? colors.lime : i === 0 ? "white" : "#d4dccb", minHeight: 64 }}>
                  {line.slice(0, typed)}
                  {typing ? <span style={{ color: colors.lime }}>▌</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
