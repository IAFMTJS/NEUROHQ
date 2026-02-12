# NEUROHQ — Lighthouse & PWA Manual Check

How to run Lighthouse and validate PWA installability. Run this before release or when changing manifest/SW.

---

## 1. Run Lighthouse

### Option A: Chrome DevTools

1. Open the deployed app (or `http://localhost:3000` with dev server running) in **Chrome**.
2. F12 → **Lighthouse** tab.
3. Select **Progressive Web App** (and optionally Performance, Accessibility).
4. Device: **Mobile** (recommended for PWA).
5. Click **Analyze page load**.

### Option B: CLI (Node)

```bash
npx lighthouse https://your-app.vercel.app --only-categories=pwa --output=html --output-path=./lighthouse-pwa-report.html
```

Open `lighthouse-pwa-report.html` in a browser. Use a **production URL** (HTTPS); localhost can be used but some PWA checks require HTTPS.

### Option C: PageSpeed Insights

1. Go to [PageSpeed Insights](https://pagespeed.web.dev/).
2. Enter your app URL (e.g. `https://neurohq.vercel.app`).
3. Run analysis. Check the **PWA** section in the report.

---

## 2. PWA checklist (target)

Use this to verify manually even if you don’t run Lighthouse.

### 2.1 Manifest

- [ ] **manifest.json or app/manifest.ts** — Served at `/manifest.webmanifest` or linked from document (e.g. `<link rel="manifest" href="/manifest.json">`). Root layout has `manifest: "/manifest.json"` in metadata.
- [ ] **name / short_name** — NEUROHQ.
- [ ] **start_url** — `/dashboard` (or `/`).
- [ ] **display** — `standalone` (or `minimal-ui`).
- [ ] **icons** — At least 192×192 and 512×512 (e.g. `/icon-192.png`, `/icon-512.png`).
- [ ] **theme_color / background_color** — Set (e.g. theme `#3b82f6`, background `#0a0a0a`).

### 2.2 Service worker

- [ ] **sw.js** — Registered (e.g. when user enables push in Settings). Scope `/`.
- [ ] **Push** — Receives push when sent (e.g. daily quote if push enabled).
- [ ] **Offline** — Optional: `/offline` page exists; SW can show it when offline (or “You’re offline” via navigator.onLine in app).

### 2.3 Installability

- [ ] **HTTPS** — App served over HTTPS in production.
- [ ] **Add to Home Screen** — Chrome (Android/Desktop) or Safari (iOS) shows “Install” or “Add to Home Screen”. After install, app opens in standalone window without browser UI.
- [ ] **Icons** — Home screen icon uses the 192 or 512 icon.

### 2.4 Scores to aim for

- **PWA:** ≥ 90 (Lighthouse PWA category).
- **Best effort:** Performance ≥ 50, Accessibility ≥ 90 (run separately).

---

## 3. Quick fixes if PWA fails

- **“Does not register a service worker”** — Ensure `sw.js` is registered (e.g. in Settings when enabling push). For install-only, some browsers allow manifest + icons without SW; for full score, register SW.
- **“Manifest doesn’t have a maskable icon”** — Add `purpose: "maskable"` to one icon in manifest (optional; improves icon on home screen).
- **“Page load is not fast enough”** — Optimize images, reduce JS; ensure production build.
- **“Redirects to login”** — Run Lighthouse on a URL that doesn’t redirect (e.g. `/login`) or run on an authenticated session (harder in CLI). Installability can still pass if start_url loads.

---

## 4. When to run

- **Before each release** — Quick Lighthouse PWA run on production URL.
- **After changing** `app/manifest.ts`, `public/manifest.json`, or `public/sw.js`.
- **After adding/removing** PWA-related meta tags or icons.
