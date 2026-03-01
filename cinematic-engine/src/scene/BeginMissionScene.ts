/**
 * Begin Mission scene: builds the render graph (RaymarchPill -> Bloom -> ToneMap)
 * and runs it via the Renderer. Optional debug overlay.
 */

import type { Renderer } from '../engine/core';
import { createRaymarchPillPass } from '../engine/passes/RaymarchPillPass';
import { createBloomPass } from '../engine/passes/BloomPass';
import { createToneMapPass } from '../engine/passes/ToneMapPass';
import { getQualitySettings } from '../engine/quality/QualityTiers';
import type { QualityTier } from '../engine/quality/QualityTiers';
import { DebugUI } from '../engine/debug/DebugUI';

export interface BeginMissionSceneOptions {
  qualityTier?: QualityTier;
  debug?: boolean;
  exposure?: number;
}

export function buildBeginMissionScene(
  renderer: Renderer,
  options: BeginMissionSceneOptions = {}
): void {
  const { qualityTier = 'high', debug = false, exposure = 1.0 } = options;
  const settings = getQualitySettings(qualityTier);

  const graph = renderer.getGraph();
  graph.addPass(createRaymarchPillPass());
  graph.addPass(createBloomPass());
  graph.addPass(createToneMapPass({ exposure }));

  if (debug) {
    const debugUI = new DebugUI({ showFps: true, showResolution: true, showQualityTier: true });
    debugUI.mount(renderer.getCanvas().parentElement ?? document.body);
    const frameRes = renderer.getFrameResources();
    const updateDebug = (time: number) => {
      debugUI.tick(time);
      debugUI.setFps(1 / (frameRes.deltaTime || 0.001));
      debugUI.update({
        width: frameRes.width,
        height: frameRes.height,
        qualityTier,
      });
    };
    const raf = () => {
      requestAnimationFrame(raf);
      updateDebug(performance.now());
    };
    raf();
  }
}
