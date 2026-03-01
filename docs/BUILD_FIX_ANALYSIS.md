# Build / TypeScript Fix – Full Analysis

**Date:** 2025-03-01  
**Scope:** All TypeScript errors causing `next build` to fail (~200+ errors from `tsc --noEmit`).

---

## 1. Root cause summary

There are **three** main sources of errors:

| Cause | Approx. # errors | Fix |
|-------|------------------|-----|
| **A. Database types out of sync** | ~150+ | Regenerate `types/database.types.ts` from Supabase |
| **B. Untyped Supabase returns** | ~30 | Explicit return types + cast in actions |
| **C. Code bugs / missing imports** | ~10 | Fix in code (e.g. TaskDetailsModal, Insert payloads) |

---

## 2. Category A: Database schema vs `types/database.types.ts` out of sync

The generated TypeScript types do **not** match the real Supabase schema. Evidence:

- **SelectQueryError** – Code selects columns that types say don’t exist, e.g.:
  - `income_sources`: code uses `day_of_month` → types only have `frequency`
  - `users`: code uses `monthly_budget_cents`, `monthly_savings_cents` → not in types
  - `tasks`: code uses `parent_task_id`, `deleted_at`, `snooze_until`, `category`, `cognitive_load`, `domain`, `base_xp`, `avoidance_tag` → not in types
  - `user_google_tokens`: `expires_at`, `access_token` → not in types
  - `user_preferences`: `compact_ui`, `theme`, `color_mode`, etc. → not in types
  - `learning_sessions`: `learning_type` → not in types
  - `monthly_books`: `year`, `completed_at`, `pages_per_day` → not in types
  - `missions`: `focus_required`, `focus_requirement`, `domain` → not in types
  - `daily_state`: `emotional_state`, `is_rest_day` → not in types
  - And more (see `SelectQueryError` in tsc output).

- **Insert/Update = `never`** – Code inserts into tables that are **not** in the types (or table name mismatch), so TypeScript infers `never`:
  - `budget_energy`, `budget_weekly_review` payload, `achievements`, `economy`, `feature_flags`, `finance_xp`, `budget_targets`, `learning_state`, `strategy_focus`-related tables, assistant API table, etc.

**Fix:** Regenerate types from the **actual** Supabase project so that:

1. All tables that exist in the DB are in the types.
2. All columns that exist in the DB are on the Row/Insert/Update types.

**Command (already in the repo):**

```bash
# Set your Supabase project ref (from Supabase dashboard → Project Settings → General)
export SUPABASE_PROJECT_ID=your-project-ref
npm run db:types
```

This overwrites `types/database.types.ts`. After that, many “column X does not exist” and “assignable to never” errors disappear. You may then need to:

- Align code with the new types (e.g. use `frequency` instead of `recurrence_rule` if the DB column is `frequency`).
- Add default values or optional fields for any Insert that still fails (e.g. `status` on savings_goals).

---

## 3. Category B: Untyped Supabase returns (`{}` / `{}[]`)

Functions that do `return data ?? []` or similar without a return type can be inferred as `{}[]`. When that value is passed to a component that expects e.g. `Task[]` or `Entry[]`, you get:

`Type '{}[]' is not assignable to type 'TaskRow[]'.`

**Already fixed in this repo (for the build path that was failing):**

- `getFrozenEntries` / `getFrozenEntriesReadyForAction` → `BudgetEntryRow[]`
- `getBudgetEntries` → `BudgetEntryRow[]`
- `getRecurringTemplates` → `RecurringTemplateRow[]`
- `getBacklogTasks` / `getFutureTasks` → `Task[]`

**Still need explicit return types (and cast) where tsc still reports `{}[]` or `Property 'x' does not exist on type '{}'`:**

- `getTodaysTasks` – inner callback return: cast `tasks` to `Task[]`.
- `getEntriesReadyForFreezeReminder` (budget.ts) – return `BudgetEntryRow[]`.
- `getTasksForDate` – return `Task[]`.
- `getCompletedTodayTasks` – return `Task[]`.
- Any other action that returns `data ?? []` and is used as a typed array prop.

Pattern:

```ts
export async function getX(): Promise<SomeRow[]> {
  // ...
  return (data ?? []) as SomeRow[];
}
```

Use the correct Row type from `Database["public"]["Tables"]["table_name"]["Row"]` (or an exported alias like `Task`).

---

## 4. Category C: Code bugs / missing pieces

- **TaskDetailsModal.tsx** – Uses `logTaskEvent` but does not import it → **add:** `import { logTaskEvent } from "@/app/actions/tasks";`
- **budget.ts** – `createRecurringTemplate` uses `recurrence_rule`; types have `frequency`. After regenerating types, use the column that actually exists (or add a DB migration to rename).
- **budget.ts** – Insert into `budget_entries`/archive: ensure payload matches Insert type (e.g. include `freeze_until`, `freeze_reminder_sent` where required, or make them optional in types after regeneration).
- **savings.ts** – Insert into `savings_goals`: types require `status`; either add default in code or make `status` optional in Insert after regeneration.
- **StrategyBlock.tsx** – Expects `strategy` with `identity_statement`, `primary_theme` etc.; strategy is `{}` because the strategy fetcher return type is untyped → type the strategy fetch return and pass-through.

---

## 5. Recommended order of operations

1. **Regenerate DB types**  
   - Run `SUPABASE_PROJECT_ID=<ref> npm run db:types`.  
   - Resolves most SelectQueryError and “assignable to never” issues.

2. **Re-run type-check**  
   - `npm run type-check` (or `npx tsc --noEmit`).  
   - Fix any remaining errors that are due to:
     - Missing return types / casts in actions (Category B).
     - Missing imports or wrong payloads (Category C).

3. **Align code with new types**  
   - If the generated types use different column names (e.g. `frequency` vs `recurrence_rule`), update either the code or the DB (migration) so they match.

4. **Build**  
   - `npm run build` to confirm the Next.js build passes.

---

## 6. Files with errors (from full `tsc --noEmit` run)

- **Actions:** behavior.ts, budget-energy.ts, budget-weekly-review.ts, budget.ts, calendar.ts, daily-state.ts, dcic/achievements.ts, dcic/behaviour-log.ts, dcic/finance-state.ts, dcic/finance-xp.ts, dcic/game-state.ts, dcic/income-sources.ts, dcic/insight-engine.ts, dcic/mission-management.ts, dcic/skills.ts, decision-cost.ts, economy.ts, feature-flags.ts, identity-engine.ts, learning-state.ts, learning.ts, mission-chains.ts, missions-performance.ts, preferences.ts, prime-window.ts, recovery-engine.ts, savings.ts, strategy.ts, strategyFocus.ts, tasks.ts, weekly-performance.ts
- **API:** app/api/assistant/message/route.ts
- **Components:** DashboardClientShell.tsx, TaskDetailsModal.tsx, StrategyBlock.tsx

---

## 7. One-time fixes applied in this pass (without regenerating types)

- **TaskDetailsModal.tsx** – Import `logTaskEvent` from `@/app/actions/tasks`.
- **tasks.ts** – In `getTodaysTasks`, cast inner return: `return { tasks: ordered as Task[], carryOverCount: maxCarryOver };`.
- **budget.ts** – `getEntriesReadyForFreezeReminder` return type `Promise<BudgetEntryRow[]>` and cast.

These reduce some errors; the bulk of the fix remains **regenerating the database types** and then cleaning up remaining mismatches.
