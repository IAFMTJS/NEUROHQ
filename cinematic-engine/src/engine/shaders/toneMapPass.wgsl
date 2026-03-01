// Tone map: HDR input -> ACES -> backbuffer (LDR)

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

fn acesFilm(x: vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}

struct Uniforms {
  exposure: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var hdrSampler: sampler;
@group(0) @binding(2) var hdrTexture: texture_2d<f32>;

@fragment
fn fs(in: VertexOutput) -> @location(0) vec4f {
  let hdr = textureSample(hdrTexture, hdrSampler, in.uv).rgb;
  let ldr = acesFilm(hdr * u.exposure);
  return vec4f(ldr, 1.0);
}
