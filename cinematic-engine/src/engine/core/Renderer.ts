/**
 * WebGPU Renderer: adapter/device init, canvas context, render loop.
 * Calls RenderGraph.execute each frame. No WebGL fallback.
 */

import { FrameResourcesImpl } from './FrameResources';
import { RenderGraph } from './RenderGraph';
import { GPUProfiler } from './GPUProfiler';
import { DynamicResolution } from './DynamicResolution';

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: 'low-power' | 'high-performance';
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = 'bgra8unorm';
  private frameResources: FrameResourcesImpl;
  private graph: RenderGraph;
  private profiler: GPUProfiler;
  private dynamicResolution: DynamicResolution;
  private running = false;
  private rafId = 0;
  private lastTime = 0;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this.frameResources = new FrameResourcesImpl();
    this.graph = new RenderGraph();
    this.profiler = new GPUProfiler();
    this.dynamicResolution = new DynamicResolution();
  }

  getGraph(): RenderGraph {
    return this.graph;
  }

  getFrameResources(): FrameResourcesImpl {
    return this.frameResources;
  }

  getProfiler(): GPUProfiler {
    return this.profiler;
  }

  getDynamicResolution(): DynamicResolution {
    return this.dynamicResolution;
  }

  async init(): Promise<boolean> {
    if (!navigator.gpu) {
      console.error('WebGPU is not supported.');
      return false;
    }
    this.adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (!this.adapter) {
      console.error('Failed to get GPUAdapter.');
      return false;
    }
    this.device = await this.adapter.requestDevice();
    if (!this.device) {
      console.error('Failed to get GPUDevice.');
      return false;
    }
    this.context = this.canvas.getContext('webgpu');
    if (!this.context) {
      console.error('Failed to get WebGPU canvas context.');
      return false;
    }
    this.format = navigator.gpu.getPreferredCanvasFormat?.() ?? 'bgra8unorm';
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });
    this.frameResources.setDevice(this.device);
    await this.profiler.init(this.device);
    this.resize();
    return true;
  }

  resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio ?? 1);
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.frameResources.setSize(w, h);
    this.frameResources.setResolutionScale(this.dynamicResolution.getScale());
  }

  start(): void {
    if (this.running || !this.device) return;
    this.running = true;
    this.lastTime = performance.now();
    const loop = (time: number) => {
      this.rafId = requestAnimationFrame(loop);
      const delta = (time - this.lastTime) / 1000;
      this.lastTime = time;
      this.frameResources.currentTime = time / 1000;
      this.frameResources.deltaTime = delta;
      this.resize();
      this.frameResources.clearTextures();
      const backbuffer = this.context!.getCurrentTexture();
      this.frameResources.setTexture('backbuffer', backbuffer);
      this.profiler.beginFrame();
      this.graph.execute(this.device!, this.frameResources);
      this.dynamicResolution.recordFrameTime(delta * 1000);
    };
    loop(performance.now());
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  getDevice(): GPUDevice | null {
    return this.device;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getFormat(): GPUTextureFormat {
    return this.format;
  }
}
