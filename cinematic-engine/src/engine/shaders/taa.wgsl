// TAA: motion vector jitter and history blend. Stub for full implementation.

fn taaProjectionJitter(jitterIndex: u32, size: vec2f) -> vec2f {
  // Halton 2,3
  let i = f32(jitterIndex);
  let x = fract(i * 0.5) * 2.0 - 1.0;
  let y = fract(i / 3.0) * 2.0 - 1.0;
  return vec2f(x, y) / size;
}

fn taaBlendHistory(current: vec3f, history: vec3f, blend: f32) -> vec3f {
  return mix(history, current, blend);
}
