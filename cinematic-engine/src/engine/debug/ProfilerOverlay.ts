/**
 * Profiler overlay: display GPU timing from GPUProfiler (timestamp query results).
 * Shown when debug overlay is enabled.
 */

export interface ProfilerEntry {
  passName: string;
  durationMS: number;
}

export class ProfilerOverlay {
  private container: HTMLDivElement | null = null;

  mount(parent: HTMLElement = document.body): void {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 8px;
      left: 8px;
      font: 11px/1.3 monospace;
      color: #00f2ff;
      background: rgba(0,0,0,0.6);
      padding: 6px 10px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 9998;
      max-height: 120px;
      overflow-y: auto;
    `;
    parent.appendChild(this.container);
  }

  unmount(): void {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }

  update(entries: ProfilerEntry[]): void {
    if (!this.container) return;
    if (entries.length === 0) {
      this.container.textContent = 'GPU profiler (no data)';
      return;
    }
    this.container.innerHTML = entries
      .map((e) => `<div>${e.passName}: ${e.durationMS.toFixed(2)} ms</div>`)
      .join('');
  }
}
