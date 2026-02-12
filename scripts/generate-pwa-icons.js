/**
 * Generates PWA icons (192x192 and 512x512) in public/.
 * Run: node scripts/generate-pwa-icons.js [source-image.png]
 * If source image is provided, it is resized to both sizes; otherwise solid neuro-blue squares.
 * Requires: npm install sharp (dev)
 */
const path = require("path");

const neuroBlue = { r: 59, g: 130, b: 246 };
const publicDir = path.join(__dirname, "..", "public");

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("Run: npm install sharp --save-dev");
    process.exit(1);
  }

  const sourcePath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : null;
  let base = sourcePath
    ? sharp(sourcePath).resize(512, 512, { fit: "cover" })
    : sharp({
        create: {
          width: 512,
          height: 512,
          channels: 4,
          background: { ...neuroBlue, alpha: 1 },
        },
      });

  for (const size of [192, 512]) {
    const outPath = path.join(publicDir, `icon-${size}.png`);
    await base
      .clone()
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log("Written:", outPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
