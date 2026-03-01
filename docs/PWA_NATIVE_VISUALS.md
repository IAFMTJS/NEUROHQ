# PWA native-looking visuals

How NEUROHQ is tuned so the installed PWA feels more like a native app (status bar, no white flashes, safe areas).

## Implemented

- **Viewport & theme**
  - `viewportFit: "cover"` and `themeColor: "#050810"` in `app/layout.tsx` so the status bar and system UI use the app’s dark colour.
  - `background-size: 120%` and `background-color` fallback in `globals.css` so full-screen backgrounds extend past the viewport and no white shows at edges.

- **Safe areas**
  - `body { padding-top: env(safe-area-inset-top); }` so content stays below the notch/status bar.
  - Other key containers use `env(safe-area-inset-*)` (see `globals.css`).
  - Install prompt uses `bottom: max(1rem, env(safe-area-inset-bottom))` so it sits above the home indicator on notched devices.

- **iOS / “Add to Home Screen”**
  - `metadata.appleWebApp` in `app/layout.tsx`: `capable: true`, `statusBarStyle: "black-translucent"`, `title: "NEUROHQ"` so the status bar blends with the app and the home screen title is correct.

- **Overscroll**
  - `overscroll-behavior: none` on `html` and `body` so iOS rubber-band doesn’t reveal white behind the content.

- **Manifest**
  - `display: "standalone"`, `orientation: "any"`, `background_color` and `theme_color` set; icons include a maskable 512px for Android.

- **Touch**
  - `touch-action: pan-y pinch-zoom` and `-webkit-touch-callout: none` to avoid accidental text selection and keep scrolling predictable.

## Optional / future ideas

- **Splash screen**
  - First paint already matches `background_color` and theme. For a custom splash image, use a dedicated start URL that shows a branded splash and then redirects to `/dashboard`, or rely on the OS using the maskable icon + background colour (current behaviour).

- **Maskable icon**
  - Ensure the 512×512 icon has a safe zone (e.g. important content within ~80% center) so Android’s maskable shape doesn’t crop it badly. Check with [Maskable.app](https://maskable.app/).

- **Dynamic theme-color**
  - Keep a single `themeColor` in viewport for consistency. If you add per-route colours later, use `generateViewport()` and/or a client-side `<meta name="theme-color">` update so the status bar doesn’t flash.

- **Standalone-only tweaks**
  - Use `(display-mode: standalone)` in CSS or a small script that sets `data-display-mode="standalone"` on `<html>` to add PWA-only spacing or hide browser-specific UI.

- **Input zoom on iOS**
  - To reduce auto-zoom on focus, use `font-size: 16px` (or larger) on inputs; avoid `maximum-scale=1` in the viewport so accessibility isn’t hurt.

- **Splash / loading**
  - If the first meaningful paint is slow, consider a minimal loading state that reuses the same background and theme colour so the transition from “splash” to app is seamless.

## Where it’s configured

| What              | Where |
|-------------------|--------|
| Viewport, theme   | `app/layout.tsx` (`viewport`, `metadata`) |
| Apple Web App    | `app/layout.tsx` (`metadata.appleWebApp`) |
| Manifest         | `app/manifest.ts`, `public/manifest.json` |
| Safe areas, overscroll, background | `app/globals.css` |
| Install banner   | `components/PwaInstallPrompt.tsx` |

After changing manifest, viewport, or PWA-related meta/head, reinstall or refresh the PWA on a device to verify (cache can hide updates).
