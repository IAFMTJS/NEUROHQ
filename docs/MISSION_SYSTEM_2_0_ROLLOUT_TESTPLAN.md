# Mission System 2.0 - Rollout and Test Plan

## Rollout Strategy

## Phase 0 (internal)
- Scope: lifecycle foundation + telemetry + start friction reduction.
- Audience: internal/testing only.
- Flag: `NEXT_PUBLIC_MISSION_V2_ENABLED=false` in production.

## Phase 1 (limited production cohort)
- Scope: card consolidation + chaining + weekly summary v1.
- Audience: small cohort.
- Rollback: disable chaining and v2 flags if abort KPI degrades.

## Phase 2 (broader production)
- Scope: personalization and controlled experiments.
- Audience: staged expansion.
- Rollback: per-experiment fallback to baseline recommendation path.

## Test Matrix

## Functional tests
- Suggested mission appears with one primary CTA.
- Start action transitions mission to active state.
- Complete action transitions to completed and triggers next-step suggestion.
- Abort action requires confirmation and records aborted state.
- Skip action records skipped state and updates suggestion queue.

## Data/telemetry tests
- Each lifecycle action emits exactly one corresponding event.
- Event payload includes required dimensions (user, mission, timestamp, mode, energy context).
- No duplicate events on refresh/reopen.

## UX tests
- Median "open missions -> start first mission" below 3 seconds in sample runs.
- Card count/choice density reduced vs pre-rollout view.
- Secondary analytics still accessible without cluttering top path.

## Reliability tests
- Offline completion/abort attempts do not corrupt local view.
- Reopen after close preserves mission state consistency.
- Snapshot/bootstrap does not overwrite recent mission transitions incorrectly.

## Visual consistency tests
- Focus/War/Recovery colors propagate through:
  - page backgrounds
  - HUD panels
  - command cards
  - mission action buttons
  - top-strip pills/badges

## Monitoring and Alerts

- Alert if abort rate rises >5% relative to baseline for 48h.
- Alert if completion rate drops >5% absolute vs baseline for 48h.
- Alert on missing telemetry volume for any core event type.

## Exit Criteria

- Phase 0 -> Phase 1:
  - all functional tests pass
  - telemetry completeness >= 99%
- Phase 1 -> Phase 2:
  - completion improvement trend positive
  - no significant trust/usability regressions
- Phase 2 -> broad rollout:
  - experiment cohort demonstrates stable KPI lift
