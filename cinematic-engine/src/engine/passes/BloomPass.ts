/**
 * Bloom pass: stub. Reads scene.hdr, could apply blur/streak and add to scene.
 * For now a no-op so the graph runs; can be expanded to full blur later.
 */

import type { RenderPass } from '../core/types';
import type { FrameResourcesImpl } from '../core/FrameResources';

export function createBloomPass(): RenderPass {
  return {
    name: 'Bloom',
    execute(_device, _encoder, frame) {
      const hdr = (frame as FrameResourcesImpl).getTexture('scene.hdr');
      if (hdr) {
        (frame as FrameResourcesImpl).setTexture('bloom.output', hdr);
      }
    },
  };
}
