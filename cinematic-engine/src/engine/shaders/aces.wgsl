// ACES filmic tone mapping (approximation). HDR -> LDR.

fn acesFilm(x: vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}

fn toneMapACES(hdr: vec3f) -> vec3f {
  return acesFilm(hdr);
}

fn toneMapACESExposure(hdr: vec3f, exposure: f32) -> vec3f {
  return acesFilm(hdr * exposure);
}
