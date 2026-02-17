/**
 * Cinematic engine entry: mount canvas, init WebGPU Renderer,
 * build BeginMission scene graph, start loop.
 */

import { Renderer } from './engine/core';
import { buildBeginMissionScene } from './scene/BeginMissionScene';

async function main(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) {
    console.error('Missing #app');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  app.appendChild(canvas);

  const renderer = new Renderer({ canvas });
  const ok = await renderer.init();
  if (!ok) {
    app.textContent = 'WebGPU not supported.';
    return;
  }

  buildBeginMissionScene(renderer, {
    qualityTier: 'high',
    debug: true,
    exposure: 1.0,
  });

  renderer.start();
}

main().catch((e) => console.error(e));
