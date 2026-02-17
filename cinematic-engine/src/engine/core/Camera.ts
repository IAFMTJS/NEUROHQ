/**
 * Camera: view/projection matrices, aspect, fov, near/far.
 * Ortho or perspective; used by passes for view-projection uniform.
 */

export interface CameraOptions {
  aspect?: number;
  fovY?: number; // radians
  near?: number;
  far?: number;
  position?: [number, number, number];
  target?: [number, number, number];
  ortho?: boolean;
  orthoSize?: number;
}

const DEFAULT_OPTIONS: Required<CameraOptions> = {
  aspect: 16 / 9,
  fovY: Math.PI / 4,
  near: 0.1,
  far: 1000,
  position: [0, 0, 5],
  target: [0, 0, 0],
  ortho: false,
  orthoSize: 2,
};

export class Camera {
  aspect = DEFAULT_OPTIONS.aspect;
  fovY = DEFAULT_OPTIONS.fovY;
  near = DEFAULT_OPTIONS.near;
  far = DEFAULT_OPTIONS.far;
  position: [number, number, number] = [...DEFAULT_OPTIONS.position];
  target: [number, number, number] = [...DEFAULT_OPTIONS.target];
  ortho = DEFAULT_OPTIONS.ortho;
  orthoSize = DEFAULT_OPTIONS.orthoSize;

  private view = new Float32Array(16);
  private projection = new Float32Array(16);
  private viewProjection = new Float32Array(16);
  private forward: [number, number, number] = [0, 0, -1];

  constructor(options: CameraOptions = {}) {
    Object.assign(this, DEFAULT_OPTIONS, options);
    this.update();
  }

  setAspect(aspect: number): void {
    this.aspect = aspect;
    this.update();
  }

  setPosition(x: number, y: number, z: number): void {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this.update();
  }

  setTarget(x: number, y: number, z: number): void {
    this.target[0] = x;
    this.target[1] = y;
    this.target[2] = z;
    this.update();
  }

  update(): void {
    this.computeView();
    this.computeProjection();
    this.multiplyViewProjection();
  }

  getView(): Float32Array {
    return this.view;
  }

  getProjection(): Float32Array {
    return this.projection;
  }

  getViewProjection(): Float32Array {
    return this.viewProjection;
  }

  getForward(): [number, number, number] {
    return [...this.forward];
  }

  getParams(): {
    view: Float32Array;
    projection: Float32Array;
    viewProjection: Float32Array;
    position: [number, number, number];
    forward: [number, number, number];
    aspect: number;
    fovY: number;
    near: number;
    far: number;
  } {
    return {
      view: this.view,
      projection: this.projection,
      viewProjection: this.viewProjection,
      position: [...this.position],
      forward: [...this.forward],
      aspect: this.aspect,
      fovY: this.fovY,
      near: this.near,
      far: this.far,
    };
  }

  private computeView(): void {
    const [ex, ey, ez] = this.position;
    const [tx, ty, tz] = this.target;
    this.forward[0] = tx - ex;
    this.forward[1] = ty - ey;
    this.forward[2] = tz - ez;
    const len = Math.hypot(this.forward[0], this.forward[1], this.forward[2]) || 1;
    this.forward[0] /= len;
    this.forward[1] /= len;
    this.forward[2] /= len;

    const f = this.forward;
    const up = [0, 1, 0] as const;
    const r = [
      up[1] * f[2] - up[2] * f[1],
      up[2] * f[0] - up[0] * f[2],
      up[0] * f[1] - up[1] * f[0],
    ];
    const rlen = Math.hypot(r[0], r[1], r[2]) || 1;
    const u = [
      f[1] * r[2] - f[2] * r[1],
      f[2] * r[0] - f[0] * r[2],
      f[0] * r[1] - f[1] * r[0],
    ];

    const v = this.view;
    v[0] = r[0] / rlen;
    v[1] = u[0];
    v[2] = -f[0];
    v[3] = 0;
    v[4] = r[1] / rlen;
    v[5] = u[1];
    v[6] = -f[1];
    v[7] = 0;
    v[8] = r[2] / rlen;
    v[9] = u[2];
    v[10] = -f[2];
    v[11] = 0;
    v[12] = -(v[0] * ex + v[4] * ey + v[8] * ez);
    v[13] = -(v[1] * ex + v[5] * ey + v[9] * ez);
    v[14] = -(v[2] * ex + v[6] * ey + v[10] * ez);
    v[15] = 1;
  }

  private computeProjection(): void {
    const p = this.projection;
    if (this.ortho) {
      const s = this.orthoSize;
      const a = this.aspect;
      const n = this.near;
      const f = this.far;
      p[0] = 1 / (a * s);
      p[5] = 1 / s;
      p[10] = -2 / (f - n);
      p[11] = 0;
      p[14] = -(f + n) / (f - n);
      p[1] = p[2] = p[3] = p[4] = p[6] = p[7] = p[8] = p[9] = p[12] = p[13] = p[15] = 0;
      p[15] = 1;
    } else {
      const f = 1 / Math.tan(this.fovY / 2);
      const n = this.near;
      const far = this.far;
      const a = this.aspect;
      p[0] = f / a;
      p[5] = f;
      p[10] = -(far + n) / (far - n);
      p[11] = -1;
      p[14] = -(2 * far * n) / (far - n);
      p[1] = p[2] = p[3] = p[4] = p[6] = p[7] = p[8] = p[9] = p[12] = p[13] = p[15] = 0;
    }
  }

  private multiplyViewProjection(): void {
    const v = this.view;
    const p = this.projection;
    const vp = this.viewProjection;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        vp[i * 4 + j] =
          v[0 * 4 + j] * p[i * 4 + 0] +
          v[1 * 4 + j] * p[i * 4 + 1] +
          v[2 * 4 + j] * p[i * 4 + 2] +
          v[3 * 4 + j] * p[i * 4 + 3];
      }
    }
  }
}
