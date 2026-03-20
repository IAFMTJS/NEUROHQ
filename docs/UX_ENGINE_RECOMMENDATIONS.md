# UX Engine Recommendations Backlog (1-105)

This file operationalizes the approved UX Engine Pass plan into a repository-local backlog reference.

Scope groups:
- A1-A35: visual style upgrades and presentation consistency
- B1-B35: visible UX features and interaction improvements
- C1-C35: invisible behavior-engine and telemetry foundations

Implementation notes:
- Use this as implementation index while shipping incremental PR-sized batches.
- Keep route/component mapping in commit descriptions for traceability.
- Validate mode consistency (`focus`, `war`, `recovery`) and Light/Reduced Motion behavior for every UI change.
- Align telemetry event naming to Mission System 2.0 contract:
  - `mission_suggested`
  - `mission_started`
  - `mission_completed`
  - `mission_aborted`
  - `mission_skipped`

Primary implementation anchors:
- `app/globals.css`
- `components/dashboard/DashboardClientShell.tsx`
- `components/TaskList.tsx`
- `components/missions/FocusModal.tsx`
- `components/missions/TaskDetailsModal.tsx`
- `components/dashboard/AssistantPageClient.tsx`
- `components/DeferredToaster.tsx`
- `app/actions/tasks.ts`
- `app/actions/decision-cost.ts`
- `app/actions/analytics-events.ts`

Status:
- Backlog reference established.
