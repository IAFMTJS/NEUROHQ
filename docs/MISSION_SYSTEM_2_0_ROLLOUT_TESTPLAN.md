# Mission System 2.0 + E4 - Rollout and Test Plan

## Scope

This plan now includes E4 rollout gates for:
- task-state persistence and bootstrap/snapshot correctness
- brain/load decision consistency and explainability
- mission engine additions (inventory/import/triggers/progression)
- UI refactors (Growth tabs, Strategy tabs, Insights tabs, Help Center rebuild)

## Wave-Based Rollout

### Wave 1 - Stability First
- **Scope:** `A6`, `B1/B4`, `B3`
- **Goal:** no state-loss regressions and consistent mode behavior
- **Gate to pass:**
  - `npm run type-check` green
  - `npm run lint` green
  - `npm run test` green
  - `npm run build` green
  - manual check: complete task -> refresh/reopen -> completion persists
- **Rollback trigger:**
  - any persistence regression on today's tasks
  - any conflicting brain mode outcome for same inputs
- **Rollback action:**
  - disable/guard new mission state merge paths behind previous stable flow
  - revert latest Wave 1 commit set

### Wave 2 - Engine Expansion
- **Scope:** `A1-A5`, `B2`
- **Goal:** deterministic mission generation with validation and explainability
- **Gate to pass:**
  - `npm run import:automissions` green
  - `npm run validate:automissions` green (0 errors, 0 warnings)
  - progression updates recorded correctly on completion paths
- **Rollback trigger:**
  - mission import validation errors > 0
  - trigger/progression output creating invalid task payloads
- **Rollback action:**
  - remove external mission seed merge path
  - fallback to core mission pool only

### Wave 3 - UX Refactors
- **Scope:** `C1`, `C2`, `D1`, `E1`, `F1`
- **Goal:** task-focused IA with URL-driven tabs and reduced duplication
- **Gate to pass:**
  - growth/strategy/insights tab routing stable via `?tab=`
  - help page renders from canonical content source
  - build and tests remain green
- **Rollback trigger:**
  - broken deeplinks/tab navigation
  - critical content missing from Help or Insights
- **Rollback action:**
  - revert tab-shell integration per page
  - keep legacy nav/components while preserving data-layer fixes

## Executed Test Matrix (2026-03-23)

### Automated checks

| Check | Command | Result | Notes |
|---|---|---|---|
| Automission import | `npm run import:automissions` | PASS | Parsed 5 arrays, imported 114 entries |
| Automission validation | `npm run validate:automissions` | PASS | 151 missions, 0 errors, 0 warnings |
| Type safety | `npm run type-check` | PASS | No TS errors |
| Lint | `npm run lint` | PASS | Repository lint script green |
| Unit tests | `npm run test` | PASS | 5 files, 16 tests passed |
| Production build | `npm run build` | PASS | Build succeeded, routes generated |

### Functional coverage map

- **Task state correctness:** covered by persistence code-path updates + successful build/type checks; manual browser verification still required per release checklist.
- **Mission engine correctness:** import/validation scripts green and generation paths type-safe.
- **Routing/UI refactors:** URL-tab state implemented for Growth, Strategy, Insights; Help uses canonical data source.

### Manual QA gates (required before production push)

Run these in browser on a staged environment:

1. **Insights tabs**
   - Open `/report?tab=overview`, switch to performance/patterns/diagnostics
   - Confirm URL updates and content swaps
   - Open/close diagnostics popup
2. **Strategy tabs**
   - Open `/strategy?tab=overview`
   - Switch focus/alignment/review and verify `?tab=` state persists on refresh
3. **Help Center**
   - Open `/help`
   - Use TOC jump + accordion expand/collapse
   - Confirm sections render from new data model and key routes are correct
4. **Task persistence smoke**
   - Complete mission in Today
   - Refresh and hard reopen app
   - Completion remains consistent

## Monitoring and Alerts

- Alert if completion rate drops >5% absolute vs baseline for 48h
- Alert if task state mismatch reports occur after reopen/refresh
- Alert if mission validation fails in CI
- Alert if insights/help route error rate rises above baseline

## Exit Criteria

- **Wave 1 -> Wave 2:** all automated checks pass + persistence smoke pass
- **Wave 2 -> Wave 3:** mission validation remains clean for release candidate
- **Wave 3 -> Production:** manual QA gates pass + no critical regressions in staging
