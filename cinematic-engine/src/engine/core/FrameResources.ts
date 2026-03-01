/**
 * Per-frame resources: device, queue, dimensions, resolution scale,
 * and a texture registry for pass outputs (e.g. "gbuffer.albedo", "bloom.output").
 */

import type { FrameResources as IFrameResources } from './types';

export class FrameResourcesImpl implements IFrameResources {
  device!: GPUDevice;
  queue!: GPUQueue;
  currentTime = 0;
  deltaTime = 0;
  width = 1;
  height = 1;
  resolutionScale = 1;

  private textures = new Map<string, GPUTexture>();

  setDevice(device: GPUDevice): void {
    this.device = device;
    this.queue = device.queue;
  }

  setSize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
  }

  setResolutionScale(scale: number): void {
    this.resolutionScale = Math.max(0.1, Math.min(2, scale));
  }

  getResolutionWidth(): number {
    return Math.max(1, Math.floor(this.width * this.resolutionScale));
  }

  getResolutionHeight(): number {
    return Math.max(1, Math.floor(this.height * this.resolutionScale));
  }

  getTexture(id: string): GPUTexture | undefined {
    return this.textures.get(id);
  }

  setTexture(id: string, texture: GPUTexture): void {
    this.textures.set(id, texture);
  }

  clearTextures(): void {
    this.textures.clear();
  }
}
