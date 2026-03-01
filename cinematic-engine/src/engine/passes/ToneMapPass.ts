/**
 * ToneMap pass: read scene.hdr, ACES tone map, write to backbuffer
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
`;

const UNIFORM_SIZE = 4;

export function createToneMapPass(options: { exposure?: number } = {}): RenderPass {
  const exposure = options.exposure ?? 1.0;
  let pipeline: GPURenderPipeline | null = null;
  let uniformBuffer: GPUBuffer | null = null;
  let sampler: GPUSampler | null = null;

  return {
    name: 'ToneMap',
    execute(device, encoder, frame) {
      const hdrTexture = (frame as FrameResourcesImpl).getTexture('scene.hdr');
      const backbuffer = (frame as FrameResourcesImpl).getTexture('backbuffer');
      if (!hdrTexture || !backbuffer) return;

      const format = backbuffer.format;
      if (!pipeline) {
        const module = device.createShaderModule({ code: WGSL });
        pipeline = device.createRenderPipeline({
          layout: 'auto',
          vertex: { module, entryPoint: 'vs' },
          fragment: {
            module,
            entryPoint: 'fs',
            targets: [{ format }],
          },
        });
      }

      if (!uniformBuffer) {
        uniformBuffer = device.createBuffer({
          size: UNIFORM_SIZE,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
      }
      const view = new DataView(new ArrayBuffer(UNIFORM_SIZE));
      view.setFloat32(0, exposure, true);
      device.queue.writeBuffer(uniformBuffer, 0, view.buffer);

      if (!sampler) {
        sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
      }
      const bindGroup = device.createBindGroup({
        layout: pipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer! } },
          { binding: 1, resource: sampler },
          { binding: 2, resource: hdrTexture.createView() },
        ],
      });

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: backbuffer.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(pipeline!);
      pass.setBindGroup(0, bindGroup!);
      pass.draw(3, 1);
      pass.end();
    },
  };
}
