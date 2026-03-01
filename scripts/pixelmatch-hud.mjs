import fs from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { ssim } from "ssim.js";

const ROOT = process.cwd();
const goldenDir = path.join(ROOT, "tests", "visual", "golden");
const actualDir = path.join(ROOT, "tests", "visual", "actual");
const diffDir = path.join(ROOT, "tests", "visual", "diff");

const files = [
  { name: "ring-region.png", maxDiffPct: 0.02 },
  { name: "graph-region.png", maxDiffPct: 0.02 },
  { name: "button-region.png", maxDiffPct: 0.02 },
];

async function readPng(filePath) {
  const data = await fs.readFile(filePath);
  return PNG.sync.read(data);
}

async function compareOne(name, maxDiffPct) {
  const goldenPath = path.join(goldenDir, name);
  const actualPath = path.join(actualDir, name);
  const diffPath = path.join(diffDir, name.replace(".png", ".diff.png"));

  const [golden, actual] = await Promise.all([readPng(goldenPath), readPng(actualPath)]);

  if (golden.width !== actual.width || golden.height !== actual.height) {
    throw new Error(`${name}: size mismatch golden(${golden.width}x${golden.height}) vs actual(${actual.width}x${actual.height})`);
  }

  const diff = new PNG({ width: golden.width, height: golden.height });
  const diffPixels = pixelmatch(
    golden.data,
    actual.data,
    diff.data,
    golden.width,
    golden.height,
    { threshold: 0.08 }
  );

  const totalPixels = golden.width * golden.height;
  const diffPct = diffPixels / totalPixels;
  await fs.writeFile(diffPath, PNG.sync.write(diff));

  return {
    name,
    diffPct,
    passed: diffPct <= maxDiffPct,
  };
}

async function compareFullSsim() {
  const golden = await readPng(path.join(goldenDir, "hud-full.png"));
  const actual = await readPng(path.join(actualDir, "hud-full.png"));
  const result = ssim(
    { data: golden.data, width: golden.width, height: golden.height },
    { data: actual.data, width: actual.width, height: actual.height }
  );
  return result.mssim;
}

async function main() {
  await fs.mkdir(diffDir, { recursive: true });

  const regionResults = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    regionResults.push(await compareOne(file.name, file.maxDiffPct));
  }

  const mssim = await compareFullSsim();

  console.log("=== HUD Visual Diff Results ===");
  for (const result of regionResults) {
    console.log(`${result.name}: diff=${(result.diffPct * 100).toFixed(2)}% ${result.passed ? "PASS" : "FAIL"}`);
  }
  console.log(`full-screen SSIM: ${mssim.toFixed(4)} ${mssim >= 0.92 ? "PASS" : "FAIL"}`);

  const allRegionsPass = regionResults.every((r) => r.passed);
  const ssimPass = mssim >= 0.92;

  if (!allRegionsPass || !ssimPass) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

