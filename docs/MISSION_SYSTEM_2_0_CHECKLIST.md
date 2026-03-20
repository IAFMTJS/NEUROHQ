# Mission System 2.0 - Implementation Checklist

## Feature Flags

- `NEXT_PUBLIC_MISSION_V2_ENABLED`
- `NEXT_PUBLIC_MISSION_CHAINING_ENABLED`
- `NEXT_PUBLIC_MISSION_COACHING_INTENSITY_ENABLED`
- `NEXT_PUBLIC_MISSION_WEEKLY_SUMMARY_ENABLED`

## P0 Checklist (State, Start Friction, Telemetry)

- [ ] Define mission lifecycle statuses (`suggested`, `active`, `completed`, `aborted`, `skipped`).
- [ ] Implement safe transition guards (no dead-end states).
- [ ] Add explicit abort UI with confirmation in active mission flow.
- [ ] Ensure "single next action" appears at top of missions flow.
- [ ] Emit core events: `mission_suggested`, `mission_started`, `mission_completed`, `mission_aborted`, `mission_skipped`.
- [ ] Validate event payload schema in client and server handlers.
- [ ] Add baseline dashboards/queries for completion, abort, and start latency.

## P1 Checklist (Consolidation, Chaining, Weekly Insight)

- [ ] Consolidate mission command cards to top 3 decision surfaces.
- [ ] Move secondary detail cards into collapsible/secondary views.
- [ ] Implement next-mission chaining prompt after completion.
- [ ] Add optional quick bonus for short-window next start.
- [ ] Add weekly behavior summary v1 (short, action-focused).
- [ ] Verify mode color tokens remain consistent after card changes.

## P2 Checklist (Personalization + Experiments)

- [ ] Add coaching intensity setting (user-controlled).
- [ ] Add adaptive recommendation tuning (guarded by flag).
- [ ] Run A/B tests for recommendation/chaining variants.
- [ ] Add rollback condition per experiment.

## KPI Gates

## Baseline (before rollout)
- [ ] Record 2-week baseline for:
  - completion rate
  - abort rate
  - median time-to-first-start
  - day-7 retention

## Go/No-Go thresholds
- [ ] P0 go: no increase in fatal UX regressions and full core telemetry coverage.
- [ ] P1 go: +10% completion vs baseline, abort increase <= 5% relative.
- [ ] P2 go: statistically significant uplift in target KPI with no trust/usability regressions.

## QA Checklist

- [ ] Happy path: suggested -> start -> complete.
- [ ] Abort path: suggested -> start -> abort with confirmation.
- [ ] Skip path: suggested -> skipped -> next suggestion shown.
- [ ] Offline/reopen: state consistency preserved.
- [ ] Mode visuals: focus/war/recovery consistent across backgrounds, panels, cards, and CTAs.
- [ ] No critical action without visible undo/restore path where required.
