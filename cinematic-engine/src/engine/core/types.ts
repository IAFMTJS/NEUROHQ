/**
 * Core types for the cinematic WebGPU engine.
 * WebGPU-only; no WebGL fallback.
 */

export interface RenderPass {
  name: string;
  execute(
    device: GPUDevice,
    encoder: GPUCommandEncoder,
    frame: FrameResources
  ): void;
}

export interface FrameResources {
  device: GPUDevice;
  queue: GPUQueue;
  currentTime: number;
  deltaTime: number;
  width: number;
  height: number;
  resolutionScale: number;
  getTexture(id: string): GPUTexture | undefined;
  setTexture(id: string, texture: GPUTexture): void;
}

export interface CameraParams {
  view: Float32Array;
  projection: Float32Array;
  viewProjection: Float32Array;
  position: [number, number, number];
  forward: [number, number, number];
  aspect: number;
  fovY: number;
  near: number;
  far: number;
}
