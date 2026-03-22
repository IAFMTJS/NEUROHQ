# Weekplanner 3.0 — discovery & ontwerpronde (B.2)

## Doel

Eén betrouwbare weekview die **missions**, **agenda**, **energy/brain** en **routine/backlog** samenbrengt — zonder losse bronnen per scherm.

## Huidige situatie (kort)

- Taken: `tasks` + DCIC / today engine op dashboard.
- Agenda: `calendar_events` (+ optionele Google-sync).
- Energy: daily state + HQ store.
- Geen unified “week canvas” met drag-drop en dependency-aware planning.

## Opties (architecture)

| Richting | Voordeel | Risico |
|----------|----------|--------|
| **A. Alleen lezen** — weekstrip uit bestaande queries | Snel, laag risico | Beperkte UX |
| **B. Client-first planner** — lokale reorder + sync | Snelle interactie | Conflict resolution |
| **C. Server “planned blocks”** — nieuwe tabel `planned_blocks` | Bron van waarheid | Migratie + API |

Aanbeveling: start met **A + lichte B** (optimistic UI), evolueren naar **C** als gebruikers vaste blokken nodig hebben.

## Must-have user stories

1. Zie de week in één view (mobile + desktop).
2. Sleep een taak naar een dag (of “later deze week”).
3. Conflicten: te veel gepland vs. energy → zachte waarschuwing (geen harde blokkade).
4. Koppeling met bestaande **routine** en **carry-over** (geen dubbele semantiek).

## Technische dependencies

- Betrouwbare `timezone` (bestaand).
- Optioneel: `linked_task_id` op agenda (bestaat).
- Performance: server-side week range query (tasks + events) — één endpoint bv. `GET /api/planner/week`.

## Fasering

1. **Discovery** (dit document) — afgerond met stakeholder-prioriteit.
2. **MVP** — read-only weekstrip + “add to day” zonder drag.
3. **v2** — DnD + undo.
4. **v3** — AI-suggesties / templates (optioneel).

## Open vragen

- Moet Google-agenda **schrijven** bij drag of alleen NeuroHQ-state?
- Hoe verhoudt weekplanner zich tot **Strategy** milestones?
