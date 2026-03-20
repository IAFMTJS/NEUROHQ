# Mission System 2.0 - Mapping (200326 -> NeuroHQ)

## Purpose
Map concepts from `200326.txt` to concrete NeuroHQ modules so implementation stays grounded in the current codebase.

## Concept Mapping Table

| 200326 concept | NeuroHQ interpretation | Primary modules/routes |
|---|---|---|
| Single mission focus | One primary recommendation + fast start CTA | `app/(dashboard)/tasks/page.tsx`, `components/missions/SmartRecommendationHero.tsx`, `components/TaskList.tsx` |
| War mode | Visual/intensity layer for execution context | `components/dashboard/DashboardLayoutClient.tsx`, `app/globals.css`, `components/hud-test/hud.module.css` |
| State machine (idle/suggested/active/completed/failed) | Safe mission lifecycle with explicit abort/skip | `components/TaskList.tsx`, `components/missions/FocusModal.tsx`, mission actions in `app/actions/tasks.ts` |
| Auto-priority engine | Weighted scoring for recommendation order | `app/actions/missions-performance.ts`, `components/missions/DecisionBlocksRow.tsx` |
| Timer system | Focus session around active mission | `components/missions/FocusModal.tsx` (and related mission UX modals) |
| Energy gating | Suggest recovery/light when budget/load constrained | `app/actions/energy.ts`, `components/missions/EnergyCapBar.tsx`, `components/missions/SmartRecommendationHero.tsx` |
| Consequence system | Abort/carry-over/undo in transparent UX | `components/TaskList.tsx`, `app/actions/tasks.ts`, undo-related patterns in critical flows |
| Momentum chaining | Suggest next mission after completion | `components/TaskList.tsx`, recommendation cards around completion |
| Streak visibility | Reward continuity and show progress cost of breaks | `components/xp/*`, `components/XPBadge.tsx`, mission completion to XP actions |
| Data simplification | Hide advanced metrics from top-level cards | `components/missions/*`, `components/dashboard/*` |
| Unified system (Missions/Calendar/Routine) | One data model, three views | `components/missions/TasksTabsShell.tsx`, `TasksCalendarSection.tsx`, routine sections |
| Daily evaluation | Weekly/daily behavior summary (actionable) | analytics/report surfaces in `app/(dashboard)/report/*`, `components/insights/*` |

## Items explicitly adjusted from 200326

- "No escape" lock-in -> replaced with explicit abort path and confirmation.
- Aggressive manipulation/tone pressure -> replaced with configurable coaching intensity.
- Hard penalties -> replaced with soft, transparent impact and undo pathways where relevant.

## Items deferred to later phases

- Full dynamic mission generation replacing structured tasks.
- Heavy adaptive difficulty that can destabilize user trust without metric gates.
- Deep psych profiling beyond minimal behavior telemetry.
