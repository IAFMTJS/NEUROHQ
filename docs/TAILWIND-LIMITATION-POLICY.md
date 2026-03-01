# Tailwind limitation policy — Commander UI

Visual identity is controlled by **`/styles/visual-system.css`** only.

## Tailwind is allowed ONLY for

- **Layout** — `flex`, `grid`, `flex-col`, `items-center`, `justify-between`, etc.
- **Spacing** — `p-4`, `m-2`, `gap-3`, `space-y-4`, `max-w-[420px]`, etc.
- **Typography sizing** — `text-sm`, `text-xl`, `font-semibold`, `tracking-wide`, etc.
- **Responsive behavior** — `sm:`, `md:`, `lg:`, etc.
- **Display / visibility** — `hidden`, `block`, `overflow-hidden`, etc.

## Tailwind is NOT allowed for

- **Shadows** — no `shadow-*`, `shadow-xl`, `shadow-[...]`
- **Blur** — no `backdrop-blur-*`
- **Gradients** — no `bg-gradient-*`, `linear-gradient` in Tailwind
- **Border glow / neon** — no `border-cyan-*`, `ring-cyan-*`
- **Glass effects** — use `.glass-card` from visual-system.css
- **Neon / CTA buttons** — use `.neon-button` or `<PrimaryButton>`
- **Bottom nav chrome** — use `.bottom-nav` or `<BottomNavigation>`

## Components

- **Cards** — `<GlassCard>` or `className="glass-card p-6"`
- **Primary CTA** — `<PrimaryButton>` or `className="neon-button ..."`
- **Bottom nav** — single `<BottomNavigation>` in dashboard layout; no duplicate navs.

## Consistency check (DevTools)

1. **Any card** — should only have `glass-card` (+ layout classes like `p-6`, `p-0`). No `shadow-*`.
2. **Any primary button** — should only have `neon-button` (+ layout). No `bg-gradient-*`.
3. **Bottom nav** — one instance, class `bottom-nav`.

Design changes = edit **`styles/visual-system.css`** only.
