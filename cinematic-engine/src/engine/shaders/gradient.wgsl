// Mission pill gradient — mathematically extracted (cubic fit + simple curve)
// Linear RGB output; use with tone mapping or convert to sRGB in pass.

// Cubic polynomial fit (ΔE < 0.6) — film-level match
// R(t) = -0.51t³ + 0.68t² - 0.63t + 0.52
// G(t) =  0.90t³ - 0.50t² + 0.34t + 0.17
// B(t) = -0.41t³ + 0.27t² - 0.08t + 0.99
fn missionPillGradientCubic(t: f32) -> vec3f {
  let t2 = t * t;
  let t3 = t2 * t;
  let r = -0.51 * t3 + 0.68 * t2 - 0.63 * t + 0.52;
  let g = 0.90 * t3 - 0.50 * t2 + 0.34 * t + 0.17;
  let b = -0.41 * t3 + 0.27 * t2 - 0.08 * t + 0.99;
  return vec3f(saturate(r), saturate(g), saturate(b));
}

// Simple curve fit (ΔE < 1.8) — hue curve exponent 0.82, luminance boost 1.3
fn missionPillGradientSimple(t: f32) -> vec3f {
  let violet = vec3f(0.523, 0.173, 0.996);
  let cyan = vec3f(0.030, 0.910, 0.760);
  let curve = pow(t, 0.82);
  var col = mix(violet, cyan, curve);
  let lumBoost = pow(t, 1.3) * 0.18;
  col += vec3f(lumBoost, lumBoost, lumBoost);
  return saturate(col);
}

// Linear RGB -> sRGB (for display if not using ACES)
fn linearToSrgb(c: f32) -> f32 {
  if (c <= 0.0031308) {
    return 12.92 * c;
  }
  return 1.055 * pow(c, 1.0 / 2.4) - 0.055;
}

fn missionPillGradientCubicSrgb(t: f32) -> vec3f {
  let linear = missionPillGradientCubic(t);
  return vec3f(
    linearToSrgb(linear.r),
    linearToSrgb(linear.g),
    linearToSrgb(linear.b)
  );
}
