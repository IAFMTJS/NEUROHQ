/**
 * Dynamic resolution: adjusts resolution scale based on frame time
 * to maintain target FPS. Used by the render graph for buffer sizes.
 */

export interface DynamicResolutionOptions {
  targetFrameTimeMS?: number;
  minScale?: number;
  maxScale?: number;
  step?: number;
}

const DEFAULT: Required<DynamicResolutionOptions> = {
  targetFrameTimeMS: 1000 / 60,
  minScale: 0.5,
  maxScale: 1,
  step: 0.05,
};

export class DynamicResolution {
  private options: Required<DynamicResolutionOptions>;
  private currentScale = 1;
  private lastFrameTimeMS = 0;

  constructor(options: DynamicResolutionOptions = {}) {
    this.options = { ...DEFAULT, ...options };
    this.currentScale = this.options.maxScale;
  }

  getScale(): number {
    return this.currentScale;
  }

  setScale(scale: number): void {
    this.currentScale = Math.max(
      this.options.minScale,
      Math.min(this.options.maxScale, scale)
    );
  }

  recordFrameTime(frameTimeMS: number): void {
    this.lastFrameTimeMS = frameTimeMS;
    const { targetFrameTimeMS, minScale, maxScale, step } = this.options;
    if (frameTimeMS > targetFrameTimeMS * 1.1 && this.currentScale > minScale) {
      this.currentScale = Math.max(minScale, this.currentScale - step);
    } else if (frameTimeMS < targetFrameTimeMS * 0.9 && this.currentScale < maxScale) {
      this.currentScale = Math.min(maxScale, this.currentScale + step);
    }
  }

  getLastFrameTimeMS(): number {
    return this.lastFrameTimeMS;
  }
}
