# NEUROHQ — Calendar Phase 2 & Testing Strategy

**Purpose:** Define external calendar priority (Phase 2) and testing approach so both are specified before or during build.

---

## 1. Calendar Phase 2: Two-way sync & external priority

### 1.1 Two-way sync

- **Read:** Already in Phase 1 (Google Calendar read).  
- **Write:** Create/update/delete events from NEUROHQ that sync to Google (e.g. “Focus block”, “Learning”, “Recovery”).  
- **Conflict resolution:** Last-write-wins with timestamp; or “NEUROHQ wins” for events with `source = 'neurohq'` and “Google wins” for `source = 'google'` when both touch the same slot.  
- **Idempotency:** Use `external_id` to update existing Google events; create new only when no external_id.

### 1.2 External calendar priority

When the same time slot has both:

- An **external** (Google) event, and  
- An **internal** (NEUROHQ) task or block,  

**Rule:** External calendar takes priority for **display and energy budget**.

- **Display:** Show external event as the “owner” of the slot; show internal task as “suggested” or below the fold (e.g. “You had planned: [task] but [event] is scheduled”).  
- **Energy budget:** Only the external event is counted (no double-count).  
- **Rollover:** If an internal task was planned for that slot and the user had an external event, the task still rolls over (we don’t auto-complete it).  

Optional: Setting “Internal overrides external” for specific blocks (e.g. “Focus block always visible”) — store per user or per event type.

### 1.3 Data model (Phase 2)

- `calendar_events.source`: `'google'` | `'manual'` | `'neurohq'`.  
- When we create an event from NEUROHQ and sync to Google, set `source = 'neurohq'` and store `external_id` after Google returns it.  
- Priority logic in app: when building “today’s timeline”, sort by start_at; for overlapping slots, prefer `source = 'google'` over `'neurohq'` and `'manual'` for display and budget.

---

## 2. Testing strategy

### 2.1 Levels

| Level        | Scope                    | Tools / approach                    | When        |
|-------------|---------------------------|--------------------------------------|-------------|
| **Unit**    | Pure functions, helpers  | Vitest or Jest                      | Per feature |
| **Integration** | Server actions, API routes, DB | Vitest + Supabase local or test project | Before PR   |
| **E2E**     | Critical user flows      | Playwright                          | Pre-release |
| **Manual**  | Mood modes, PWA, push    | Checklist                           | Each deploy |

### 2.2 What to test

- **Unit:** Energy budget math (task cost, calendar cost, social multiplier). Mode derivation (LOW_ENERGY, DRIVEN, STABILIZE). Clarity score. Quote id from day_of_year. Parsing of quote file for seed.  
- **Integration:** Auth flow (sign up, sign in). Task CRUD. Rollover logic (mock or test DB). Reality report generation.  
- **E2E:** Login → dashboard. Add task → complete. Set daily state → see mode change. Add expense → see in budget. (Optional: install PWA, receive push.)  
- **Manual:** HIGH_SENSORY minimal UI. STABILIZE blocks new task. Push “max 3 per day”. Offline fallback. Lighthouse PWA score.

### 2.3 Test data

- Use a dedicated Supabase project for CI (or Supabase local with seed).  
- Seed: one test user, sample tasks, one day of daily_state, a few quotes. No real PII.

### 2.4 CI

- On push: `npm run lint`, `npm run test` (unit + integration).  
- On main: add `npm run build` and optionally Playwright (e2e) if run in CI.  
- Document in README: “Run tests: npm test”.

### 2.5 MVP vs later

- **MVP:** Manual testing + a few unit tests for budget and mode logic; add E2E when approaching launch.  
- **Later:** Full E2E for all critical paths; integration tests for cron (rollover, report, quote dispatch).

---

END OF CALENDAR PHASE 2 & TESTING
