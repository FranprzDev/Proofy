import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../Background";
import { Bolt, Check, Contract, ShieldCheck } from "../Icons";
import { clamp, colors, fonts } from "../theme";

/** Frames each step stays in focus. */
const STEP = 70;
const ease = Easing.bezier(0.16, 1, 0.3, 1);

const steps = [
  { number: "01", label: "ACUERDO", Icon: Contract },
  { number: "02", label: "VERIFICACIÓN IA", Icon: ShieldCheck },
  { number: "03", label: "PAGO EN SOLANA", Icon: Bolt },
];

/** Opacity of a card phase that is visible during [start, start + STEP). */
const phase = (frame: number, start: number, last = false) =>
  last
    ? interpolate(frame, [start, start + 12], [0, 1], clamp)
    : interpolate(frame, [start, start + 12, start + STEP - 10, start + STEP], [0, 1, 1, 0], clamp);

export const FlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const active = Math.min(Math.floor(frame / STEP), steps.length - 1);

  return (
    <AbsoluteFill>
      <Background haloX={0.72} />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 160px", gap: 120 }}>
        {/* Step list */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 34, letterSpacing: "0.2em", color: colors.lime, marginBottom: 48 }}>CÓMO FUNCIONA</div>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 56 }}>
            <div style={{ position: "absolute", left: 43, top: 40, bottom: 40, width: 3, backgroundColor: "#ffffff14" }} />
            <div
              style={{
                position: "absolute",
                left: 43,
                top: 40,
                width: 3,
                height: interpolate(frame, [0, STEP * 2 + 20], [0, 100], { ...clamp, easing: ease }) + "%",
                maxHeight: "calc(100% - 80px)",
                backgroundColor: colors.lime,
                boxShadow: `0 0 20px ${colors.lime}`,
              }}
            />
            {steps.map(({ number, label, Icon }, i) => (
              <div
                key={number}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 40,
                  opacity: i === active ? 1 : i < active ? 0.55 : 0.28,
                  translate: interpolate(frame, [i * 8, i * 8 + 20], ["-40px 0px", "0px 0px"], { ...clamp, easing: ease }),
                }}
              >
                <div
                  style={{
                    zIndex: 1,
                    width: 90,
                    height: 90,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 26,
                    border: `2px solid ${i <= active ? colors.lime : "#ffffff30"}`,
                    backgroundColor: i === active ? colors.lime : colors.bg,
                    color: i === active ? "black" : colors.lime,
                  }}
                >
                  {i < active ? <Check size={46} strokeWidth={2.4} /> : <Icon size={46} strokeWidth={2} />}
                </div>
                <div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 28, color: "#ffffff70" }}>{number}</div>
                  <div style={{ fontFamily: fonts.heading, fontSize: 112, lineHeight: 0.95, color: i === active ? "white" : "#ffffffcc" }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proofy Engine card */}
        <div
          style={{
            width: 780,
            height: 700,
            position: "relative",
            overflow: "hidden",
            borderRadius: 36,
            border: "2px solid #beff0040",
            background: "linear-gradient(145deg, #1b211a, #0c100e 65%)",
            boxShadow: "0 40px 100px #000a, 0 0 90px #beff000f",
            fontFamily: fonts.body,
            opacity: interpolate(frame, [6, 26], [0, 1], clamp),
            translate: interpolate(frame, [6, 26], ["0px 60px", "0px 0px"], { ...clamp, easing: ease }),
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "34px 44px", borderBottom: "1px solid #ffffff12" }}>
            <div style={{ fontSize: 36, fontWeight: 500, color: "white" }}>Proofy Engine</div>
            <div style={{ fontFamily: fonts.mono, fontSize: 22, color: "#ffffff80", border: "1px solid #ffffff25", borderRadius: 999, padding: "8px 18px" }}>HITO 01 DE 03</div>
          </div>
          <div style={{ padding: "28px 44px 0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 40, color: "white" }}>Desarrollo de una API</div>
            <div style={{ fontFamily: fonts.mono, fontSize: 28, color: colors.lime }}>USDC</div>
          </div>

          {/* 01 — Acuerdo */}
          <AbsoluteFill style={{ top: 200, padding: "0 44px", opacity: phase(frame, 0) }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: "white" }}>Todo empieza con reglas claras.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 40 }}>
              {["Alcance definido", "Criterios de aceptación", "Fondos en escrow"].map((item, i) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    fontSize: 36,
                    color: "#ffffffd0",
                    padding: "18px 24px",
                    borderRadius: 18,
                    border: "1px solid #beff0030",
                    backgroundColor: "#beff000a",
                    opacity: interpolate(frame, [16 + i * 9, 24 + i * 9], [0, 1], clamp),
                    translate: interpolate(frame, [16 + i * 9, 24 + i * 9], ["30px 0px", "0px 0px"], { ...clamp, easing: ease }),
                  }}
                >
                  <Check size={36} color={colors.lime} strokeWidth={2.4} />
                  {item}
                </div>
              ))}
            </div>
          </AbsoluteFill>

          {/* 02 — Verificación */}
          <AbsoluteFill style={{ top: 232, padding: "0 44px", alignItems: "center", opacity: phase(frame, STEP) }}>
            <div style={{ position: "relative", width: 180, height: 180, display: "grid", placeItems: "center" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `2px dashed ${colors.lime}60`,
                  rotate: `${frame * 1.5}deg`,
                }}
              />
              <div style={{ width: 130, height: 130, display: "grid", placeItems: "center", borderRadius: 36, border: `2px solid ${colors.lime}80`, background: "#beff0018", color: colors.lime }}>
                <ShieldCheck size={76} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{ fontSize: 46, fontWeight: 700, color: "white", marginTop: 18 }}>Tu código habla por vos.</div>
            <div style={{ width: "100%", marginTop: 26, padding: "22px 26px", borderRadius: 18, border: "1px solid #beff0040", backgroundColor: "#beff000a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: colors.lime }}>
                <span>Criterios verificados</span>
                <span style={{ fontFamily: fonts.mono }}>
                  0{Math.round(interpolate(frame, [STEP + 12, STEP + 50], [0, 3], clamp))} / 03
                </span>
              </div>
              <div style={{ height: 10, marginTop: 16, borderRadius: 999, backgroundColor: "#ffffff12", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: interpolate(frame, [STEP + 12, STEP + 50], [0, 100], { ...clamp, easing: ease }) + "%",
                    backgroundColor: colors.lime,
                    boxShadow: `0 0 16px ${colors.lime}`,
                  }}
                />
              </div>
            </div>
          </AbsoluteFill>

          {/* 03 — Pago */}
          <AbsoluteFill style={{ top: 200, padding: "0 44px", alignItems: "center", opacity: phase(frame, STEP * 2, true) }}>
            <div style={{ fontSize: 46, fontWeight: 700, color: "white", textAlign: "center" }}>Entregaste. Verificaste. Cobraste.</div>
            <div
              style={{
                marginTop: 40,
                fontFamily: fonts.heading,
                fontSize: 190,
                lineHeight: 1,
                color: colors.lime,
                textShadow: `0 0 60px ${colors.lime}60`,
              }}
            >
              {Math.round(interpolate(frame, [STEP * 2 + 8, STEP * 2 + 40], [0, 1500], { ...clamp, easing: ease })).toLocaleString("es-AR")}
              <span style={{ fontSize: 80, marginLeft: 20 }}>USDC</span>
            </div>
            <div
              style={{
                marginTop: 30,
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: 32,
                color: "black",
                backgroundColor: colors.lime,
                padding: "16px 30px",
                borderRadius: 999,
                fontWeight: 700,
                scale: interpolate(frame, [STEP * 2 + 40, STEP * 2 + 52], [0.6, 1], { ...clamp, easing: Easing.spring({ damping: 10 }), output: "perceptual-scale" }),
                opacity: interpolate(frame, [STEP * 2 + 40, STEP * 2 + 46], [0, 1], clamp),
              }}
            >
              <Check size={34} strokeWidth={2.6} /> Liberado en Solana
            </div>
          </AbsoluteFill>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
