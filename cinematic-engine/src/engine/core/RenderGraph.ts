/**
 * Render graph: ordered list of passes. execute() runs each pass
 * with the same encoder (or one per pass) and updates frame resources.
 */

import type { RenderPass } from './types';
import type { FrameResourcesImpl } from './FrameResources';

export class RenderGraph {
  private passes: RenderPass[] = [];

  clear(): void {
    this.passes = [];
  }

  addPass(pass: RenderPass): void {
    this.passes.push(pass);
  }

  removePass(name: string): void {
    this.passes = this.passes.filter((p) => p.name !== name);
  }

  execute(device: GPUDevice, frame: FrameResourcesImpl): void {
    const encoder = device.createCommandEncoder({ label: 'RenderGraph' });
    for (const pass of this.passes) {
      pass.execute(device, encoder, frame as any);
    }
    device.queue.submit([encoder.finish()]);
  }
}
