#!/usr/bin/env node
/**
 * Generate CSS gradient stops from the cubic polynomial fit (linear RGB).
 * Usage: node scripts/mission-pill-gradient-stops.js
 * Output: CSS linear-gradient() with sRGB-converted hex stops.
 *
 * Cubic fit (t in [0,1], linear RGB):
 *   R(t) = -0.51t³ + 0.68t² - 0.63t + 0.52
 *   G(t) =  0.90t³ - 0.50t² + 0.34t + 0.17
 *   B(t) = -0.41t³ + 0.27t² - 0.08t + 0.99
 */

function linearToSrgb(c) {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function cubic(t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const r = -0.51 * t3 + 0.68 * t2 - 0.63 * t + 0.52;
  const g = 0.9 * t3 - 0.5 * t2 + 0.34 * t + 0.17;
  const b = -0.41 * t3 + 0.27 * t2 - 0.08 * t + 0.99;
  return [
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b)),
  ];
}

function toHex(r, g, b) {
  const sr = linearToSrgb(r);
  const sg = linearToSrgb(g);
  const sb = linearToSrgb(b);
  const hr = Math.round(Math.max(0, Math.min(1, sr)) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  const hg = Math.round(Math.max(0, Math.min(1, sg)) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  const hb = Math.round(Math.max(0, Math.min(1, sb)) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return `#${hr}${hg}${hb}`;
}

const numStops = 11; // 0, 0.1, 0.2, ..., 1.0
const stops = [];
for (let i = 0; i <= numStops; i++) {
  const t = i / numStops;
  const [r, g, b] = cubic(t);
  const hex = toHex(r, g, b);
  const pct = Math.round(t * 100);
  stops.push(`    ${hex} ${pct}%`);
}

const gradient = `linear-gradient(\n  90deg,\n${stops.join(",\n")}\n  )`;

console.log("/* Cubic fit: R/G/B polynomials, linear→sRGB, 11 stops */");
console.log(gradient);
console.log("");
console.log("Stops (t, hex):");
for (let i = 0; i <= numStops; i++) {
  const t = i / numStops;
  const [r, g, b] = cubic(t);
  console.log(`  ${t.toFixed(2)} → ${toHex(r, g, b)}`);
}
