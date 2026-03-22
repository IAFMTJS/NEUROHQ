# Growth — adaptive training (D.3) en protocollen

**Bron:** [`Updates 22 03.md`](../Updates%2022%2003.md) (sectie D.3 en protocollen-library).

## Code (stub)

- `lib/growth/adaptive-engine.ts` — `weeklyDifficultyFromBrain()` (tier + fase-label; geen persistente lock yet).
- UI: `GrowthAdaptiveHint` op `/learning`.
- UI: `GrowthSectionNav` + `GrowthProtocolLibrary` (data uit `protocol_library`; modal met `body_md`) — Growth v2-schil met HUD zoals Budget.

## Roadmap (product)

1. Brain- en weekstaten → **weekly difficulty lock** (ma/di baseline; wo–zo vast op basis van gemeten state).
2. **Next action** en sessies schalen met easy/medium/hard.
3. **Pressure**: streak/XP-consequenties met duidelijke copy en bevestiging.
4. **Reflecties** na sessies (modal, niet alleen toast).
5. **Skill tree**-unlocks afhankelijk van intensiteit.

## Protocollen (content)

Diep uitgewerkte trajecten (taal, mobility, identity, …) horen als **gestructureerde seeds** (JSON/SQL), niet als één grote UI-PR. Importeer per protocol wanneer de engine hierboven klaar is.
