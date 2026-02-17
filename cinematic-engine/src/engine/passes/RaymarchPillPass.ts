/**
 * RaymarchPill pass: fullscreen SDF pill (reactor core), HDR output to scene.hdr
 */

import type { RenderPass } from '../core/types';
import type { FrameResourcesImpl } from '../core/FrameResources';

const WGSL = `
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
`;

const UNIFORM_SIZE = 4 * (1 + 1 + 2); // time, aspect, resolution (vec2)

export function createRaymarchPillPass(): RenderPass {
  let pipeline: GPURenderPipeline | null = null;
  let uniformBuffer: GPUBuffer | null = null;
  let bindGroup: GPUBindGroup | null = null;
  let outputTexture: GPUTexture | null = null;
  let lastWidth = 0;
  let lastHeight = 0;

  return {
    name: 'RaymarchPill',
    execute(device, encoder, frame) {
      const w = (frame as FrameResourcesImpl).getResolutionWidth();
      const h = (frame as FrameResourcesImpl).getResolutionHeight();
      const aspect = w / h;

      if (!pipeline) {
        const module = device.createShaderModule({ code: WGSL });
        pipeline = device.createRenderPipeline({
          layout: 'auto',
          vertex: { module, entryPoint: 'vs' },
          fragment: {
            module,
            entryPoint: 'fs',
            targets: [{ format: 'rgba16float' }],
          },
        });
      }

      if (!uniformBuffer) {
        uniformBuffer = device.createBuffer({
          size: UNIFORM_SIZE,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
      }

      const time = frame.currentTime;
      const uniformData = new ArrayBuffer(UNIFORM_SIZE);
      const view = new DataView(uniformData);
      view.setFloat32(0, time, true);
      view.setFloat32(4, aspect, true);
      view.setFloat32(8, w, true);
      view.setFloat32(12, h, true);
      device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      if (outputTexture && (lastWidth !== w || lastHeight !== h)) {
        outputTexture.destroy();
        outputTexture = null;
      }
      if (!outputTexture) {
        outputTexture = device.createTexture({
          size: [w, h, 1],
          format: 'rgba16float',
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        lastWidth = w;
        lastHeight = h;
      }

      if (!bindGroup) {
        bindGroup = device.createBindGroup({
          layout: pipeline!.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer! } }],
        });
      }

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: outputTexture!.createView(),
          clearValue: { r: 0.02, g: 0.04, b: 0.08, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(pipeline!);
      pass.setBindGroup(0, bindGroup!);
      pass.draw(3, 1);
      pass.end();

      (frame as FrameResourcesImpl).setTexture('scene.hdr', outputTexture!);
    },
  };
}
