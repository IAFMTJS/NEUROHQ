# HUD Visual Regression

## Setup

- Ensure dev server is running on `http://127.0.0.1:3000`
- Place golden images in `tests/visual/golden/`:
  - `hud-full.png`
  - `ring-region.png`
  - `graph-region.png`
  - `button-region.png`

## Capture actual screenshots

```bash
npx playwright test tests/visual/hud.spec.ts
```

Outputs are written to `tests/visual/actual/`.

## Compare with golden images

```bash
node scripts/pixelmatch-hud.mjs
```

## Thresholds

- Pixelmatch threshold: `0.08`
- Per region diff must be `<= 2%`
- Full-screen SSIM must be `>= 0.92`

Diff outputs are written to `tests/visual/diff/`.

