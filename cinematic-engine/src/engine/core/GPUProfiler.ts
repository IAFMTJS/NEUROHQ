/**
 * GPU profiler using timestamp queries when available.
 * Falls back to no-op when timestampWrites are not supported.
 */

export interface GPUProfilerResult {
  passName: string;
  startTimeMS: number;
  endTimeMS: number;
  durationMS: number;
}

export class GPUProfiler {
  private supported = false;
  private querySet: GPUQuerySet | null = null;
  private resolveBuffer: GPUBuffer | null = null;
  private readbackBuffer: GPUBuffer | null = null;
  private device: GPUDevice | null = null;
  private passIndex = 0;
  private maxPasses = 32;

  async init(device: GPUDevice): Promise<boolean> {
    this.device = device;
    // Timestamp queries are gated behind a WebGPU feature.
    // Some type definitions don't expose older/experimental limit flags.
    const hasTimestampQuery =
      typeof (device.features as unknown as { has?: (name: string) => boolean }).has === "function" &&
      device.features.has("timestamp-query");

    if (hasTimestampQuery) {
      try {
        this.querySet = device.createQuerySet({
          type: 'timestamp',
          count: this.maxPasses * 2,
        });
        const byteSize = this.maxPasses * 2 * 8;
        this.resolveBuffer = device.createBuffer({
          size: byteSize,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        });
        this.readbackBuffer = device.createBuffer({
          size: byteSize,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
        this.supported = true;
      } catch {
        this.supported = false;
      }
    }
    return this.supported;
  }

  isSupported(): boolean {
    return this.supported;
  }

  getTimestampWrites(passName: string): GPUComputePassTimestampWrites | GPURenderPassTimestampWrites | undefined {
    if (!this.supported || !this.querySet || this.passIndex >= this.maxPasses) return undefined;
    const startIndex = this.passIndex * 2;
    const endIndex = startIndex + 1;
    this.passIndex++;
    return {
      querySet: this.querySet,
      beginningOfPassWriteIndex: startIndex,
      endOfPassWriteIndex: endIndex,
    } as GPURenderPassTimestampWrites;
  }

  beginFrame(): void {
    this.passIndex = 0;
  }

  async resolve(encoder: GPUCommandEncoder): Promise<GPUProfilerResult[]> {
    const results: GPUProfilerResult[] = [];
    if (!this.supported || !this.device || !this.querySet || !this.resolveBuffer || !this.readbackBuffer) {
      return results;
    }
    if (this.passIndex === 0) return results;

    encoder.resolveQuerySet(this.querySet, 0, this.passIndex * 2, this.resolveBuffer, 0);
    encoder.copyBufferToBuffer(this.resolveBuffer, 0, this.readbackBuffer, 0, this.passIndex * 2 * 8);

    return results;
  }

  async readBack(): Promise<GPUProfilerResult[]> {
    if (!this.readbackBuffer) return [];
    await this.readbackBuffer.mapAsync(GPUMapMode.READ);
    const arr = new BigUint64Array(this.readbackBuffer.getMappedRange());
    const results: GPUProfilerResult[] = [];
    const timestampPeriod = (this.device as unknown as { limits?: { timestampPeriod?: number } })?.limits?.timestampPeriod ?? 1e-6;
    for (let i = 0; i < this.passIndex; i++) {
      const start = Number(arr[i * 2]) * timestampPeriod * 1000;
      const end = Number(arr[i * 2 + 1]) * timestampPeriod * 1000;
      results.push({
        passName: `pass_${i}`,
        startTimeMS: start,
        endTimeMS: end,
        durationMS: end - start,
      });
    }
    this.readbackBuffer.unmap();
    return results;
  }
}
