# Reference image vs current UI – comparison

Comparison of the provided reference (Commander HQ / Brain Status mockups) with the current implementation.

## Done (aligned with reference)

| Area | Reference | Current |
|------|-----------|---------|
| **Hero order** | Mascot → Commander HQ → Good evening, Commander → BEGIN MISSION → 3 stats | Same order: mascot, then HQHeader "Commander HQ", subtext greeting, single "BEGIN MISSION" CTA, then 3 thin circular stats (Energy, Focus, Load). |
| **Main title** | "Commander HQ" (medium, white, glow) | HQHeader shows "Commander HQ" as h1; "Good evening, Commander" as subtext (70% opacity). |
| **Primary CTA** | Single "BEGIN MISSION" button (5–6 layers, gradient #7C5CFF→#00E5FF) | One "BEGIN MISSION" link below title using `btn-hq-primary` + `neon-button`; links to /tasks or /assistant. |
| **3 circular stats** | Below CTA, 3 columns, Energy / Focus / Load, 3–4px ring | Three `RadialMeter` with `thin` (72px size, 4px stroke) below CTA; labels ENERGY, FOCUS, LOAD. |
| **Card grid** | 2x2: Missions, Energy, Budget, Growth, Strategy (icon, title, subtext) | `HQShortcutGrid`: 5 glass cards in 2-column grid with per-card glow variants; links to /tasks, /dashboard, /budget, /learning, /strategy. |
| **Bottom nav** | Inactive 50% opacity; active = cyan glow + small underline | Inactive `rgba(255,255,255,0.5)`; active = rectangle + glow + `::after` underline (20px wide, cyan). |
| **Brain Status** | Glass container with top border glow; progress bars below rings | Inner container: glass-style bg, top border glow; progress bars under rings. |
| **Canvas** | BACKGROUND.PNG, navy #05070F–#0B1220, radial glow, vignette | Body in visual-system.css; tokens and vignette updated. |

## Optional / not yet done

| Area | Reference | Suggestion |
|------|-----------|------------|
| **Status bar** | iOS-style at very top (time 22:41, battery 27% ZP), white, light transparency | Add a decorative status bar component at top of dashboard layout (e.g. time + optional battery) with `safe-area-inset-top`. |
| **Wat nu? block** | Not in reference hero; reference has only CTA + stats | WatNuBlock removed from top; could be re-added below shortcut grid as "What’s next?" if desired. |
| **ActiveMissionCard** | Reference cards 18–24px radius, glass | ActiveMissionCard still uses custom 32px and inline gradients; could be refactored to use `glass-card` + tokens for consistency. |
| **Nav tab count** | Reference: HQ, Missions, Budget, Growth, Strategy, Insights (6) | App has 8 tabs (adds Assistant, Settings); layout and styling are symmetric; no change required unless you want to hide or reorder. |

## Files changed in this pass

- `components/hq/HQHeader.tsx` – "Commander HQ" as title, greeting as subtext.
- `components/hq/RadialMeter.tsx` – `thin` variant (72px, 4px stroke, no description).
- `components/hq/HQShortcutGrid.tsx` – New 2x2-style grid (5 shortcut cards).
- `components/hq/BrainStatusCard.tsx` – Brain Status title uses `hq-title-variant-2`; inner container has top border glow.
- `app/(dashboard)/dashboard/page.tsx` – Hero order: mascot → header → BEGIN MISSION → 3 thin stats; added HQShortcutGrid; removed WatNuBlock from top.
- `styles/visual-system.css` – Active tab underline (`::after` on `.nav-item-active .nav-item-inner`).
- `components/hq/index.ts` – Export `HQShortcutGrid`.

## Quick checklist

- [x] Hero order matches reference
- [x] "Commander HQ" + "Good evening, Commander" title block
- [x] Single "BEGIN MISSION" CTA
- [x] 3 circular stats below CTA (thin ring)
- [x] 2x2 shortcut grid (Missions, Energy, Budget, Growth, Strategy)
- [x] Bottom nav: inactive 50%, active cyan + underline
- [x] Brain Status: glass container + top border glow
- [ ] Optional: status bar at top
- [ ] Optional: unify ActiveMissionCard with glass-card
