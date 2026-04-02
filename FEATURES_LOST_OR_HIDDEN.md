# Features lost or hidden after new styling (HQ dashboard)

This list covers functions and UI that existed or were planned and are either **no longer visible** on the main dashboard, **replaced by a different surface**, or **never wired** after the HQ redesign.

---

## Restored (fixed)

| Feature | Status | Notes |
|--------|--------|--------|
| **Daily quote** | Restored | Shown on the commander bridge (`CommanderHomeHero`) and in **DashboardContextCard** (prev/current/next day quotes) under System overview. |

---

## On the live dashboard (command deck)

| Feature | Where | Notes |
|--------|--------|--------|
| **Energy budget bar** | **System overview → Systeem modus** | Full `EnergyBudgetBar` with pools and segments. |
| **Daily state** | **BrainStatusCard** (+ `BrainStatusModal`) | Replaces any legacy “daily state form”; sliders and save live here. |

---

## On other pages only (not on dashboard home)

| Feature | Where it appears | Notes |
|--------|-------------------|--------|
| **Mode banner** (LOW_ENERGY / STABILIZE / DRIVEN) | `/tasks` only | Not on dashboard home; **ModeBanner** on Tasks. |
| **Full task list** (add/complete/snooze/delete) | `/tasks` only | Dashboard shows **ActiveMissionCard** (first task); full list is on Tasks. |
| **Carry-over notice** | Inside **TaskList** on `/tasks` | Shown in-list when `carryOverCount >= 3`; no separate dashboard banner. |

---

## Planned / backlog (not implemented as dedicated UI)

| Feature | Description |
|--------|-------------|
| **QuoteCard “Previous/Next”** | Extra browsing of quotes (1–365) beyond context card. |
| **AvoidanceNotice** (standalone) | Dedicated banner: “X tasks carried over…” — component was removed; behaviour remains list-only on Tasks. |
| **FrozenPurchaseCard** | List of 24h-frozen budget entries with Confirm/Cancel after 24h. |
| **Dashboard “last week” teaser** | Short summary (tasks, learning, savings, mood) with link to report — **not** on dashboard; insights live under **Profile → Insights** (`/report` redirects there). |

---

## Summary

- **Daily quote:** On bridge + context card.
- **Energy budget:** Visible under System overview on the dashboard.
- **Daily state:** **BrainStatusCard** / modal.
- **Mode / full tasks / carry-over:** **Tasks** page.
- **Standalone avoidance banner, frozen-purchase card, dashboard report teaser:** Backlog or other routes, not the home deck.
