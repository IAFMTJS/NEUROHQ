# Neon Futuristic Gradient – Design Definition

**Purpose:** Single source of truth for the “neon futuristic” visual language in Commander HQ. Use this when implementing or reviewing UI so gradients, glow, and motion stay consistent.

---

## Definition

A **neon futuristic gradient** combines:

1. **Neon** – Bright, luminescent hues (electric blues, pinks, purples, greens) that suggest neon signs or LED displays; glowing, electric.
2. **Futuristic** – Forward-looking, speculative: sleek lines, abstract patterns, motion effects; otherworldly or tech-advanced.
3. **Gradient** – Smooth blend from one shade to another (e.g. deep purple → bright cyan) for depth and fluidity.

Together this evokes **high-tech, sci‑fi, cyberpunk**: metallic accents, holographic feel, dynamic light, advanced tech / space-age / digital immersion. References: *Blade Runner*, *Tron*, tech branding, digital art.

---

## Key components

| Term | Meaning |
|------|--------|
| **Neon** | Bright, saturated colors that read as “glowing” – not pastel. Often paired with blur or shadow to suggest emission. |
| **Futuristic** | Clean lines, subtle motion, glass/translucency, dark bases with bright accents. |
| **Gradient** | Smooth transitions (linear or radial) between 2–3 neon hues for depth and flow. |

---

## Application in NEUROHQ

- **Where it’s used:** Mission button, charts, status rings, glass cards, nav, modals, ambient background.
- **Design rule:** *Color lives in emission layers; UI surfaces stay mostly colorless glass.* Neon is in the glow/beam behind or around elements, not mixed into the glass fill (that would turn it pastel).

### Tokens (globals.css / visual-system)

| Token | Role |
|-------|------|
| `--hq-cyan` | Electric blue (#00f2ff) – left/cool side of gradients. |
| `--hq-purple` | Mid-tone (#7a5cff) – bridge between cyan and green. |
| `--hq-green` | Neon green (#00ffa3) – right/warm side. |
| `--neon-cyan`, `--neon-purple`, `--neon-green` | Same palette for mission button / emissive layers. |
| `--hq-glass-bg`, `--hq-glass-border`, `--hq-blur-*` | Glass surface (translucent, no color mixing). |

### Gradient pattern

- **Primary neon gradient:** `linear-gradient(90deg, var(--hq-cyan), var(--hq-purple), var(--hq-green))`.
- Use for: strokes, glow layers, chart lines, ring fills. Do **not** mix this with white/opacity on the same layer (avoid pastel).

### Glow

- **Neon feel:** `filter: blur(...)` on a separate layer behind the element; `box-shadow` or `text-shadow` with cyan/purple/green for halos.
- Example: `0 0 15px rgba(255,255,255,.9), 0 0 35px rgba(122,92,255,.9)`.

---

## In code (CSS)

```css
/* Neon gradient (stroke / glow layer) */
background: linear-gradient(90deg, #00f2ff, #7a5cff, #00ffa3);

/* Neon glow */
box-shadow: 0 0 20px rgba(0, 242, 255, 0.5), 0 0 40px rgba(122, 92, 255, 0.4);
```

---

## In the AI chatbot / assistant context

- **Visual appeal:** Gradients and glow in backgrounds, primary buttons, or response areas to feel dynamic and “AI / VR”.
- **UX:** Neon glow can guide attention (e.g. response bubbles, loading state) and signal “smart” or “processing”.
- **Consistency:** Use the same `--hq-*` / `--neon-*` tokens and the “emission behind glass” rule so the assistant matches the rest of Commander HQ.

---

*Last updated: design system reference for Commander HQ UI Kit and neon components.*
