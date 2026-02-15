# NEUROHQ — Full Action Plan: Mood-Based UI, Themes, Analytics, State Machine & Performance

**Purpose:** Single game plan for mood-based UI, 3 visual themes (× dark/light), user-selectable emotion, animations, personal analytics, adaptive system, state machine (idle/focus/reward/error), XP, mood mapping, and lazy loading/caching. No half work — full preparation and execution roadmap.

---

## Table of Contents

1. [Overview & Principles](#1-overview--principles)
2. [Mood-Based UI & Emotion Assets](#2-mood-based-ui--emotion-assets)
3. [Theme System: 3 Themes × Dark/Light](#3-theme-system-3-themes--darklight)
4. [User-Selectable Emotion & Visual Style](#4-user-selectable-emotion--visual-style)
5. [Modular Animations & Mascot Animations](#5-modular-animations--mascot-animations)
6. [Personal Analytics](#6-personal-analytics)
7. [Adaptive & Smart Adaptive System](#7-adaptive--smart-adaptive-system)
8. [State Machine, XP, Mood Mapping & Input Reaction](#8-state-machine-xp-mood-mapping--input-reaction)
9. [Lazy Loading & Caching](#9-lazy-loading--caching)
10. [Implementation Phases & Order](#10-implementation-phases--order)
11. [File & Schema Checklist](#11-file--schema-checklist)

---

## 1. Overview & Principles

- **Same modals, different presentation:** Dashboard always shows the same blocks (Brain Status, Energy Budget, Quote, Missions, Calendar, Strategy, Learning streak, Budget remaining, OnTrack, Reality Report, Pattern Insight). Only their **visual treatment** (colors, borders, imagery, motion) changes by theme, emotion, and light/dark.
- **Emotion drives style:** User-chosen emotion (and/or system-derived mood from energy/focus/load) selects which 2D emotion PNG to show and which accent/background style to apply within the active theme.
- **Themes are visual personality:** Normal (current NEUROHQ), Girly (softer, warmer, rounded), Industrial (modern, sharp, monochrome + one accent). Each has dark and light variants.
- **State machine drives UX:** Idle → Focus → Reward/Error. XP and mood mapping reinforce consistency and surface “improvements” in analytics.
- **Performance first:** Lazy load heavy UI (3D, charts, report), cache server data where safe, keep LCP minimal.

---

## 2. Mood-Based UI & Emotion Assets

### 2.1 Emotion PNG Inventory (Public)

| File | Suggested emotion key | Use |
|------|------------------------|-----|
| `2D Emotions PNGs/Angry.png` | `angry` | High load / stress |
| `2D Emotions PNGs/EVIL.png` | `evil` | Extreme stress / playfulness |
| `2D Emotions PNGs/Excited.png` | `excited` | High energy + focus |
| `2D Emotions PNGs/HYPED.png` | `hyped` | Peak energy |
| `2D Emotions PNGs/Mentally drained.png` | `drained` | Low energy |
| `2D Emotions PNGs/Motivated.png` | `motivated` | Good energy, ready |
| `2D Emotions PNGs/Questioning.png` | `questioning` | Mid energy, uncertain |
| `2D Emotions PNGs/Sleepy.png` | `sleepy` | Low energy, rest |
| `2D Emotions PNGs/image00003.png` | TBD (inspect) | Extra variant |

### 2.2 Emotion Model (Align with Penguin + 2D)

- **Unified emotion type** used for:
  - 2D emotion image on dashboard/settings
  - 3D penguin model selection (existing `PenguinMood` in `lib/model-mapping.ts`)
  - Theme accent tweaks (e.g. “girly + excited” = warmer pink highlight)
- **Source of truth:**  
  - **User-selected emotion** (stored in user preferences) for “how I feel / how I want the UI to look.”  
  - **System-derived mood** (from `getPenguinModel(energy, focus, load)`) for mascot and optional auto-suggest (“Your brain status suggests ‘drained’ — use that mood?”).
- **Mapping 2D PNG ↔ Penguin mood:**  
  - drained, sleepy, questioning, motivated, excited, angry, neon (neon → HYPED or Excited for 2D).  
  - Add `evil` and `hyped` as 2D-only or map: angry→EVIL in some themes, excited→HYPED when energy very high.

### 2.3 Where Emotion Shows in UI

- **Dashboard:** Hero/header area: show current 2D emotion PNG (or mascot) based on selected emotion / derived mood. Card borders or inner glows can use emotion-based accent (e.g. angry = warmer red tint in industrial).
- **Settings:** “How are you feeling?” picker: grid of 2D emotion thumbnails; selection updates `user_preferences.selected_emotion` and theme accent behavior.
- **Modals:** Same modal content; background overlay, border radius, and accent color follow theme + emotion (e.g. girly + light + excited = soft pink border).

---

## 3. Theme System: 3 Themes × Dark/Light

### 3.1 Theme Identifiers

- **Theme:** `normal` | `girly` | `industrial`
- **Color mode:** `dark` | `light`
- **Effective key:** e.g. `normal_dark`, `girly_light`, `industrial_dark`. Stored as two fields: `theme` + `color_mode` (or single `theme_key`).

### 3.2 Design Tokens Per Theme (CSS Variables)

All tokens live under `[data-theme="normal|girly|industrial"][data-color-mode="dark|light"]` (or `data-theme="normal-dark"` etc.). Root defaults stay as current NEUROHQ (normal + dark).

**Normal (current)**  
- Dark: existing `globals.css` :root.  
- Light: `--bg-primary` light gray, `--text-primary` dark, `--accent-focus` same cyan, surfaces white/off-white.

**Girly**  
- Dark: deep mauve/pink-blacks, soft pink/rose accent, rounded corners (e.g. `--hq-card-radius: 20px`), softer shadows.  
- Light: cream/rose-white backgrounds, rose/coral accent, same rounded feel.

**Industrial**  
- Dark: near-black, cool gray, single accent (e.g. electric blue or amber), sharp corners (`--hq-card-radius: 8px`), high contrast, minimal glow.  
- Light: white/gray, same sharp geometry, strong borders.

### 3.3 Implementation Approach

- **`app/globals.css`:** Keep current :root as default. Add blocks:
  - `[data-theme="normal"][data-color-mode="light"] { ... }`
  - `[data-theme="girly"][data-color-mode="dark"] { ... }`
  - `[data-theme="girly"][data-color-mode="light"] { ... }`
  - `[data-theme="industrial"][data-color-mode="dark"] { ... }`
  - `[data-theme="industrial"][data-color-mode="light"] { ... }`
- **Theme provider:** Client context or store (e.g. React context + `localStorage` + optional user pref from DB) that:
  - Reads `theme` and `colorMode` (from user prefs or system preference for initial load).
  - Sets `data-theme` and `data-color-mode` on `<html>` or a wrapper.
  - Persists to `users` or `user_preferences` and syncs on login.
- **Background image:** Theme can override `body` background: e.g. `BACKGROUND.PNG` for normal, optional `background-girly.png` / `background-industrial.png` (or CSS gradient for industrial).

### 3.4 Dashboard Modals “Another Way”

- **Same components, different styling:** All cards (BrainStatusCard, EnergyBudgetBar, QuoteCard, ActiveMissionCard, etc.) use CSS variables. No duplicate modals; theme + emotion only change variables (and optional emotion image in header).
- **Optional layout variants:** For “display in another way,” support optional layout modes per theme (e.g. girly: larger radius and more padding; industrial: tighter grid). Implement via data attributes and one set of components.

---

## 4. User-Selectable Emotion & Visual Style

### 4.1 Storage

- **Table:** Either extend `users` or add `user_preferences` (recommended):  
  - `user_id`, `theme` (normal|girly|industrial), `color_mode` (dark|light), `selected_emotion` (e.g. drained|sleepy|questioning|motivated|excited|angry|hyped|evil|neon), `updated_at`.
- **Server:** `getUserPreferences(userId)`, `updateUserPreferences({ theme, color_mode, selected_emotion })`. Used by layout/provider and settings page.

### 4.2 Emotion Picker (Settings)

- **UI:** Grid of 2D emotion PNGs; click sets `selected_emotion` and refreshes theme accent.
- **Default:** If not set, use system-derived mood from today’s `daily_state` (energy/focus/load) so first-time users still see mood-based UI.

### 4.3 Visual Style Changes by Emotion

- **Emotion accent overlay:** Optional secondary accent (e.g. emotion-specific hue) applied to cards or header: e.g. `--emotion-accent: hsl(...)` from a small map `emotion → color` per theme. Cards use `border-left-color: var(--emotion-accent)` or similar.
- **Header/hero:** Show selected (or derived) 2D emotion image; if user selected “motivated,” that PNG is shown and accent shifts to a “motivated” tint.

---

## 5. Modular Animations & Mascot Animations

### 5.1 Principles

- **Respect `prefers-reduced-motion`:** Already partially done in `globals.css`. All new animations must be disabled or shortened when `reduce-motion` is set.
- **Modular:** One small animation library or set of CSS classes (e.g. `hq-anim-fade-in`, `hq-anim-scale-in`, `hq-anim-slide-up`) used across cards and modals. No one-off keyframes per component where avoidable.
- **Stagger:** Dashboard cards already use `animationDelay`; standardize stagger steps (e.g. 50ms or 100ms per card) via a shared constant or CSS custom property.

### 5.2 Animation Tokens (CSS)

- **Durations:** `--hq-duration-fast: 150ms`, `--hq-duration-normal: 300ms`, `--hq-duration-slow: 500ms`.
- **Easings:** `--hq-ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94)`, `--hq-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`.
- **Classes:** e.g. `.hq-anim-fade-up`, `.hq-anim-scale-in`, `.hq-anim-breathe` (existing breathe), `.hq-anim-pulse` (subtle glow for time window button).

### 5.3 Mascot (3D Penguin) Animations

- **Current:** Static GLB per mood. Enhance with:
  - **Idle:** Gentle loop (e.g. sway or breathe) — can be done in Three.js by animating group rotation/scale or using GLB animation clip if available.
  - **Focus:** Slightly more “alert” pose or loop (e.g. lean forward).
  - **Reward:** Short celebration (e.g. jump or scale bounce) triggered on task complete / XP gain.
  - **Error:** Short “shake” or “sad” pose when validation fails or session timeout.
- **Modular trigger:** A small context or event bus: `mascot.trigger('reward')` / `mascot.trigger('error')` so dashboard and task list can fire events without coupling to 3D impl.
- **Fallback:** When 3D is not loaded or disabled, 2D emotion PNG can do simple CSS animation (e.g. scale bounce on reward).

### 5.4 File Structure for Animations

- **`lib/animations.ts`** (or `constants/animations.ts`): Export delay steps, event names.
- **`app/globals.css`:** Central keyframes and utility classes.
- **`components/hq/PenguinScene.tsx`:** Subscribe to mascot events; play idle/focus/reward/error via state or Three.js animation mixer.

---

## 6. Personal Analytics

### 6.1 Metrics to Store & Show

- **Time used:** Total active time in app per day/week (e.g. from session activity or focus blocks). Requires: either client-side “active time” accumulation and periodic save, or server-side session estimation.
- **Consistency:**  
  - Days with brain status logged per week.  
  - Days with ≥1 task completed per week.  
  - Learning streak (exists); optional “task streak” (consecutive days with ≥1 completion).  
  - Weekly goal hit rate (tasks completed vs planned, learning minutes vs target).
- **Improvements:**  
  - Week-over-week: energy/focus/load averages, task completion rate, learning minutes, carry-over count trend.  
  - Simple “vs last week” or “vs last 4 weeks” comparison.
- **Engagement:** Sessions per week, most active day/hour (optional).

### 6.2 Data Model (New or Extended)

- **Option A — Dedicated analytics table:**  
  - `user_analytics` or `user_analytics_daily`: `user_id`, `date`, `active_seconds`, `tasks_completed`, `tasks_planned`, `learning_minutes`, `brain_status_logged` (boolean), `carry_over_count`, etc.  
  - Filled by: cron (aggregate from existing tables) + client sending “active time” if implemented.
- **Option B — Aggregate on the fly:**  
  - No new table; compute from `daily_state`, `tasks`, `learning_sessions`, and optional client-reported “active_seconds” in a single row elsewhere (e.g. `users.active_seconds_today` or a small `user_daily_activity` table).
- **Recommendation:** Add `user_analytics_daily` (or `user_daily_stats`) for clear reporting and caching: one row per user per day with denormalized counts and optional `active_seconds`. Cron + on-write updates populate it.

### 6.3 Analytics UI

- **Dashboard widget:** “Your week” — consistency (e.g. 5/7 days with check-in), total focus time, learning vs target, “vs last week” one-liner.
- **Dedicated page:** `/analytics` or `/report` (extend existing report):  
  - Time used (chart or totals).  
  - Consistency (calendar heat or list).  
  - Improvements (sparklines or comparison cards).  
  - Optional: export CSV.

### 6.4 Server Actions

- `getUserAnalytics(userId, dateFrom, dateTo)`  
- `recordActiveSeconds(userId, date, seconds)` (called from client periodically if tracking in-app time)  
- Cron: aggregate daily stats into `user_analytics_daily` for past days.

---

## 7. Adaptive & Smart Adaptive System

### 7.1 “Adaptive” Definition

- **Content:** What we show (e.g. task count, which cards, minimal vs full UI) already adapts via `getMode()` (normal, low_energy, high_sensory, driven, stabilize).
- **Presentation:** Theme + emotion + color mode adapt the look; theme/emotion can be user-set or suggested by system.

### 7.2 “Smart Adaptive” Add-Ons

- **Suggest theme/emotion:** “You’ve been in low energy 3 days — try the Girly theme for a calmer look” or “Your focus is high today — Excited mood might match.”
- **Suggest task load:** Already partially there (suggested task count from energy budget). Refine with: “Based on your consistency this week, we suggest N tasks today.”
- **Adaptive copy:** Greeting or card titles that change by mode/emotion (e.g. “Good morning, Commander” vs “Good morning — take it slow today” in low_energy).
- **Smart defaults:** Pre-fill brain status with yesterday’s values or last-week same weekday average to reduce friction.

### 7.3 Implementation

- **Server:** Small “suggestions” API or logic in existing actions: `getAdaptiveSuggestions(userId, date)` returning `{ themeSuggestion?, emotionSuggestion?, taskCountSuggestion?, copyVariant? }` based on mode, history, and consistency.
- **Client:** Use suggestions in dashboard and settings (e.g. banner “Try Girly theme?” or pre-select emotion in picker).

---

## 8. State Machine, XP, Mood Mapping & Input Reaction

### 8.1 UI State Machine

- **States:** `idle` | `focus` | `reward` | `error`
- **Transitions:**  
  - idle → focus: user starts focus block or opens task.  
  - focus → idle: user ends block or leaves.  
  - focus → reward: user completes task / logs learning / hits goal.  
  - focus → error: validation error, save failed, or session expired.  
  - reward → idle, error → idle: after short delay or user dismiss.
- **Use:**  
  - **Mascot:** Idle animation in idle; focus animation in focus; reward/error animations on transition.  
  - **Global UI:** Optional subtle background or border (e.g. “focus” = soft focus ring; “error” = brief red flash or toast).  
  - **Sounds (optional):** Different tone for reward vs error, if you add sound later.

### 8.2 Implementation of State Machine

- **Client store/context:** e.g. `AppStateContext` with `uiState: 'idle' | 'focus' | 'reward' | 'error'` and `setUIState`, or use a tiny state machine (e.g. XState or a simple reducer).
- **Triggers:**  
  - Task complete → `setUIState('reward')`; after 2s → `setUIState('idle')`.  
  - Save daily state fail → `setUIState('error')`; toast + after 3s → `setUIState('idle')`.  
  - Focus block start/end → focus ↔ idle.
- **Mascot and analytics:** Mascot subscribes to `uiState`; analytics can log “reward” events for XP.

### 8.3 XP System

- **Purpose:** Gamification of consistency and execution (optional but requested).
- **Rules (example):**  
  - +X XP: log brain status for the day.  
  - +X XP: complete a task.  
  - +X XP: complete learning session.  
  - +X XP: hit weekly learning target.  
  - +X XP: streak day (learning or task).  
  - -X or 0: no punishment; avoid negative XP.
- **Storage:** `user_xp` table: `user_id`, `total_xp`, `level` (derived or stored), `updated_at`. Or `xp_events` (user_id, event_type, points, created_at) and derive total/level.
- **Display:** Dashboard badge or settings: “Level N” or “XP: 1,240.” Optional level-up animation (mascot reward + confetti).

### 8.4 Mood Mapping

- **Inputs:** daily_state (energy, focus, sensory_load), optional mood_note (if added to schema).  
- **Outputs:**  
  - Derived mood (already have `getPenguinModel`).  
  - Mood over time: for analytics and “improvements” (e.g. “Your average energy this week vs last week”).  
  - Optional: mood calendar (day cells colored by energy or mood).

### 8.5 Reacting to User Input

- **Immediate feedback:** Buttons: loading state, success checkmark. Forms: inline validation, error state (feeds into `error` UI state).  
- **Short delay feedback:** After save: “Saved” toast, mascot reward animation, XP tick (if shown).  
- **Adaptive feedback:** In low_energy or high_sensory, keep toasts shorter and animations minimal (respect reduced motion and mode).

---

## 9. Lazy Loading & Caching

### 9.1 Lazy Loading

- **Routes:** Dashboard is main; ensure heavy components are not in the main bundle.  
  - **Already:** `Brain3DModel` / `PenguinScene` can be loaded with `next/dynamic` (e.g. `dynamic(() => import('@/components/hq/PenguinScene'), { ssr: false })`).  
  - **Add:** `QuoteCard`, `RealityReportBlock`, `PatternInsightCard`, calendar section, and any chart on report/analytics: wrap in `dynamic` with `loading` fallback where it improves LCP (e.g. dashboard: above-the-fold first, rest lazy).  
- **Images:** 2D emotion PNGs: use `next/image` with `priority` only for the one visible in header; rest `loading="lazy"`.  
- **Models:** Preload only the current mood’s GLB when dashboard mounts; preload others on idle (e.g. requestIdleCallback) or when user opens emotion picker.

### 9.2 Caching

- **Server (Next.js):**  
  - Use `unstable_cache` (or stable `cache`) for expensive reads: e.g. `getTodaysTasks`, `getDailyState`, `getMode`, `getEnergyBudget`, `getQuoteForDay`, report aggregates. Tag by `userId` and `date` (or route) so revalidation (e.g. after task complete or daily state save) invalidates the right cache.  
  - Revalidate on mutation: after `saveDailyState`, `completeTask`, etc., call `revalidatePath` and optionally `revalidateTag` for that user/date.
- **Client:**  
  - React Query or SWR for dashboard data: cache responses, stale-while-revalidate, so navigation back to dashboard is instant.  
  - Or rely on Next.js fetch cache and `revalidatePath` if you keep server components for dashboard.
- **Static assets:** Ensure `sw.js` and manifest cache static assets; lazy-loaded JS chunks are cached by browser.

### 9.3 Checklist

- [ ] Dashboard: critical path (header, brain status, energy bar) in first chunk; rest dynamic.  
- [ ] 3D mascot: dynamic, SSR false, suspense with placeholder.  
- [ ] Report/Analytics: chart library and heavy tables dynamic.  
- [ ] Server: wrap read-heavy actions in `unstable_cache` with tags; revalidate on write.  
- [ ] Images: emotion PNGs lazy except hero; Next/Image for all.

---

## 10. Implementation Phases & Order

### Phase 1 — Foundation (Theme + Emotion + Preferences)

1. **Schema:** Add `user_preferences` (or columns on `users`): `theme`, `color_mode`, `selected_emotion`.  
2. **Theme system:** CSS variables for normal/girly/industrial × dark/light; theme provider; set `data-theme` and `data-color-mode` on document.  
3. **Emotion:** Unified emotion type and 2D PNG map; emotion picker in Settings; load preference in layout.  
4. **Dashboard:** Same modals, styled by theme + emotion; show 2D emotion image in header when selected/derived.

**Deliverable:** User can choose theme (3) and color mode (2), choose emotion; dashboard and modals reflect it.

### Phase 2 — State Machine & Mascot Animations

1. **UI state machine:** Context/store for idle/focus/reward/error; wire task complete, save fail, focus block.  
2. **Mascot:** Idle/focus/reward/error animations (Three.js or CSS fallback); subscribe to state machine.  
3. **Modular animations:** Central CSS classes and tokens; apply to cards and modals; respect reduced motion.

**Deliverable:** Mascot and global UI react to state; animations modular and accessible.

### Phase 3 — XP & Mood Mapping

1. **XP:** Schema (e.g. `user_xp` or `xp_events`); rules for task complete, brain status, learning, streaks; server actions to award and read XP; display on dashboard/settings.  
2. **Mood mapping:** Use existing daily_state; expose “mood over time” or “average energy this week” in analytics.  
3. **Optional:** Level-up or reward moment when XP crosses threshold.

**Deliverable:** XP visible and increasing with actions; mood derivable from data.

### Phase 4 — Personal Analytics

1. **Schema:** `user_analytics_daily` (or equivalent) with active_seconds, tasks_completed, tasks_planned, learning_minutes, brain_status_logged, etc.  
2. **Cron + on-write:** Populate/update daily stats.  
3. **Client:** Optional “active time” tracker and `recordActiveSeconds`.  
4. **UI:** Dashboard widget “Your week”; `/analytics` or extended `/report` with time used, consistency, improvements.

**Deliverable:** User sees time used, consistency, and week-over-week improvements.

### Phase 5 — Smart Adaptive

1. **Suggestions:** `getAdaptiveSuggestions()` for theme, emotion, task count, copy.  
2. **Dashboard/settings:** Banners or pre-fills from suggestions.  
3. **Copy variants:** Greeting and card titles by mode/emotion.

**Deliverable:** System suggests theme/emotion and adapts copy.

### Phase 6 — Performance (Lazy Load + Cache)

1. **Lazy:** Dynamic imports for 3D, report charts, below-fold dashboard cards; lazy images for emotion PNGs.  
2. **Cache:** `unstable_cache` (or `cache`) on server reads; revalidate on mutations; optional client cache (SWR/React Query).  
3. **Measure:** LCP and TTI before/after.

**Deliverable:** Faster load and snappier navigation.

---

## 11. File & Schema Checklist

### Schema (Supabase migrations)

- [ ] `user_preferences`: `user_id` (FK), `theme`, `color_mode`, `selected_emotion`, `updated_at`.  
- [ ] `user_xp`: `user_id` (FK), `total_xp`, `level` (optional), `updated_at`; or `xp_events` table.  
- [ ] `user_analytics_daily`: `user_id`, `date`, `active_seconds`, `tasks_completed`, `tasks_planned`, `learning_minutes`, `brain_status_logged`, `carry_over_count`, etc.  
- [ ] Optional: `daily_state.mood_note` (text) for qualitative mood.

### New/Updated Files (high level)

- [ ] `app/globals.css`: theme and color-mode variable blocks.  
- [ ] `components/providers/ThemeProvider.tsx` (or `PreferencesProvider.tsx`): theme + color_mode + emotion from DB/localStorage; set data-theme/data-color-mode.  
- [ ] `components/providers/AppStateProvider.tsx`: UI state machine (idle/focus/reward/error).  
- [ ] `lib/theme-tokens.ts` or `constants/themes.ts`: theme + color_mode token maps (for non-CSS use).  
- [ ] `lib/emotions.ts`: emotion keys, 2D PNG paths, optional accent map.  
- [ ] `lib/animations.ts`: delay steps, event names.  
- [ ] `components/settings/EmotionPicker.tsx`: grid of 2D emotions.  
- [ ] `components/settings/ThemePicker.tsx`: theme + light/dark.  
- [ ] `components/hq/PenguinScene.tsx`: subscribe to AppState; idle/focus/reward/error animations.  
- [ ] `components/hq/EmotionHero.tsx` (or extend header): show 2D emotion PNG.  
- [ ] `app/actions/preferences.ts`: get/update user preferences.  
- [ ] `app/actions/xp.ts`: award XP, get total/level.  
- [ ] `app/actions/analytics.ts`: get analytics, record active seconds; cron for daily aggregate.  
- [ ] `app/analytics/page.tsx` or extend `app/report/page.tsx`: analytics UI.  
- [ ] `app/actions/adaptive.ts`: getAdaptiveSuggestions.  
- [ ] Dashboard page: wrap below-fold sections in `dynamic`; use preferences and state machine.

### Types

- [ ] `Theme`, `ColorMode`, `Emotion` (or extend existing `PenguinMood` for 2D).  
- [ ] `UIState`: idle | focus | reward | error.  
- [ ] DB types regen after schema changes.

---

## Summary

- **Mood-based UI:** 2D emotion PNGs + same dashboard modals with theme/emotion-driven styling.  
- **3 themes × 2 modes:** Normal, Girly, Industrial × Dark/Light via CSS variables and theme provider.  
- **User emotion:** Stored preference drives which emotion image and accent to show.  
- **Animations:** Modular CSS + mascot reactions to state machine (idle/focus/reward/error).  
- **Analytics:** Time used, consistency, improvements via `user_analytics_daily` and optional active time tracking.  
- **Adaptive:** Mode-based content + smart suggestions for theme/emotion/copy.  
- **State machine + XP + mood:** Explicit UI states, XP for actions, mood from daily_state for mapping and suggestions.  
- **Performance:** Lazy load heavy components and images; cache server reads; revalidate on write.

This plan is the full game plan; implementation order is Phase 1 → 6 with schema and types done upfront where possible.
