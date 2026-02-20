/**
 * Post-install patches:
 * 1. three-stdlib: ESM build references _polyfill/uv1.js but npm only ships uv1.cjs
 * 2. @types/three: Cylindrical.d.ts can be corrupted (null bytes) - repair if needed
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

// 1. three-stdlib uv1.js
const uv1Path = path.join(root, "node_modules/three-stdlib/_polyfill/uv1.js");
const uv1Content = `import { version } from "./constants.js";

/** uv2 renamed to uv1 in r125
 * https://github.com/mrdoob/three.js/pull/25943
 */
export const UV1 = version >= 125 ? "uv1" : "uv2";
`;

if (!fs.existsSync(uv1Path)) {
  fs.writeFileSync(uv1Path, uv1Content, "utf8");
  console.log("patched three-stdlib: added missing _polyfill/uv1.js");
}

// 2. @types/three – repair corrupted .d.ts files (null bytes / BOM)
function repairIfCorrupted(filePath, validContent) {
  if (!fs.existsSync(filePath)) return;
  const buf = fs.readFileSync(filePath);
  const hasNulls = buf.some((b) => b === 0);
  const start = buf.length >= 7 ? buf.toString("utf8", 0, 7) : "";
  const validStart = start === "export " || start === "import ";
  if (hasNulls || !validStart || buf.length < 80) {
    fs.writeFileSync(filePath, validContent, "utf8");
    console.log("patched @types/three: repaired " + path.basename(filePath));
  }
}

const cylindricalPath = path.join(root, "node_modules/@types/three/src/math/Cylindrical.d.ts");
const cylindricalContent = `import { Vector3 } from "./Vector3.js";

export class Cylindrical {
    constructor(radius?: number, theta?: number, y?: number);

    /**
     * @default 1
     */
    radius: number;

    /**
     * @default 0
     */
    theta: number;

    /**
     * @default 0
     */
    y: number;

    set(radius: number, theta: number, y: number): Cylindrical;
    copy(other: Cylindrical): Cylindrical;
    setFromVector3(v: Vector3): Cylindrical;
    setFromCartesianCoords(x: number, y: number, z: number): Cylindrical;
    clone(): Cylindrical;
}
`;

const interpolantPath = path.join(root, "node_modules/@types/three/src/math/Interpolant.d.ts");
const interpolantContent = `export abstract class Interpolant {
 constructor(parameterPositions: any, sampleValues: any, sampleSize: number, resultBuffer?: any);

 parameterPositions: any;
 sampleValues: any;
 valueSize: number;
 resultBuffer: any;

 evaluate(time: number): any;
}
`;

const sphericalPath = path.join(root, "node_modules/@types/three/src/math/Spherical.d.ts");
const sphericalContent = `import { Vector3 } from "./Vector3.js";

export class Spherical {
 constructor(radius?: number, phi?: number, theta?: number);

 /**
  * @default 1
  */
 radius: number;

 /**
  * @default 0
  */
 phi: number;

 /**
  * @default 0
  */
 theta: number;

 set(radius: number, phi: number, theta: number): this;
 clone(): this;
 copy(other: Spherical): this;
 makeSafe(): this;
 setFromVector3(v: Vector3): this;
 setFromCartesianCoords(x: number, y: number, z: number): this;
}
`;

repairIfCorrupted(cylindricalPath, cylindricalContent);
repairIfCorrupted(interpolantPath, interpolantContent);
repairIfCorrupted(sphericalPath, sphericalContent);

// ExternalTexture.d.ts (often corrupted)
const externalTexturePath = path.join(root, "node_modules/@types/three/src/textures/ExternalTexture.d.ts");
const externalTextureContent = `import { Texture } from "./Texture.js";

declare class ExternalTexture extends Texture {
  sourceTexture: WebGLTexture | GPUTexture | null;
  readonly isExternalTexture: true;
  constructor(sourceTexture?: WebGLTexture | GPUTexture | null);
}

export { ExternalTexture };
`;
repairIfCorrupted(externalTexturePath, externalTextureContent);

// Any .d.ts with null bytes anywhere under node_modules: overwrite with minimal valid stub so TS parse succeeds (known npm/cache corruption)
function walkRecursive(dir, relRoot) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.name === "node_modules" && relRoot) continue; // don't recurse into nested node_modules
    if (ent.isDirectory()) walkRecursive(full, relRoot || dir);
    else if (ent.isFile() && ent.name.endsWith(".d.ts")) {
      const buf = fs.readFileSync(full);
      if (buf.some((b) => b === 0)) {
        fs.writeFileSync(full, "export {};\n", "utf8");
        console.log("patched (null bytes): " + path.relative(path.join(root, "node_modules"), full));
      }
    }
  }
}
walkRecursive(path.join(root, "node_modules"), null);
