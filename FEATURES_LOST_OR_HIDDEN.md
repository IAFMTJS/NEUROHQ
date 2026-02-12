# Features lost or hidden after new styling (HQ dashboard)

This list covers functions and UI that existed or were planned and are either **no longer visible** on the main dashboard, **replaced by a different surface**, or **never wired** after the HQ redesign.

---

## Restored (fixed)

| Feature | Status | Notes |
|--------|--------|--------|
| **Daily quote** | Restored | `QuoteCard` + `getQuoteForDay(dayOfYear)` are back on the dashboard (between Brain Status and Active Mission). |

---

## Not on dashboard / unused (still in code)

| Feature | Where it lives | Why it’s “lost” |
|--------|-----------------|-----------------|
| **Energy budget bar** | `EnergyBudgetBar` component + `getEnergyBudget(date)` in `app/actions/energy.ts` | Component and action exist but are not used on any page. The HQ dashboard does not show “X / 100” energy used/remaining or task vs calendar breakdown. |
| **Standalone daily state form** | `DailyStateForm` component | Replaced by **BrainStatusCard** on the dashboard (expandable card with sliders + save). The old full-page/section form is unused. |

---

## On other pages only (not on dashboard)

| Feature | Where it appears | Notes |
|--------|-------------------|--------|
| **Mode banner** (LOW_ENERGY / STABILIZE / DRIVEN) | `/tasks` only | Not on dashboard; only on Tasks page. |
| **Full task list** (add/complete/snooze/delete) | `/tasks` only | Dashboard shows only “Active Mission” (first task); full list is on Tasks. |
| **Carry-over / avoidance notice** (e.g. “3 tasks carried over”) | Inside `TaskList` on `/tasks` | Shown as text in the task list when `carryOverCount >= 3`, not a separate dashboard banner. |

---

## Planned but never built (from backlog)

| Feature | Description |
|--------|-------------|
| **QuoteCard “Previous/Next”** | Browsing other days’ quotes (1–365) from the quote card. |
| **AvoidanceNotice** (standalone) | Dedicated banner: “X tasks carried over. Pick one to focus on?” with link to today. |
| **FrozenPurchaseCard** | List of 24h-frozen budget entries with Confirm/Cancel after 24h. |
| **RealityReportBlock** (on dashboard) | Short “last week” summary (tasks, learning, savings, mood) with link to full report. |

---

## Summary

- **Daily quote:** Restored on dashboard.
- **Energy budget:** Implemented in code but not shown anywhere; add to dashboard or a dedicated section if you want it visible.
- **Daily state:** Same function, different UI (BrainStatusCard instead of DailyStateForm).
- **Mode / tasks / carry-over:** Available on `/tasks`, not on dashboard.
- **Quote browsing, AvoidanceNotice, FrozenPurchaseCard, dashboard report block:** Still backlog; not implemented.
