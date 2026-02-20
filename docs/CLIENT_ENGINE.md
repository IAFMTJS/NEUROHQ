# Client-side Today Engine

De “today engine” (bucketing van taken in Critical / High Impact / Growth Boost + suggestie + suggested task count) kan **lokaal in de browser** draaien. De server stuurt alleen **ruwe data**; alle logica zit in de client.

## Waarom

- **Eén keer data ophalen** → daarna alles uit cache of uit geheugen.
- **Shell laadt direct** (PWA cache) → data komt in één request → engine draait lokaal → UI update. Geen meerdere server-roundtrips per scherm.
- **Offline-vriendelijk**: met gecachte data kan de engine nog steeds bucketing/suggestie tonen (bij volgende online sync weer verse data).

## Architectuur

```
┌─────────────────────────────────────────────────────────────────┐
│  Server (1x per sessie of bij refresh)                            │
│  getTodayEngineData(date) → { tasks, streakAtRisk, mode, xp,     │
│                               dailyState }                        │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Client (lib + hook)                                              │
│  runTodayEngine(data) → { bucketed, suggestion, suggestedCount } │
│  - rawTaskToTodayItem() + bucketTodayItems() (lib/today-engine)   │
│  - buildSuggestion() (lib/client-today-engine)                   │
│  - getSuggestedTaskCount() (lib/utils/energy)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Wat zit waar

| Onderdeel | Locatie | Rol |
|-----------|---------|-----|
| **Raw data** | `getTodayEngineData(date)` (server action) | Geeft taken (raw), streakAtRisk, mode, xp, dailyState. Geen bucketing. |
| **Bucketing** | `lib/today-engine.ts` | `rawTaskToTodayItem`, `bucketTodayItems` — puur, draait overal. |
| **Suggestie** | `lib/client-today-engine.ts` | `runTodayEngine(data)` → bucketed + suggestion + suggestedTaskCount. |
| **Hook** | `hooks/useTodayEngine.ts` | Roept `getTodayEngineData` aan, draait `runTodayEngine`, geeft `result` + `refetch`. |

## Gebruik

### Met de hook (aanbevolen)

```tsx
"use client";

import { useTodayEngine } from "@/hooks/useTodayEngine";

export function DashboardToday() {
  const { result, isLoading, error, refetch } = useTodayEngine();
  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!result) return null;

  return (
    <>
      <TodayEngineCard bucketed={result.bucketed} streakAtRisk={result.streakAtRisk} date={result.date} />
      {result.suggestion.text && <SmartSuggestionBanner text={result.suggestion.text} type={result.suggestion.type} />}
      <TaskList suggestedTaskCount={result.suggestedTaskCount} … />
    </>
  );
}
```

### Zonder hook (bijv. in een store of worker)

```ts
import { getTodayEngineData } from "@/app/actions/dcic/today-engine";
import { runTodayEngine } from "@/lib/client-today-engine";

const data = await getTodayEngineData(new Date().toISOString().slice(0, 10));
const result = runTodayEngine(data);
// result.bucketed, result.suggestion, result.suggestedTaskCount
```

## Migratie van server-rendered engine

- **Blijft server (RSC):** `getTodayEngine(date)` — nuttig voor eerste paint of SEO als je bucketed content in HTML wilt.
- **Nieuw client-first:** `getTodayEngineData(date)` + `runTodayEngine(data)` of `useTodayEngine()`.
- Je kunt een pagina eerst met server `getTodayEngine` renderen (fallback), en zodra de client laadt `useTodayEngine` gebruiken en de client-state tonen (optioneel met “Nieuwe data” na refetch).

## Versie / cache

- De service worker cached HTML/JS; de **data** komt van `getTodayEngineData` (geen cache in de SW voor deze aanroep, tenzij je zelf een data-cache toevoegt).
- Voor “instant” gevoel: shell uit cache, één fetch naar `getTodayEngineData`, daarna alles lokaal. Eventueel later: cache van deze response in memory of in een client cache met korte TTL.
