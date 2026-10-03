// Validated with: npx vgpu check --require-validation
export const VERIFICATION_CORE_SHADER = /* wgsl */ `
struct Params {
  resolution: vec2f,
  pointer: vec2f,
  time: f32,
  intro: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

const LIME = vec3f(0.745, 1.0, 0.0);
const TEAL = vec3f(0.32, 0.78, 0.62);
const TAU = 6.2831853;

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2f(1.0, 0.0)), u.x),
    mix(hash21(i + vec2f(0.0, 1.0)), hash21(i + vec2f(1.0, 1.0)), u.x),
    u.y,
  );
}

fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var v = 0.0;
  var a = 0.5;
  for (var i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.07 + vec2f(3.1, 1.7);
    a *= 0.5;
  }
  return v;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let res = params.resolution;
  let aspect = res.x / max(res.y, 1.0);
  let t = params.time;
  let m = (params.pointer - 0.5) * vec2f(aspect, 1.0);
  let p = (uv - 0.5) * vec2f(aspect, 1.0) - m * 0.06;
  let r = length(p);
  let a = atan2(p.y, p.x);

  // Swirling plasma in polar space.
  // Noise is sampled on the unit direction, not the angle, so there is no atan2 seam.
  let dir = p / max(r, 1e-4);
  let spin = mat2x2f(cos(t * 0.12), sin(t * 0.12), -sin(t * 0.12), cos(t * 0.12));
  let swirl = fbm(spin * dir * 1.8 + vec2f(r * 3.0 - t * 0.35, r * 2.0));
  var col = mix(TEAL, LIME, swirl) * pow(swirl, 2.2) * exp(-r * 3.4) * 1.5;

  // Orbiting dashed rings, each with its own speed and direction.
  for (var i = 0; i < 5; i++) {
    let fi = f32(i);
    let radius = 0.16 + fi * 0.085;
    let way = select(-1.0, 1.0, i % 2 == 0);
    let segments = 6.0 + fi * 6.0;
    let dash = smoothstep(0.35, 0.5, abs(fract(a / TAU * segments + way * t * (0.05 + fi * 0.02)) - 0.5) * 2.0);
    let ring = exp(-abs(r - radius) * (160.0 - fi * 18.0));
    col += mix(LIME, TEAL, fi / 5.0) * ring * mix(0.25, 1.0, dash) * (0.55 - fi * 0.07);
  }

  // Light rays leaking out of the core.
  let rays = pow(max(sin(a * 9.0 + fbm(dir * 2.0 + vec2f(0.0, t * 0.3)) * 4.0), 0.0), 24.0);
  col += LIME * rays * exp(-r * 3.2) * 0.35;

  // Hot core with a heartbeat.
  let beat = 0.85 + 0.15 * pow(sin(t * 1.6) * 0.5 + 0.5, 4.0);
  col += mix(LIME, vec3f(1.0), 0.35) * exp(-r * 14.0) * beat;
  col += LIME * exp(-r * 4.0) * 0.12 * beat;

  // Sparks drifting outward.
  let sparkCoord = vec2f(a / TAU * 48.0, r * 18.0 - t * 0.8);
  let sparkCell = floor(sparkCoord);
  let sparkSeed = hash21(sparkCell);
  let sparkLocal = fract(sparkCoord) - 0.5;
  let spark = step(0.92, sparkSeed) * exp(-dot(sparkLocal, sparkLocal) * 60.0) * smoothstep(0.75, 0.2, r);
  col += LIME * spark * 0.7;

  // Fade out well before the canvas edges so it melts into the page.
  let edge = smoothstep(0.5, 0.36, abs(uv.x - 0.5)) * smoothstep(0.5, 0.36, abs(uv.y - 0.5));
  col *= params.intro * edge;
  let alpha = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  return vec4f(min(col, vec3f(alpha)), alpha);
}
`;
