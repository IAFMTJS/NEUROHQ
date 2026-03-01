// Fullscreen pass: raymarch SDF pill (reactor core), HDR output

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VertexOutput {
  var out: VertexOutput;
  let v = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  out.position = vec4f(v[vi], 0.0, 1.0);
  out.uv = v[vi] * 0.5 + 0.5;
  return out;
}

fn sdPill(p: vec3f, halfLen: f32, r: f32) -> f32 {
  let b = vec2f(p.x, p.z);
  let h = halfLen - r;
  let q = vec2f(length(vec2f(b.x, b.y)) - h, b.y);
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

fn subsurfaceFalloff(sd: f32, thickness: f32) -> f32 {
  return exp(-max(0.0, -sd) / max(0.001, thickness));
}

struct Uniforms {
  time: f32,
  aspect: f32,
  resolution: vec2f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

@fragment
fn fs(in: VertexOutput) -> @location(0) vec4f {
  let uv = in.uv;
  let aspect = u.aspect;
  let ro = vec3f(0.0, 0.0, 3.0);
  let rd = normalize(vec3f((uv - 0.5) * vec2f(aspect, 1.0), -1.0));

  let halfLen = 0.4;
  let radius = 0.25;
  var t = 0.0;
  for (var i = 0; i < 64; i++) {
    let p = ro + rd * t;
    let d = sdPill(p, halfLen, radius);
    if (d < 0.0001) {
      let falloff = subsurfaceFalloff(d, 0.05);
      let shimmer = sin(uv.x * 20.0 + u.time * 2.0) * sin(uv.y * 15.0 - u.time * 1.5) * 0.5 + 0.5;
      let core = 0.8 + 0.4 * shimmer;
      let pink = vec3f(1.0, 0.2, 0.6);
      let cyan = vec3f(0.0, 0.95, 1.0);
      let teal = vec3f(0.0, 0.8, 0.6);
      let grad = mix(pink, mix(cyan, teal, uv.x), 0.5);
      let col = grad * core * falloff;
      return vec4f(col, 1.0);
    }
    t += max(d * 0.5, 0.001);
    if (t > 20.0) { break; }
  }
  let sky = vec3f(0.02, 0.04, 0.08);
  return vec4f(sky, 1.0);
}
