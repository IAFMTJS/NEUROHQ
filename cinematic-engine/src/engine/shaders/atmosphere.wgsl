// Atmosphere / volumetric multi-scattering stub. Can expand to full raymarch.

fn sampleAtmosphere(rayOrigin: vec3f, rayDir: vec3f, tMax: f32) -> vec3f {
  // Placeholder: return sky gradient
  let t = 0.5 + 0.5 * rayDir.y;
  return mix(vec3f(0.02, 0.04, 0.08), vec3f(0.3, 0.5, 0.7), t);
}

fn atmosphericDensity(p: vec3f) -> f32 {
  let h = max(0.0, p.y);
  return exp(-h * 0.1);
}
