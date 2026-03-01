// Common utilities: ACEScg, uv, fullscreen triangle

fn ndcToUv(ndc: vec2f) -> vec2f {
  return ndc * 0.5 + 0.5;
}

fn uvToNdc(uv: vec2f) -> vec2f {
  return uv * 2.0 - 1.0;
}

// Linear sRGB <-> ACEScg approximation
fn linearSrgbToAcescg(c: vec3f) -> vec3f {
  return vec3f(
    c.r * 0.662454 + c.g * 0.134004 + c.b * 0.156188,
    c.r * 0.272229 + c.g * 0.674082 + c.b * 0.053689,
    c.r * -0.005574 + c.g * 0.004060 + c.b * 1.010339
  );
}

fn acescgToLinearSrgb(c: vec3f) -> vec3f {
  return vec3f(
    c.r * 1.641023 + c.g * -0.324803 + c.b * -0.236425,
    c.r * -0.663662 + c.g * 1.615332 + c.b * 0.016756,
    c.r * 0.011722 + c.g * -0.008285 + c.b * 0.988395
  );
}

// Fullscreen triangle: v0(-1,-1), v1(3,-1), v2(-1,3)
fn fullscreenTriVertex(vertexIndex: u32) -> vec2f {
  const verts = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  return verts[vertexIndex];
}
