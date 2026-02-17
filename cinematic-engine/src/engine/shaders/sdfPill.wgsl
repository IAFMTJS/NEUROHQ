// SDF pill (rounded box / capsule) for reactor core. Internal falloff, procedural shimmer.

fn sdPill(p: vec3f, halfLen: f32, r: f32) -> f32 {
  let b = vec2f(p.x, p.z);
  let h = halfLen - r;
  let q = vec2f(length(vec2f(b.x, b.y)) - h, b.y);
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

fn sdPillGrad(p: vec3f, halfLen: f32, r: f32, eps: f32) -> vec3f {
  let e = vec3f(eps, 0.0, 0.0);
  return vec3f(
    sdPill(p + e.xyy, halfLen, r) - sdPill(p - e.xyy, halfLen, r),
    sdPill(p + e.yxy, halfLen, r) - sdPill(p - e.yxy, halfLen, r),
    sdPill(p + e.yyx, halfLen, r) - sdPill(p - e.yyx, halfLen, r)
  ) / (2.0 * eps);
}

// Internal falloff for subsurface-style glow
fn subsurfaceFalloff(sd: f32, thickness: f32) -> f32 {
  return exp(-max(0.0, -sd) / max(0.001, thickness));
}

// Procedural shimmer (time-based)
fn shimmer(uv: vec2f, t: f32) -> f32 {
  let s = sin(uv.x * 20.0 + t * 2.0) * sin(uv.y * 15.0 - t * 1.5);
  return s * 0.5 + 0.5;
}

// Chromatic offset for dispersion
fn spectralRefract(uv: vec2f, amount: f32) -> vec3f {
  return vec3f(
    uv.x - amount * 0.002,
    uv.x,
    uv.x + amount * 0.002
  );
}
