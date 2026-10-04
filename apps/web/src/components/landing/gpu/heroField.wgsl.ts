// Validated with: npx vgpu check --require-validation
export const HERO_FIELD_SHADER = /* wgsl */ `
struct Params {
  resolution: vec2f,
  pointer: vec2f,
  time: f32,
  intro: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

const LIME = vec3f(0.745, 1.0, 0.0);
const TEAL = vec3f(0.32, 0.78, 0.62);
const DEEP = vec3f(0.024, 0.032, 0.026);

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var v = 0.0;
  var a = 0.5;
  let rot = mat2x2f(0.8, 0.6, -0.6, 0.8);
  for (var i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.03 + vec2f(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

fn gridLine(coord: f32, width: f32) -> f32 {
  let w = fwidth(coord);
  let d = abs(fract(coord - 0.5) - 0.5);
  return 1.0 - smoothstep(width * w, (width + 1.5) * w, d);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let res = params.resolution;
  let aspect = res.x / max(res.y, 1.0);
  let t = params.time;
  let p = vec2f((uv.x - 0.5) * aspect, 0.5 - uv.y);
  let m = vec2f((params.pointer.x - 0.5) * aspect, 0.5 - params.pointer.y);

  // The pointer bends the field like a lens.
  let dm = p - m;
  let lens = exp(-dot(dm, dm) * 5.0);
  let q0 = p - dm * 0.18 * lens;

  // Domain-warped aurora: two warp layers feeding the final field.
  let q = vec2f(
    fbm(q0 * 1.5 + vec2f(0.0, t * 0.05)),
    fbm(q0 * 1.5 + vec2f(5.2, -t * 0.04)),
  );
  let r = vec2f(
    fbm(q0 * 1.3 + 4.0 * q + vec2f(1.7 - t * 0.07, 9.2)),
    fbm(q0 * 1.3 + 4.0 * q + vec2f(8.3, 2.8 + t * 0.05)),
  );
  let f = fbm(q0 * 1.1 + 3.5 * r);

  // Keep the energy on the right, away from the headline.
  let focusCenter = vec2f(aspect * 0.28, 0.12);
  let focus = smoothstep(1.35, 0.05, length((p - focusCenter) * vec2f(0.75, 1.1)));

  var col = DEEP;
  col = mix(col, TEAL * 0.28, clamp(f * f * 1.6, 0.0, 1.0) * focus);
  col += LIME * pow(f, 3.5) * 1.6 * focus * (0.45 + length(r));

  // Topographic contour lines riding the field.
  let contour = gridLine(f * 9.0 - t * 0.12, 0.6);
  col += LIME * contour * 0.16 * focus * smoothstep(0.35, 0.75, f);

  // Ledger blocks: cells that flash as if being verified.
  let cellCoord = (p - vec2f(0.0, t * 0.015)) * 22.0;
  let cell = floor(cellCoord);
  let local = fract(cellCoord) - 0.5;
  let seed = hash21(cell);
  let flash = pow(max(sin(t * (0.35 + seed * 0.5) + seed * 40.0), 0.0), 60.0);
  let box = 1.0 - smoothstep(0.26, 0.30, max(abs(local.x), abs(local.y)));
  let edge = box * (1.0 - smoothstep(0.18, 0.22, max(abs(local.x), abs(local.y))) * 0.85);
  col += LIME * (edge * 0.5 + box * 0.15) * flash * focus * step(0.7, seed) * smoothstep(-0.12, -0.02, p.y);

  // Perspective floor with blocks streaming toward the viewer.
  let horizon = -0.18;
  // Branchless so fwidth() stays in uniform control flow.
  let below = horizon - p.y;
  let z = 0.42 / max(below, 0.002);
  let gx = p.x * z * 1.4;
  let gz = z * 1.4 + t * 0.55;
  let lines = max(gridLine(gx, 0.4), gridLine(gz, 0.4));
  let floorFade = smoothstep(9.0, 1.5, z) * smoothstep(0.0, 0.08, below);
  let pulse = 0.6 + 0.4 * sin(gz * 0.6 - t * 1.4);
  col += mix(TEAL, LIME, 0.6) * lines * floorFade * 0.32 * pulse;
  let horizonGlow = exp(-abs(p.y - horizon) * 28.0);
  col += LIME * horizonGlow * 0.10 * (0.6 + 0.4 * focus);

  // Soft pointer light.
  col += LIME * lens * 0.06;

  // Vignette and a dimmer left side for headline contrast.
  let v = uv - 0.5;
  col *= 1.0 - dot(v, v) * 1.1;
  col *= mix(0.55, 1.0, smoothstep(0.05, 0.6, uv.x));

  // Film grain keeps the gradients from banding.
  col += (hash21(uv * res + fract(t) * 91.0) - 0.5) * 0.025;

  col = mix(DEEP, col, params.intro);
  return vec4f(max(col, vec3f(0.0)), 1.0);
}
`;
