/**
 * Debug UI: simple overlay for toggles and values (quality tier, resolution, etc.)
 * Can be extended with a real UI library or DOM overlay.
 */

export type DebugUIOptions = {
  showFps?: boolean;
  showResolution?: boolean;
  showQualityTier?: boolean;
};

const defaultOptions: Required<DebugUIOptions> = {
  showFps: true,
  showResolution: true,
  showQualityTier: true,
};

export class DebugUI {
  private container: HTMLDivElement | null = null;
  private options: Required<DebugUIOptions>;
  private fps = 0;
  private frameCount = 0;
  private lastFpsTime = 0;

  constructor(options: DebugUIOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  mount(parent: HTMLElement = document.body): void {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 8px;
      left: 8px;
      font: 12px/1.4 monospace;
      color: #00ffa3;
      background: rgba(0,0,0,0.6);
      padding: 6px 10px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 9999;
    `;
    parent.appendChild(this.container);
  }

  unmount(): void {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }

  setFps(fps: number): void {
    this.fps = fps;
  }

  tick(time: number): void {
    this.frameCount++;
    const elapsed = (time - this.lastFpsTime) / 1000;
    if (elapsed >= 0.5) {
      this.fps = this.frameCount / elapsed;
      this.frameCount = 0;
      this.lastFpsTime = time;
    }
  }

  update(params: { width?: number; height?: number; qualityTier?: string }): void {
    if (!this.container) return;
    const parts: string[] = [];
    if (this.options.showFps) parts.push(`FPS: ${this.fps.toFixed(1)}`);
    if (this.options.showResolution && params.width != null && params.height != null) {
      parts.push(`${params.width}×${params.height}`);
    }
    if (this.options.showQualityTier && params.qualityTier) {
      parts.push(`Tier: ${params.qualityTier}`);
    }
    this.container.textContent = parts.join(' · ');
  }
}
