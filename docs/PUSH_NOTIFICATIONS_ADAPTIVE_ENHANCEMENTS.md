# Push notifications: adaptive enhancements (think-first)

## 1. What’s already adaptive

| Layer | Current behavior |
|-------|------------------|
| **Personality** | `push_personality_mode`: auto / stoic / friendly / coach / drill / chaos → tone and message pool (MESSAGE_POOL per trigger × tone). |
| **Consistency** | `UserNotificationContext.consistencyScore` (0–100 from last 14d missions) → in auto mode, tone shifts (e.g. high consistency → friendlier; low → more direct/coach). |
| **Quiet hours** | Per-user `push_quiet_hours_start` / `push_quiet_hours_end` (local time) → no push inside that window. |
| **High sensory** | `daily_state.sensory_load >= 7` for that date → skip non-critical push (quote, morning/evening, learning, shutdown, etc.). |
| **Cooldowns** | Per-trigger cooldowns in `behavioral_notifications` (e.g. brain_status 6h, inactivity 12–24h, streak 12–24h). |
| **Daily cap** | `push_sent_count` / `push_sent_date`: max 12/day; low-priority blocked after 8. |
| **Priority** | `priority: low | normal | high` → low is throttled first; critical (streak, inactivity 7d/14d, etc.) marked high. |
| **Escalation** | “No missions today” uses `ignored_count` → stronger copy over time. |

So you already have: **who** (personality + consistency), **when** (quiet hours, high sensory), **how often** (cooldowns, daily cap), and **how urgent** (priority, escalation).

---

## 2. Gaps and enhancement directions

### 2.1 Time and timezone

- **“Today” for push count**  
  `push_sent_count` resets by **server date** (UTC). For users in other timezones, “today” should be **user local date** so the cap is 12 per *their* day, not per UTC day.
- **Best send window**  
  You don’t yet adapt *when* in the day to send (e.g. “this user often opens the app 09:00–10:00 → prefer morning push just before that”). You could add a “preferred morning/evening window” or infer from analytics.
- **Quote / reminder time**  
  You already have `push_quote_time` (e.g. 08:00). Could extend to “preferred reminder hour” for morning/evening so they’re not fixed at 09:00 / 20:00 for everyone.

**Enhancement ideas**

- Reset `push_sent_count` by **user local date** (store `push_sent_date` in user TZ; in `sendPushToUser` compute “today” from `users.timezone` and compare).
- Optional: “Notification window” in Settings (e.g. “Morning push between 08:00–10:00”) and cron picks a random time in that window to spread load and feel less robotic.
- Use `user_analytics_daily` or session data (if you add it) to learn “typical first open hour” and nudge morning/evening sends toward that window.

---

### 2.2 Richer context (energy, focus, calendar, load)

- **Brain state**  
  You already skip *sending* brain_status reminder when they’ve set it; you don’t yet change **copy or priority** based on current energy/focus (e.g. low energy → shorter, calmer copy; high energy + no action → slightly more direct).
- **Calendar**  
  Morning/calendar pushes use calendar events. You could: skip morning “heavy” summary if they have a very busy day (e.g. >5 events); or soften tone when first event is within 15 minutes (they’re about to switch context).
- **Task load**  
  Avoidance alert already uses carry_over. You could: avoid sending a “3 missions today” morning push if they’re in stabilize mode or have 10+ due (overwhelming); or add a “light day” variant when they have 0–1 tasks.

**Enhancement ideas**

- Extend `UserNotificationContext` (or a separate “push context”) with: `energy`, `focus`, `sensory_load`, `taskCountToday`, `calendarEventCountToday`, `mode` (normal / low_energy / high_sensory / etc.).  
  Use this in the behavioral engine to:
  - Pick tone (e.g. low_energy → friendlier, shorter).
  - Choose between “light” vs “full” morning body (e.g. only quote + 1 line when taskCountToday > 5).
- For calendar: add a “heavy day” branch (e.g. >5 events) → shorter message: “Heavy day — N events. One focus at a time.”

---

### 2.3 Engagement and fatigue

- **Dismiss / open rate**  
  You don’t yet track whether the user *opened* the app from the notification or dismissed it. If you add a simple “notification_clicked” or “notification_dismissed” (e.g. via service worker or link params), you could:
  - Reduce frequency for users who rarely open from push (fatigue).
  - Slightly increase or keep frequency for users who often open (push is useful).
- **Streak of “no open from push”**  
  If someone hasn’t opened from push in 7 days, consider: fewer low-priority pushes, or one “we’ve quieted down — still want these?” re-subscribe nudge (in-app, not push).
- **Per-trigger effectiveness**  
  If you log which `tag` led to an open, you can over time send more of what works (e.g. “calendar-reminder” opens a lot → keep; “daily-quote” rarely → send less or only when under daily cap).

**Enhancement ideas**

- Add optional server-side or client-side logging: `notification_sent` / `notification_clicked` (with tag and user_id). Use in a simple “push engagement score” (e.g. opens / sent last 7d).
- Adaptive daily cap: e.g. `effectiveMaxPerDay = max(3, min(12, baseCap - fatigueReduction))` where `fatigueReduction` increases when recent open rate is low.
- One-off in-app prompt (no push): “You haven’t opened from notifications in a while. Want fewer, or turn them off?” with options: Fewer / Keep / Off.

---

### 2.4 Content personalization

- **Quote**  
  Quote is by day-of-year; no adaptation to user yet. Possible (later): tag quotes by theme (discipline, rest, focus) and choose by mode or today’s theme.
- **Morning/evening body**  
  Built from real data (tasks, calendar, brain status). You could add **variants** by context: e.g. when `taskCountToday === 0` and consistency is high → “Clear day. Use it how you want.” vs default “No missions scheduled yet.”
- **Behavioral copy**  
  Message pool is already rich. You could add **dynamic snippets** (e.g. “You’re 2 missions from your weekly goal”) when you have that data in context.

**Enhancement ideas**

- Pass `taskCountToday`, `missionsCompletedThisWeek`, `streak` into the engine so a single trigger can have context-dependent variants (e.g. streak_growth: “5-day streak” in the body).
- Optional: quote selection by `mode` or “theme of the week” (if you add it) so high_sensory days get calmer quotes.

---

### 2.5 Critical vs nice-to-have and channels

- **Critical**  
  Today: freeze reminder, avoidance alert, savings due soon, streak protection, shutdown (evening). These are already high priority and often exempt from “skip on high_sensory” only where specified.
- **Nice-to-have**  
  Quote, calendar heads-up, morning/evening summary, weekly learning, some behavioral (e.g. positive_surprise). These are the ones to throttle first when:
  - User is over daily cap.
  - High sensory.
  - Low engagement from push.

**Enhancement ideas**

- Explicit **tier** in code: `critical` (always allow if under cap, respect quiet hours only) vs `standard` (respect high_sensory, engagement, cap). Then:
  - When computing “can send?”, check tier first; for standard, also check sensory + engagement.
- Later: **channel** choice — “Critical only” (freeze, avoidance, savings, streak, shutdown) vs “Standard” (add quote, morning/evening, learning). Settings could expose: “Critical only” / “Standard” / “Off”.

---

### 2.6 Frequency and “batching”

- **Batching**  
  You could combine multiple low-priority items into one push (e.g. “Quote + 3 events today” in one notification) to use only one slot of the daily cap. Requires a small content combiner and a rule (e.g. only batch quote + calendar when both would fire in the same hour).
- **Backoff**  
  If a user hasn’t opened the app in 3 days, you could send *fewer* behavioral re-engagement pushes (e.g. one every 2 days instead of daily) to avoid feeling spammy.

**Enhancement ideas**

- Morning window: one “combined morning” push (quote + today’s events + “Set brain status” if missing) instead of separate quote + calendar-morning + morning-reminder when they’re in the same hour. Saves 2 slots and feels cleaner.
- Inactivity: already escalating (24h → 3d → 7d → 14d). Could add a “max N re-engagement pushes per week” so after 2–3 unopened re-engagement pushes you pause until next week.

---

## 3. Suggested order of implementation

| Priority | Enhancement | Effort | Impact |
|----------|-------------|--------|--------|
| P1 | **Reset push count by user local date** | Low | Fair (correct “12 per day” per user). |
| P1 | **Richer push context** (energy, focus, taskCountToday, mode) and use in tone/light vs full morning | Medium | High (notifications feel more “in tune” with the day). |
| P2 | **Combined morning push** (quote + calendar + brain in one when same hour) | Medium | High (fewer pings, one clear morning nudge). |
| P2 | **Preferred window** for morning/evening (or infer from first-open hour) | Medium | Medium (better timing). |
| P2 | **Explicit critical vs standard tier** and “Critical only” in Settings | Low–Medium | Medium (control + less noise for overwhelmed users). |
| P3 | **Engagement tracking** (open from push) and fatigue-based cap | Medium | High (long-term relevance). |
| P3 | **Contextual copy** (streak, task count, weekly progress in body) | Low–Medium | Medium (more personal). |
| P3 | **Batching / backoff** rules for inactivity | Low | Medium (less spam). |

---

## 4. Summary

- You already have **personality, consistency, quiet hours, high sensory, cooldowns, daily cap, and priority**. The biggest gains are:
  - **Time**: user-local “today” for cap; optional preferred windows.
  - **Context**: feed energy, focus, task load, mode into the engine so **content and tone** adapt (light vs full morning; calmer copy on low energy).
  - **Smarter volume**: combined morning push; critical vs standard tier; engagement-based cap and “Critical only” option.
  - **Content**: more dynamic copy (streak, goals) and optional batching.

Starting with **P1** (local-date reset + richer context and light/full morning) gives a solid base; then add combined morning push and critical-only setting for immediate user-visible improvement.
