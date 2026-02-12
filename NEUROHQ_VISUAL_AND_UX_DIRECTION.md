# NEUROHQ — Visual & UX Direction

**Purpose:** Align the full visual and interaction design with the product idea: nervous-system-aware, mood-adaptive, execution-focused, and optimized for ADHD/autism.

---

## 1. Design principles

1. **Calm, not frantic** — No auto-playing motion, no aggressive reds or urgency-by-default. Energy and urgency are surfaced only when relevant (e.g. avoidance alert, stabilize mode).  
2. **Clear hierarchy** — One primary action per screen where possible. Today’s tasks and “what’s next” are always obvious.  
3. **Reduced cognitive load** — Fewer choices per view; modes (LOW_ENERGY, HIGH_SENSORY, STABILIZE) further reduce options. No decorative clutter.  
4. **Consistent rhythm** — Same places for daily state, quote, tasks, and energy budget so the brain can automate navigation.  
5. **Respect sensory load** — HIGH_SENSORY mode = minimal UI, low contrast motion, no surprise animations, optional reduced color.  
6. **Identity and meaning** — Quarterly theme and daily quote feel part of the system, not tacked on; typography and tone support a “headquarters” / command-center feel without being military or cold.

---

## 2. Brand and color

- **Logo:** NEURO (silver/grey) + HQ (blue) — see Logo Naam.PNG. Use as anchor for palette.  
- **Primary palette:**  
  - Background: very dark (#0a0a0a – neuro-dark).  
  - Surface/cards: slightly lighter (#141414 – neuro-surface).  
  - Text primary: silver/light grey (#c0c0c0 – neuro-silver).  
  - Accent / CTAs / key info: blue (#3b82f6 – neuro-blue).  
- **Semantic:**  
  - Success / completion: muted green (e.g. #22c55e at 80% opacity).  
  - Caution (e.g. carry-over 3–4): amber, not red.  
  - Alert (avoidance, stabilize): soft red or amber, never flashing.  
- **HIGH_SENSORY:** Option to dim accent (blue at 60%) and reduce to monochrome + single accent; no decorative gradients.

---

## 3. Typography

- **Headings:** Sans-serif, medium weight, clear hierarchy (e.g. one bold for “Today”, rest regular). Avoid thin or display fonts for core UI.  
- **Body:** Highly readable size (min 16px for main content), comfortable line height (1.5–1.6).  
- **Quote of the day:** Slightly larger, serif optional for the quote only to differentiate from “system” UI; author/era in smaller sans.  
- **Numbers (energy, budget, time):** Tabular figures so they don’t shift layout; use for dashboard stats and lists.

---

## 4. Layout and structure

- **App shell:**  
  - Top: compact header with logo, optional “Today” date, and one primary action (e.g. “Check-in” for daily state).  
  - Main: single scrollable column on mobile; optional sidebar on desktop for nav (Dashboard, Tasks, Budget, Learning, Strategy, Settings).  
- **Dashboard (default view):**  
  - Block 1: Daily state (energy, focus, sensory) — compact sliders or chips; “Save” or auto-save.  
  - Block 2: Quote of the day (collapsible or always visible).  
  - Block 3: Energy budget “X / 100” with optional breakdown (tasks + calendar).  
  - Block 4: Today’s tasks (list; count respects mode – 2 in STABILIZE, 3 in LOW_ENERGY, etc.).  
  - Block 5: Optional “Next” (one focus block or next calendar event).  
- **Modes and layout:**  
  - **LOW_ENERGY:** Same structure, fewer tasks (max 3), heavy tasks hidden; consider slightly larger touch targets.  
  - **HIGH_SENSORY:** Minimal shell – only essential blocks, reduced chrome, no extra illustrations or icons.  
  - **DRIVEN:** Optional “Focus block” CTA; high-impact tasks surfaced first.  
  - **STABILIZE:** Only 2 tasks; “Add task” hidden or disabled with short explanation.

---

## 5. Components and patterns

- **Cards:** Subtle border or background step (surface vs dark); no heavy shadows.  
- **Buttons:** Primary = blue; secondary = outline or ghost. One primary per section.  
- **Forms:** Labels above fields; clear focus states (outline in blue); errors inline, not only toasts.  
- **Lists (tasks, budget, learning):** Same row pattern: title/description left, metadata or actions right; completion = checkbox + optional strikethrough.  
- **Sliders (energy, focus, sensory):** Large enough to tap; optional numeric display next to slider.  
- **Empty states:** Short, reassuring copy (“Nothing scheduled – add one task or take a rest”) and one action.  
- **Notifications / toasts:** Bottom or top, non-blocking; max 3/day for push already enforced in backend.

---

## 6. Motion and animation

- **Default:** Minimal. Prefer instant state changes or very short (150–200ms) opacity/transform for transitions.  
- **HIGH_SENSORY:** No motion beyond essential feedback (e.g. button press).  
- **Avoid:** Auto-playing carousels, parallax, or anything that moves without user action.  
- **Optional:** Subtle confetti or checkmark on task complete (can be turned off in settings).

---

## 7. Accessibility

- **Contrast:** Meet WCAG 2.1 AA for text on background (silver on dark; blue for focus/links).  
- **Focus:** Visible focus ring (blue) on all interactive elements; logical tab order.  
- **Screen readers:** Semantic HTML (headings, lists, landmarks); aria-labels where needed; “Today”, “Tasks”, “Energy budget” announced clearly.  
- **Reduced motion:** Respect `prefers-reduced-motion` (disable or shorten animations).  
- **Touch targets:** Min 44px for primary actions on mobile.

---

## 8. PWA and install

- **Icon:** Use APP Icon.PNG (penguin + brain/tech) for home screen and splash.  
- **Splash:** Same dark background + logo; no bright flash.  
- **Standalone:** App opens in standalone window; header can be minimal (no browser chrome).

---

## 9. Tone of voice (microcopy)

- **Neutral, supportive, clear.** No guilt (“You didn’t complete…”) or over-celebration.  
- **Examples:**  
  - Avoidance: “You have 3 tasks carried over. Want to pick one to focus on?”  
  - Stabilize: “Stabilize mode is on. Finish or reschedule the 2 tasks below before adding more.”  
  - Empty: “No tasks for today. Add one or enjoy the space.”  
  - Quote: Keep author and era; no extra commentary unless we add “On [topic]” as subtitle.

---

## 10. Summary: “What it should feel like”

- **Calm command center** — User knows where they are and what’s next.  
- **Adaptive** — On low energy or high sensory load, the app shrinks and simplifies, never pushes.  
- **Trustworthy** — Numbers (budget, rollover, weekly report) are clear and consistent.  
- **Meaningful** — Quote and quarterly theme feel integrated, not decorative.  
- **Inclusive** — Usable with reduced motion, keyboard-only, and screen readers; no flashing or overwhelming visuals.

Use this doc as the single reference for visual and UX decisions; update when new patterns or modes are added.

---

END OF VISUAL AND UX DIRECTION
