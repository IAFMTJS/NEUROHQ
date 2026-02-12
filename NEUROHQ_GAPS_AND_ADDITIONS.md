# NEUROHQ — Gaps & Additions Checklist

**Purpose:** Identify what we already have vs. what’s missing so we can add or decide *before* building.

---

## What We Already Have

| Asset | Content | Status |
|-------|--------|--------|
| **NEUROHQ_MASTER_ARCHITECTURE.md** | Product definition, 12 system layers, core logic (rollover, mood modes, energy budget, quarterly, savings, learning, philosophy, calendar, push) | Complete for high-level |
| **NEUROHQ_DATABASE_INFRASTRUCTURE.md** | Tech stack, env vars, table names, RLS example, cron list, PWA requirements, backups | Complete but tables not fully defined |
| **NEUROHQ_ACTION_PLAN.md** | Phased implementation (0–12), tasks, dependencies, MVP cut | Complete |
| **365_Philosophical_Quotes_Structured.txt** | 365 quotes with id, name, era, quote (with "On topic: …") | Complete, ready to seed |

---

## Gaps to Address (Better Now Than Later)

### 1. Database schema (column-level)

**Gap:** We have table *names* but no column definitions, types, or indexes.

**Risk:** Inconsistent schemas, rework, missing fields (e.g. `carry_over_count` on tasks).

**Add now:** Yes.  
**Deliverable:** `NEUROHQ_DATABASE_SCHEMA.md` (and/or `.sql` migrations) — see below.

---

### 2. Timezone and cron semantics

**Gap:** “Runs daily at 00:00” — 00:00 in which timezone? Users in different zones need rollover and “today” in *their* timezone.

**Risk:** Wrong-day rollover, quote/report at wrong time.

**Add now:** Yes (decide and document).  
**Options:**  
- Store `timezone` on `users` (e.g. IANA: `Europe/Amsterdam`).  
- Cron runs every hour (or every 15 min); rollover runs only for users where it’s 00:00 in their timezone.  
- Or: single “app timezone” for MVP (e.g. UTC) and add per-user later.

**Deliverable:** Short section in Master Architecture or Infra: “Timezone: per-user; cron logic: …”.

---

### 3. Push notification technology

**Gap:** We say “push” and “max 3 per day” but not *how*: Web Push (VAPID), FCM, OneSignal, etc. Supabase doesn’t send push by default.

**Risk:** Picking a solution late and redoing integration.

**Add now:** Yes (choose and document).  
**Options:**  
- Web Push API + service worker (self-hosted, no vendor).  
- Firebase Cloud Messaging (FCM) for web.  
- OneSignal / similar (hosted, dashboard).

**Deliverable:** Add to Infra spec: “Push: Web Push (VAPID) via Edge Function” (or chosen stack); where subscription is stored (e.g. `users.push_subscription_json` or `push_subscriptions` table).

---

### 4. Admin and feature flags

**Gap:** “Admin override policy required” — how is admin determined? No list of feature flags.

**Risk:** Insecure override or no way to ship behind flags.

**Add now:** Yes.  
**Decisions:**  
- Admin: e.g. `users.role = 'admin'` and RLS policy `OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'`.  
- Flags: e.g. `calendar_integration`, `push_quotes`, `push_avoidance`, `push_learning`, `push_savings`, `push_shutdown`, `stabilize_mode_forced` (optional).

**Deliverable:** Add to Infra or schema: admin policy; `feature_flags` columns (name, enabled, optional scope).

---

### 5. Reality report format and channel

**Gap:** “Weekly: Reality report” — content and delivery not specified.

**Risk:** Vague scope, rework when implementing.

**Add now:** Yes (short spec).  
**Decide:**  
- Content: e.g. tasks completed vs planned, learning minutes, savings progress, mood summary, carry-overs.  
- Channel: in-app only, or also email/push (and how).

**Deliverable:** Add “Reality report” subsection to Master Architecture: bullets for content, “in-app page + optional email”.

---

### 6. Impulse spending and 24h freeze (behavior)

**Gap:** “Impulse spending detection” and “24h freeze” are not defined (thresholds, rules, UI).

**Risk:** Inconsistent or arbitrary behavior.

**Add now:** Optional for MVP; at least document assumptions.  
**Decide (later or now):**  
- Impulse: e.g. “unplanned expense &gt; X% of weekly budget” or “expense &lt; 2 min after adding to list”.  
- 24h freeze: which entity (e.g. “planned purchase” in a list); reminder after 24h to confirm/cancel.

**Deliverable:** Short “Financial behavior rules” in Master Architecture or a product note.

---

### 7. “Heavy” tasks and “high impact”

**Gap:** Mood logic says “hide heavy tasks” and “prioritize high impact” but no definition.

**Risk:** Inconsistent filtering/sorting.

**Add now:** Yes (quick definitions).  
**Decide:**  
- Heavy: e.g. `energy_required >= 7` (or 8).  
- High impact: optional `impact` or `priority` on tasks (e.g. 1–5); DRIVEN sorts by it.

**Deliverable:** Add one line each to Master Architecture 3.2 (LOW_ENERGY / DRIVEN).

---

### 8. Calendar conflict and priority

**Gap:** “Phase 2: External calendar priority” — how conflicts with internal tasks are resolved is not defined.

**Risk:** Confusion when both show the same slot.

**Add now:** No (Phase 2). Note as “TBD in Phase 2” in architecture.

---

### 9. Quotes table and topic

**Gap:** Quotes file has “On topic: quote text”. We need a clear schema for `quotes`: id (1–365), author, era, topic, quote text.

**Risk:** Parsing inconsistency when seeding.

**Add now:** Yes.  
**Deliverable:** In DB schema: `quotes(id, author_name, era, topic, quote_text)` and note that topic is parsed from “On X:” in the txt (or strip “On X:” and store only quote_text + topic).

---

### 10. Alternatives table

**Gap:** “Alternative suggestions” — structure unknown.

**Risk:** Wrong table design.

**Add now:** Yes (minimal).  
**Proposal:** `alternatives(id, user_id, type, reference_id, suggestion_text, created_at)` — e.g. type = 'purchase_freeze', reference_id = budget_entry or savings_goal. Refine when building financial flows.

**Deliverable:** Add to DB schema.

---

### 11. Security and privacy

**Gap:** No explicit data retention, export/delete (GDPR-style), session timeout, or password policy.

**Risk:** Compliance and security rework later.

**Add now:** At least a short list.  
**Decide:** Session timeout (e.g. 7 days); password min length; “Export my data” (we have “JSON export”); “Delete account” (delete user + cascade or anonymize).

**Deliverable:** Add “Security & privacy” section to Infra or a dedicated one-pager.

---

### 12. Error handling and logging

**Gap:** Where errors go (e.g. Vercel logs, Sentry), and how cron failures are handled, is not specified.

**Risk:** Hard to debug in production.

**Add now:** Brief decision.  
**Deliverable:** One paragraph in Infra: “Errors: …; Cron: log success/failure; optional Sentry”.

---

### 13. Testing and quality

**Gap:** No testing strategy (unit, integration, e2e, or manual).

**Risk:** Quality and regressions.

**Add now:** Optional for MVP; at least “manual + critical path e2e later”.  
**Deliverable:** Optional “Testing” line in Action Plan or Infra.

---

## Summary: Add Now vs Later

| # | Item | Add now? | Where |
|---|------|----------|--------|
| 1 | Database schema (columns, types) | Yes | New: NEUROHQ_DATABASE_SCHEMA.md |
| 2 | Timezone + cron semantics | Yes | Master Architecture or Infra |
| 3 | Push tech (VAPID/FCM/etc.) | Yes | Infra |
| 4 | Admin + feature flags list | Yes | Infra + schema |
| 5 | Reality report content + channel | Yes | Master Architecture |
| 6 | Impulse / 24h freeze rules | Optional | Master Architecture or product note |
| 7 | Heavy task / high impact definitions | Yes | Master Architecture |
| 8 | Calendar Phase 2 priority | No | TBD Phase 2 |
| 9 | Quotes table schema | Yes | DB schema |
| 10 | Alternatives table schema | Yes | DB schema |
| 11 | Security & privacy | Yes (short) | Infra or one-pager |
| 12 | Error handling & logging | Yes (short) | Infra |
| 13 | Testing strategy | Optional | Action Plan or Infra |

---

## Next Step

Create **NEUROHQ_DATABASE_SCHEMA.md** (and optionally a single `.sql` migration file) so that:

- Every table has columns, types, and constraints.
- RLS and admin are explicit.
- Quotes and alternatives are defined.
- We have a single source of truth before writing code.

Then add the small “add now” items into the existing Master Architecture and Infra docs (or the new schema doc where it fits).

After that, we have everything we need to start Phase 0–1 without guessing.
