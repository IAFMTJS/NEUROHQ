# Mission System 2.0 - NeuroHQ Product Spec

## 1) Problem and Outcome

NeuroHQ currently provides strong information density, but users still lose momentum between "seeing tasks" and "starting tasks". The `200326.txt` vision is directionally correct: reduce cognitive load, increase action rate, and adapt to user behavior over time.

### Target outcomes
- Reduce time-to-first-action on Missions flow.
- Increase completion rate without increasing burnout/abort behavior.
- Keep UI cinematic and mode-aware while making decision paths simpler.

### Non-goals
- No coercive lock-in that blocks all navigation.
- No hidden penalties or manipulative messaging.
- No unbounded "AI complexity" before telemetry foundation exists.

## 2) NeuroHQ Principles (translated from 200326)

### Keep
- Single-next-action guidance.
- Clear mode semantics (focus/war/recovery).
- Momentum chaining after completion.
- Card consolidation to reduce scanning overhead.

### Adapt
- Replace hard lock with "guided focus session + visible abort path".
- Replace punitive mechanics with transparent, soft consequences.
- Replace aggressive tone adaptation with user-controlled coaching intensity.

### Delay
- Fully dynamic mission generation replacing all manual planning.
- High-stakes difficulty scaling without baseline metrics.

## 3) Behavior Engine Rules

## 3.1 State machine (safe)
Mission execution state:
- `IDLE`
- `SUGGESTED`
- `ACTIVE`
- `COMPLETED`
- `ABORTED`
- `SKIPPED`

Transition rules:
- `IDLE -> SUGGESTED`: recommendation engine selects next best mission.
- `SUGGESTED -> ACTIVE`: user presses start.
- `ACTIVE -> COMPLETED`: mission done.
- `ACTIVE -> ABORTED`: explicit user abort (requires confirmation).
- `SUGGESTED -> SKIPPED`: user defers mission.

No forced terminal lock. User can always exit via explicit control.

## 3.2 Recommendation policy
Use existing score inputs and tune in place:
- Strategy alignment
- ROI
- Energy match
- Urgency

UX policy:
- Show one primary CTA ("Do this now").
- Keep full scoring explainability in secondary details only.

## 3.3 Energy and load gating
- Low energy/high load reduces heavy mission prominence.
- Recovery/light suggestions are promoted contextually.
- Deep tasks remain reachable via explicit override (no hidden hard block).

## 3.4 Momentum chaining
- After completion, present one contextual "Next best mission".
- Optional fast-follow bonus if started in a short window.
- User can decline chain without penalty.

## 4) UX Constraints and Card Consolidation

## 4.1 Command layout target
Top-level mission/budget dashboards should prioritize:
1. Status + safe-today envelope
2. Primary recommendation
3. Critical risk/action card

Secondary analytics move to collapsibles, tabs, or detail routes.

## 4.2 Consolidation guidance
- Merge duplicate "risk vs insights" content into one prediction-action surface.
- Merge status and day-budget into one command block.
- Keep routine/schedule views as separate perspectives, not duplicate logic.

## 4.3 Visual consistency constraint
All command surfaces must remain mode-aware through shared tokens:
- `app/globals.css`
- `components/hud-test/hud.module.css`

## 5) Consequences, Safeguards, and Ethics

## 5.1 Soft consequences only
- Abort increments abort counters and may affect recommendation confidence.
- Carry-over labels appear next day for unfinished missions.
- Critical actions require an undo or restore path.

## 5.2 Safeguards
- Always-visible exit/abort action.
- Confirmation before abort from active session.
- No hidden penalties.
- Coaching intensity configurable by user.

## 5.3 Auditability
Track critical behavior mutations for support/debug:
- mission started/completed/aborted/skipped
- critical user-facing reversals (undo flows)

## 6) Event Contract and KPI Foundation

Required core events:
- `mission_suggested`
- `mission_started`
- `mission_completed`
- `mission_aborted`
- `mission_skipped`

Minimum event payload:
- user_id
- mission_id
- timestamp
- mode
- energy/focus/load snapshot

Primary KPIs:
- Time to first mission start
- Completion rate
- Abort rate
- Streak survival
- Day-7 retention

## 7) Rollout and Metrics Plan

## P0 (1-2 weeks)
- Baseline state machine (safe transitions).
- Single-next-action UI.
- Event tracking baseline.
- Soft consequence model + abort confirmations.

Acceptance:
- User can start suggested mission in <= 3 seconds on average.
- No missing abort path.
- Event pipeline complete for the 5 core mission events.

## P1 (2-3 weeks)
- Priority tuning and chaining.
- Card consolidation in Missions/Budget command surfaces.
- Weekly behavior summary v1.

Acceptance:
- 20% fewer top-level action elements in mission command path.
- +10% completion target vs baseline without >5% abort increase.

## P2 (2+ weeks)
- Personalization (difficulty/coaching), with controls.
- A/B tests for recommendation/chaining variants.

Acceptance:
- Statistically significant retention or completion lift in experiment cohorts.
- No regression in user-reported trust/usability.

## 8) Implementation Anchors in Existing Architecture

This spec aligns with:
- `docs/ARCHITECTURE_IMPROVEMENT_PLAN.md`
- `docs/EXECUTION_PLAN.md`

And reuses existing strengths:
- DCIC mode foundations
- mission scoring/action pipelines
- snapshot/bootstrap and state consistency work

## 9) Deliverables (from this spec)

- Action checklist with feature flags and KPI gates.
- Mapping sheet from `200326.txt` concepts to NeuroHQ modules/routes.
- Rollout + test plan for happy path, abort path, offline/reopen consistency.
