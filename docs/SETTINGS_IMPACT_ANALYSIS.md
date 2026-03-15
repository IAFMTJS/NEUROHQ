# Settings impact analysis: does it actually make a difference?

This document checks whether the **changes the site makes** when settings are adjusted are **substantial enough** to be noticeable and meaningful. It does not change any code.

---

## 1. Avoidance patterns (Behavior Profile)

**What the code does:** In `lib/confrontation-missions.ts`, `pickMission(tag, level, profile, opts)` uses `profile.avoidancePatterns` to choose **title and description** for forced confrontation missions. The `emotion` per tag (overwhelm, anxiety, avoidance) can select different copy.

**Where it’s visible:** Only when a **forced confrontation** is shown (ConfrontationBanner), i.e. when the user has skipped tasks with an avoidance tag enough times and the confrontation engine picks a candidate. The banner shows `c.title` and `c.description`, which come from `pickMission`.

**Does it make enough difference?**

| Tag            | Emotion    | Effect |
|----------------|------------|--------|
| **Household**  | overwhelm  | ✅ Custom copy: "5 minuten: kleinste zichtbare rommel" + overwhelm-specific description. |
| **Household**  | anxiety, avoidance, or empty | ❌ Same generic copy: "Open de kleinste huishoud-missie" + generic description. |
| **Administration** | anxiety | ✅ Custom copy: "Schrijf op wat je vreest (5 min)" + anxiety-specific description. |
| **Administration** | overwhelm, avoidance, or empty | ❌ Same generic copy. |
| **Social**     | anxiety **or** avoidance | ✅ One variant: "Stuur één bericht zonder herschrijven" + social avoidance copy. |
| **Social**     | empty (or overwhelm) | Different variant: "Eén klein sociaal contact". |

**Verdict:**  
- **Partial.** Only **3 of 9** tag+emotion combinations get distinct copy (household+overwhelm, administration+anxiety, social+anxiety or avoidance).  
- For household “anxiety” or “avoidance”, and administration “overwhelm” or “avoidance”, the setting is saved but **does not change the mission text**; they all fall back to the same generic text.  
- Impact is also **conditional**: the user must have enough **skipped** count on that tag and no forced confrontation already this week, so the banner does not show every day.

**Recommendation:** Add dedicated copy for household (anxiety, avoidance) and administration (overwhelm, avoidance) so every chosen emotion changes the mission text.

---

## 2. Confrontation intensity (mild / standard / strong)

**What the code does:** `getBaseLevelFromSkipped(skipped, profile.confrontationMode)` uses different thresholds:

- **Mild:** level 1 at 4+ skips, level 2 at 6+, level 3 at 8+.  
- **Standard:** 3 / 5 / 7.  
- **Strong:** 2 / 4 / 6.

So with the same skipped count, **mild** shows a confrontation later and at a lower level; **strong** shows it earlier and at a higher level. Discipline level then further adjusts thresholds (low: 5/7/9, high: 3/5/7).

**Where it’s visible:** Same place: **ConfrontationBanner** (title, description, level label: “Zachte spiegel” / “Patroon benoemen” / “Identiteit-confrontatie”). The banner only appears when a confrontation candidate exists.

**Does it make enough difference?**

- **Yes.** Changing from mild → standard → strong **clearly** changes:
  - **When** a confrontation appears (e.g. at 3 vs 4 vs 2 skips for level 1).
  - **Which level** (1 vs 2 vs 3) and thus the **level label** and the **mission copy** (level 1 vs 2 vs 3 have different titles/descriptions).

So the setting has a real, noticeable effect on timing and intensity of the confrontation mission.

**Caveat:** Effect is only visible when the user actually has avoidance_tracker skips and no “already forced this week” cap. So it’s meaningful when the confrontation path runs.

---

## 3. Notification personality (push_personality_mode)

**What the code does:**  
- `loadUserNotificationContextForUser` loads `push_personality_mode` and passes it as `personalityMode` in `UserNotificationContext`.  
- `pickTone(..., ctx)` maps mode to tone: stoic → stoic, friendly → friendly, coach → coach, drill → aggressive, chaos → sarcastic/overstimulating; auto uses consistency.  
- `pickMessage(trigger, tone)` picks body (and optional title) from `MESSAGE_POOL[trigger][tone]` or falls back to `neutral`.

So **personality only changes the message when that trigger has messages for the chosen tone**.

**Where it’s visible:** In **push notifications** sent by hourly cron (e.g. brain status reminder) and daily cron (re-engagement, streak, momentum, etc.). The user sees different wording (e.g. “Awareness precedes control.” vs “Quick check-in. How’s your brain today?”) when the pool has multiple tones for that trigger.

**Does it make enough difference?**

| Trigger (examples)        | Tones in pool                          | Personality impact |
|---------------------------|----------------------------------------|---------------------|
| brain_status_reminder     | neutral, friendly, stoic, sarcastic, overstimulating | ✅ **Strong.** All 5 personalities can produce different text. This is the one sent at ~11:00 when brain status is missing. |
| streak_growth             | neutral, overstimulating                | ✅ Chaos → “STREAK LEVEL UP ⚡”; others → neutral. |
| streak_protection         | neutral, sarcastic                     | ✅ Drill/chaos can → sarcastic. |
| high_productivity         | neutral, sarcastic                     | ✅ Same. |
| inactivity_24h            | **neutral only**                      | ❌ No alternative tone; personality has **no** visible effect. |
| inactivity_7d, inactivity_14d | **neutral only**                  | ❌ No visible effect. |
| inactivity_3d             | neutral, sarcastic                     | ✅ Partial. |

**Verdict:**  
- **Strong** for **brain_status_reminder** (the main behavioral push many users see).  
- **Partial** for daily-cron triggers: only some triggers have multiple tones; inactivity_24h / 7d / 14d are neutral-only, so changing personality does **not** change the message for those.

**Recommendation:** Add at least one alternate tone (e.g. friendly, stoic, or sarcastic) for inactivity_24h, inactivity_7d, and inactivity_14d so personality affects re-engagement messages too.

---

## 4. Discipline level (Behavior Profile)

**What the code does:**  
- In **confrontation**: low discipline → thresholds 5/7/9; high → 3/5/7. So it changes when and at which level a confrontation appears (same idea as confrontation intensity).  
- In **client-today-engine** `runTodayEngine`: `suggestedTaskCount` is adjusted: low → `max(1, base - 1)`, high → `min(8, base + 1)`.

**Where it’s visible:**  
- Confrontation: same ConfrontationBanner (timing and level).  
- Suggested task count: used in BrainStatusCard (“Vandaag richt de engine zich op ongeveer **X** missies”), EnergyBudgetBar, TaskList (over-capacity and completion logic), and capacity/insight text.

**Does it make enough difference?**

- **Confrontation:** Yes; same as confrontation intensity.  
- **Suggested task count:**  
  - The **±1** adjustment is applied only in **client-side** `runTodayEngine` (in `lib/client-today-engine.ts`).  
  - The **dashboard** passes `effectiveEnergyBudget.suggestedTaskCount` (and similar) into BrainStatusCard. That value comes from **server** `getEnergyBudget` → `getSuggestedTaskCount` in `lib/utils/energy.ts`, which **does not** take the behavior profile. So the **dashboard “X missies” number does not reflect discipline level**; it always uses the brain-state-only count.  
  - The discipline-adjusted count **is** used when the UI consumes `useTodayEngine().result.suggestedTaskCount` (e.g. components that use the client today engine). So the **impact exists in the engine** but is **not** consistently shown in the main dashboard BrainStatusCard.

**Verdict:**  
- **Confrontation:** Yes, real impact.  
- **Suggested task count:** Logic is there but **dashboard display is disconnected**: BrainStatusCard shows server energy budget count, so discipline level does **not** currently change the “X missies” text on the dashboard. This is a **gap**.

**Recommendation:** Either feed discipline into server-side `getEnergyBudget` / suggestedTaskCount, or have the dashboard use `useTodayEngine().result.suggestedTaskCount` for BrainStatusCard so the number reflects discipline.

---

## 5. Energy pattern (Behavior Profile)

**What the code does:**  
- **Today bucketing:** `computeAllowHeavyNow(profile, now)` (client) and server `allowHeavyByPattern`: evening_crash → heavy only before 16:00; morning_low → heavy only from 10:00.  
- `bucketTodayItems(..., { allowHeavyNow })` excludes heavy tasks from critical/high-impact when `allowHeavyNow` is false.  
- **Master mission pool:** `allowHeavyNow` is passed in; when false, heavy missions get a score penalty (`score -= 5`), so they are less likely to be chosen.

**Where it’s visible:**  
- Which tasks appear in the **top buckets** (critical / high impact) and at what time.  
- Which **auto-missions** from the master pool are suggested (lighter vs heavier).

**Does it make enough difference?**

- **Yes.** Before 10:00 with morning_low, or after 16:00 with evening_crash, heavy tasks are demoted or excluded from the main buckets and from auto-mission selection. The user sees a different set of “priority” tasks and different auto-suggestions. The effect is time-of-day dependent and clear.

---

## 6. Week theme (Behavior Profile)

**What the code does:** In `lib/master-mission-pool.ts`, `themedScore` adds +3 for tag match with `weekTheme`, and extra +2 for specific themes (environment_reset, self_discipline, health_body, courage). Missions are sorted by this score; the chosen missions’ `reason` text is set from the week theme (e.g. “Structure/Energy/Focus missie die past bij Environment Reset.”).

**Where it’s visible:** Which **auto-missions** are added from the Master Pool and the **reason** text shown for them.

**Does it make enough difference?**

- **Yes.** Theme changes ranking of missions (and thus which ones get picked) and the visible reason string. The effect is clear when auto-missions are on and the pool has theme-tagged missions.

---

## 7. Minimal integrity threshold (Behavior Profile)

**What the code does:** In `app/actions/dcic/today-engine.ts`, when the user has no forced confrontation and has been inactive for ≥ `minimalIntegrityThresholdDays` days (2–5), `minimalIntegrity` is set and can be shown.

**Where it’s visible:** **MinimalIntegrityBanner** (only when no forced confrontation and `minimalIntegrity.active`). The banner is suppressed when there is a forced confrontation.

**Does it make enough difference?**

- **Yes.** Changing the threshold (e.g. 2 vs 5 days) directly changes **when** the minimal-integrity hint appears. The difference is a matter of days, so it’s noticeable.

---

## 8. Identity targets, Pet, Hobby (Behavior Profile)

**What the code does:**  
- **Identity/pet/hobby suggestions:** `buildBehaviorSuggestions(profile)` returns strings for identity, pet, and hobby. These are shown in **BehaviorSuggestionsBanner** with a “Zet als missie vandaag” action.  
- **Creating missions:** `createBehaviorMission(kind)` uses profile (identity targets, pet type/attachment, hobby commitment) to create a concrete mission (title, domain, energy, notes).

**Where it’s visible:**  
- Banner text and the missions created when the user clicks “Zet als missie vandaag”.  
- XP page filtering (identity + fitness commitment) for mission templates.

**Does it make enough difference?**

- **Yes.** Different identity targets, pet type/attachment, and hobby commitment produce different suggestion text and different created missions. The banner and the created task content are clearly different.

---

## 9. Display preferences (compact UI, reduced motion, light UI)

**What the code does:** ThemeHydrate and settings components set `data-compact-ui`, `data-reduced-motion`, `data-light-ui` on the document. CSS in `globals.css` and `design-system.css` (and related) changes padding, spacing, animations, and visual intensity (e.g. disabling cinematic background, simplifying buttons).

**Does it make enough difference?**

- **Yes.** The UI visibly becomes more compact, less animated, and “lighter” (less visual effects). The difference is obvious when toggling.

---

## 10. Summary: what actually makes a difference

| Setting                     | Real impact? | Notes |
|----------------------------|-------------|--------|
| Avoidance patterns         | **Partial** | Only 3/9 tag+emotion combos change copy; rest generic. Add copy for missing combos. |
| Confrontation intensity    | **Yes**     | Clearly changes when and at which level confrontation appears. |
| Notification personality   | **Partial** | Strong for brain_status_reminder; many re-engagement triggers (24h/7d/14d) are neutral-only. Add tones for those. |
| Discipline level           | **Partial** | Affects confrontation; suggestedTaskCount ±1 exists in client engine but **dashboard “X missies” does not use it** (server path has no profile). |
| Energy pattern             | **Yes**     | Heavy tasks and auto-missions change by time of day. |
| Week theme                 | **Yes**     | Auto-mission selection and reason text. |
| Minimal integrity threshold| **Yes**     | When the minimal-integrity hint appears. |
| Identity / Pet / Hobby     | **Yes**     | Suggestion text and created missions. |
| Display (compact/reduced/light) | **Yes** | Obvious UI changes. |

**Concrete gaps:**

1. **Avoidance patterns:** Household (anxiety, avoidance) and administration (overwhelm, avoidance) do not change mission copy; only overwhelm (household) and anxiety (admin/social) do.  
2. **Notification personality:** inactivity_24h, inactivity_7d, inactivity_14d have no alternate tones, so personality does not change those messages.  
3. **Discipline level:** Suggested task count is adjusted in the client today engine but the dashboard BrainStatusCard uses server energy budget, so the “X missies” value does not reflect discipline.

Fixing these would make the corresponding settings feel fully “connected” and impactful.
