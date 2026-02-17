# Mascot & Engine Spec

Single reference for mascot assets, rendering pipeline, and engine direction.  
Assets live in **`New styling idea`**; app serves from **`public/mascots/`** (copy or symlink).

---

## 1. Rendering architecture

- **API:** WebGPU (cinematic-engine). Same pipeline as “WebGL” spec; all lighting, glow and depth from shader logic.
- **Pipeline:**
  - **Pass 1** – Background gradient + volumetric noise
  - **Pass 2** – Atmospheric depth plane
  - **Pass 3** – Mascot plane with lighting shader
  - **Pass 4** – UI panels in 3D space (slight Z offset)
  - **Postprocess** – Bloom (thresholded), ACES tonemap, subtle vignette

Current engine: `cinematic-engine` uses `RenderGraph`, `BloomPass`, `ToneMapPass` (ACES), gradient/atmosphere shaders. Mascot pass and full depth stack are the next extensions.

---

## 2. Mascot integration

The mascot is **not** a static PNG in the final vision; it must be:

- A **textured plane in 3D space**
- Slightly rotated on Y (2–4°)
- Positioned **lower in frame**
- Lit by the **same scene light as UI**

**Shader requirements:**

- Fresnel edge glow
- Subtle emissive mask (eyes or highlights only)
- Slight brightness response to cursor position

No static PNG look. Today the app uses 2D mascot images per page as a fallback; see asset mapping below.

---

## 3. Depth stack

Use **actual Z values** in the engine:

| Layer       | Z     |
|------------|-------|
| Background | -10   |
| Atmosphere | -5    |
| Mascot     | -2    |
| UI panels  | 0     |

- Camera: **mild perspective**, FOV **35–45°**.
- Keeps the scene “engineered” instead of flat.

---

## 4. Color system

- **3-point gradient:**
  - Top: deep indigo  
  - Mid: muted navy  
  - Bottom: near-black blue  

- **Accent:** Choose **one** – electric cyan **or** neon violet. Not both at equal intensity.

- Use accent only for:
  - Buttons  
  - Edge rim light  
  - Micro highlights  

- Mascot inherits accent through **rim light**.

Design tokens: `--accent-primary`, `--accent-cyan` in `app/globals.css`; gradient in `cinematic-engine/src/engine/shaders/gradient.wgsl`.

---

## 5. Button system (aligned with shader direction)

- Buttons as **3D planes**
- Shader-based gradient, **moving specular highlight**, bloom-threshold glow
- **Hover:** increase emissive; shift highlight slightly; scale 1.01–1.02 max
- **Click:** quick compress; lower emissive briefly
- No CSS glow stacking

---

## 6. Atmospheric details (game feel)

Add in final pass (all **&lt;10%** intensity):

- Blue-noise dithering
- Very subtle film grain
- Soft vignette
- Slight chromatic aberration (extremely subtle)

Subtle = cinematic; heavy = amateur.

---

## 7. Mascot behavior per page

- **Each page:** different pose texture, slight accent shift, **same lighting model**.
- **Optional:** Idle animation – very subtle float on Y; amplitude under 2px in world units (breathing, not bouncing).

---

## 8. Asset mapping – one mascot per page (files named after pages)

Source folder: **`New styling idea`**. Single source of truth: **`lib/mascots.ts`** (`MASCOT_FILE_BY_PAGE`).

| Page (route)   | File in “New styling idea”   | Served as (public/mascots/)     |
|----------------|------------------------------|----------------------------------|
| `dashboard`    | `Homepage Mascotte.png`       | `Homepage Mascotte.png`          |
| `tasks`        | `Mission page.png`            | `Mission page.png`               |
| `learning`     | `Growth page.png`             | `Growth page.png`                |
| `assistant`    | `page.png`                    | `page.png`                       |
| `analytics`    | `page.png`                    | `page.png`                       |
| `report`       | `page.png`                    | `page.png`                       |
| `budget`       | `Budget page.png`             | `Budget page.png`                |
| `strategy`     | `Strategy page.png`           | `Strategy page.png`              |
| `settings`     | `Settings page.png`           | `Settings page.png`              |
| —              | `Background.PNG`              | Background (body/background)    |

Copy **`New styling idea`** into **`public/mascots/`** so these paths resolve. Use **`HeroMascotImage`** with `page` (e.g. `page="tasks"`) or `variant`; both resolve via `lib/mascots.ts`. Dashboard hero: `components/commander/CommanderHomeHero.tsx`.
