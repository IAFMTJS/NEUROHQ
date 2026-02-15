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

// 2. @types/three Cylindrical.d.ts (repair corrupted file with null bytes)
const cylindricalPath = path.join(
  root,
  "node_modules/@types/three/src/math/Cylindrical.d.ts"
);
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

if (fs.existsSync(cylindricalPath)) {
  const buf = fs.readFileSync(cylindricalPath);
  const hasNulls = buf.some((b) => b === 0);
  if (hasNulls || buf.length < 100) {
    fs.writeFileSync(cylindricalPath, cylindricalContent, "utf8");
    console.log("patched @types/three: repaired corrupted Cylindrical.d.ts");
  }
}
