# Missions als kern: volledige pipeline-setup

**Doel:** Één centrale “mission state” die past bij `DailySnapshot`, voedt de decision engine, en waar alle pagina’s alleen nog *views* van zijn — geen parallelle ranking of bloklogica per route. **Rendering:** zo min mogelijk React-rerenders door smalle subscriptions en stabiele referenties.

**Status:** Kern van de pipeline, bootstrap-splits (`depth=core`), query-cache en store-batch-hydrate zijn **in de repo gezet** (zie §2.1). Dit document blijft de ontwerp- en backlog-richtlijn voor o.a. `taskById`-payload (§7.2), volledige `buildSystemSnapshot` (§3.4) en resterende checklists.

---

## 1. Principes

1. **Eén waarheid per dag** — Ranking, “vandaag”, routine, backlog-slices, decision blocks en capacity worden **één keer** afgeleid uit dezelfde input (taken + daily state + mode/energy + today engine).
2. **Snapshot = contract** — Wat de app nodig heeft voor eerste paint en consistent gedrag zit in `DailySnapshot` (of in een server payload die 1:1 daarin wordt gemapt).
3. **Views lezen, pipeline schrijft** — Tasks-, calendar- en dashboard-UI roepen geen zware `getDecisionBlocks`-achtige acties meer aan voor hun eigen “werkelijkheid”; ze lezen `snapshot.missions` (en eventueel `snapshot.dashboard` voor al gebonden critical data).
4. **Bootstrap vóór aggregatie** — Dagelijkse missies bestaan (of zijn geprobeerd) voordat mission state wordt gebouwd, zodat ranking niet op half geïnitialiseerde data draait.
5. **Geen drie strijdende breinen** — Decision engine, budgetlogica en mission-system mogen niet elk een eigen interpretatie van “wat vandaag telt” bouwen. **Eén pipeline** voedt ze allemaal (zie §3.4).
6. **Missions = adaptive workload engine** — Niet “een lijst taken in de UI”, maar **kern-in- en uitvoer van het brein**: capacity, ranking, blokken en aanbevelingen hangen samen en worden centraal afgeleid.
7. **Het systeem beslist één keer; pagina’s gehoorzamen** — Geen “elke route zijn eigen realiteit”. Na load en na merge is de snapshot leidend; tabs filteren alleen **views** op hetzelfde object.
8. **Minimale rerenders** — Store/context-updates raken alleen subscribers die echt van die slice afhangen; geen onnodige nieuwe objectreferenties die de hele boom invalideren (zie §7.14).

### 1.1 Aansluiting op het eerste ontwerp (architectuurlijn)

```text
RAW DATA (Supabase)
  → [daily bootstrap: zorg dat dag-missies bestaan]
  → taken + daily state + energy + settings ophalen
  → buildMissionState(...)
  → buildSystemSnapshot()   // server: één samengestelde payload
       ├── brain / mode / energy   (zoals nu in daily state + afgeleide mode)
       ├── todayEngine             (signalen die je al gebruikt voor “vandaag”)
       ├── missions                { today, recommended, ranked, decisionBlocks, routine, future, capacity }
       ├── budget
       └── decision                // deriveUnifiedDecision(..., missions, budget, …)
  → FRONTEND: alleen lezen + muteren via API; merge vernieuwt snapshot
```

**Unified decision (doel):** één aanroep op de server, conceptueel:

`deriveUnifiedDecision({ brain, mode, energy, todayEngine, missionsSummary, budget })` — waarbij **`missionsSummary`** een bewust dunne projectie is (counts, `topTaskId`, overload/backlog-flags), afgeleid uit **dezelfde** pipeline als `snapshot.missions`, zodat regels niet aan `decisionBlocks`-vorm gebonden zijn.

---

## 2. Huidige situatie (kort)

| Onderdeel | Waar het nu leeft |
|-----------|-------------------|
| Eerste load / merge | `lib/daily-initialize.ts` → `fetch("/api/bootstrap/today")`; `lib/daily-snapshot-full-sync.ts` |
| Snapshot types | `types/daily-snapshot.ts` — `MissionsSnapshot` met o.a. `decisionBlocks`, `capacity`, `buildMeta`, `rankedTaskIds` (snapshot v4) |
| Dashboard + unified decision | `app/actions/dashboard-data.ts` → `buildMissionsSummaryForDecision` + `deriveUnifiedDecision({ missionsSummary })` (geen volledige `decisionBlocks` in de engine) |
| Pipeline (blocks + UMS + capacity) | `lib/missions/build-mission-state.ts`, `derive-mission-capacity.ts`, `load-missions-pipeline.ts` (`React.cache`); server gebruikt `getDecisionBlocksCached` alleen binnen die laag |
| Tasks SSR | `app/(dashboard)/tasks/page.tsx` → `loadMissionsPipeline` (geen aparte pagina-API voor decision blocks) |
| Dagelijkse missies | Server: `runDailyMissionsBootstrapServer` aan het begin van `GET /api/bootstrap/today`; **geen** aparte client `TasksDailyBootstrap` meer |
| Debounced merge na writes | `scheduleSyncDailySnapshot` (~1400 ms) in `lib/daily-snapshot-full-sync.ts` |
| Query-cache | `lib/bootstrap-query.ts` — `bootstrapTodayQueryKey(date, "full" \| "core")`; `seedBootstrapTodayInCache` vult **beide** keys; `fetchBootstrapTodayFromApi` met `depth=core` voor de core-variant |
| Missions-tab client fetch | `components/missions/MissionsProvider.tsx` — `useBootstrapToday(dateStr, { variant: "core" })` |
| Store eerste paint | `components/bootstrap/StoreHydrator.tsx` — **één** `useHQStore.setState` voor hydrate |
| Store na refresh | `lib/daily-bootstrap.ts` — `applyBootstrapHydration` / `applyBootstrapTodayToApp` |
| Periodieke refresh | `usePeriodicBootstrapRefresh` — interval `PERIODIC_SNAPSHOT_REFRESH_MINUTES` in `lib/client-refresh.ts` |

**Nog open (richting §3.4 / §7.2):** één logische “system snapshot”-bus, compacte `taskById` i.p.v. dubbele taskgrafen in JSON, en verdere Profiler-audit op zware lijsten.

### 2.1 Geïmplementeerd in code (samenvatting)

- Gedeelde mission pipeline voor dashboard, bootstrap en tasks-route (`loadMissionsPipeline`).
- Bootstrap-route: optioneel **`?depth=core`** (geen budget/learning-DB, kleinere JSON); default blijft volledig.
- TanStack: **twee keys** per datum; na bootstrap zijn `full` en `core` voorgezet zodat missions geen dubbele full-fetch hoeft.
- Publieke server-export **`getDecisionBlocks` verwijderd** → alleen **`getDecisionBlocksCached`** voor pipeline + UMS-cache-warmte (`getTasksSortedByUMS`).
- Client: dubbele `/api/tasks/daily-bootstrap` via `TasksDailyBootstrap` **verwijderd**.
- **`applyBootstrapTodayToApp`**: fingerprint (`djb2` over kernvelden van de bootstrap-JSON); bij **identieke** payload geen store-/cache-write → minder rerenders. Reset: `resetBootstrapApplyFingerprint()` bij logout/delete (naast `resetBootstrapMergeEtag`).
- **`missionsSummary`**: `lib/missions/missions-summary-for-decision.ts` — dun contract voor `deriveUnifiedDecision` (counts + `topTaskId` + flags), niet de hele pipeline-structuur.

### 2.2 Pressure-test: waar het breekt en wat we al mitigeren

| Risico | Richtlijn | Status in repo |
|--------|-----------|----------------|
| **Dikke snapshot / 6× dezelfde taak in geheugen** | `rankedIds` + `taskById` / `CompactTask`; blokken refereren **ids** | Nog te bouwen in JSON (§7.2); `rankedTaskIds` bestaat al op pipeline |
| **Decision engine koppelt aan UI-structuur** | Alleen **`missionsSummary`** naar `deriveUnifiedDecision` | **Live:** `buildMissionsSummaryForDecision` + `missionsSummary` in `UnifiedDecisionInput` |
| **Wanneer herberekenen?** | Alleen op **events** (mutatie, dagreset, brain/budget-wijziging), niet op navigatie/mount/render | Handhaven: merge = debounced na writes + periodiek + focus; geen pipeline in `useEffect([pathname])` |
| **Bootstrap-race** | Dag-missies vóór aggregatie | **`runDailyMissionsBootstrapServer()`** staat **eerst** in `GET /api/bootstrap/today` vóór parallel fetch/build |
| **Identieke data → toch store-write** | Geen `setState` als semantiek gelijk | **Live:** fingerprint-guard in `applyBootstrapTodayToApp` |
| **Over-engineering** | Meten vóór extra routes/splits | `depth=core` zit erin; uitbreiden alleen als payloads meten te zwaar |

---

## 3. Doel: uitgebreide `missions` in het snapshot

### 3.1 Conceptueel model

```text
snapshot.missions = {
  dateStr,

  // Rauwe bron (nodig voor mutaties / optimistic UI — kan beperkt blijven)
  raw?: { tasksByDate, completedToday, dailyState, energyBudget },

  // Afgeleide “brein”-output
  ranked,           // zie §7.2: liever id-lijst + limiet dan volledige dubbele task-objecten
  today,
  recommended,      // top-N (klein houden)
  routine,
  future,           // backlog: cap / paginering (§7.2)
  decisionBlocks,   // gestructureerde blokken; taken bij voorkeur per id refereren
  capacity,         // { maxTasks, recommendedLoad, overloadRisk, ... }

  // Optioneel: debug / telemetrie voor support
  buildMeta?: { version: string; builtAt: number; inputHash?: string }
}
```

### 3.2 `capacity` (expliciet maken)

Combineer wat je al hebt (`suggestedTaskCapacity`, energy, brain mode, today engine hints) tot één object, bv.:

```ts
type MissionCapacity = {
  maxTasks: number | null;           // harde limiet (bv. stabilize / low energy)
  recommendedLoad: number | null;    // zachte aanbeveling
  overloadRisk: "low" | "medium" | "high";
  reasonCodes?: string[];            // waarom deze capacity zo is
};
```

Dit voedt zowel **ranking** (hoeveel items tonen) als **decision engine** (stabilize vs create mission).

### 3.3 Snapshot-versie

- Bump `LATEST_SNAPSHOT_VERSION` in `types/daily-snapshot.ts` wanneer `MissionsSnapshot` verplichte nieuwe velden krijgt die oude caches breken.
- Houd `isCompatibleSnapshot` strikt; oude clients laten een fresh bootstrap doen.

### 3.4 Volledige systeem-snapshot (doelbeeld — één “operating system”-staat)

Dit is de **logische** eindvorm; in TypeScript kan dit één `DailySnapshot` blijven met duidelijk gevulde slices (sommige velden zitten nu al in `dashboard` / store — het punt is: **één bus** naar de client, geen parallelle waarheden).

```text
snapshot = {
  // “Brein” / context (kan uit dailyState + afgeleide mode bestaan)
  brain,            // check-in / state bucket (of verwijzing naar dailyState)
  mode,             // low_energy | driven | stabilize | …
  energy,           // expliciet of uit brain

  todayEngine,      // compacte signalen: wat de dag “verwacht” / pacing

  missions: {
    today,
    recommended,
    ranked,
    decisionBlocks,
    routine,
    future,
    capacity        // maxTasks, recommendedLoad, overloadRisk
  },

  budget,
  decision          // unified decision card: titel, href, cta, reasonCodes, …
}
```

**Implementatie-nuance:** `decision` kan fysiek in `snapshot.dashboard.critical.unifiedDecision` blijven zolang die **altijd** uit dezelfde pipeline komt als `missions`. Documenteer die garantie; anders krijg je weer drift.

---

## 4. Kernfunctie: `buildMissionState`

### 4.1 Plaatsing

**Aanbeveling:** één pure module, server-safe, geen React:

- `lib/missions/build-mission-state.ts` (of `lib/pipeline/build-mission-state.ts`)

Input (minimaal):

```ts
type BuildMissionStateInput = {
  dateStr: string;
  tasks: Task[];                    // of “flat + by date” — één canoniek model
  dailyState: DailyState | null;
  energyBudget: EnergyBudget | null;
  mode: BrainMode | null;           // afgeleid van daily state + carry-over, zoals nu
  todayEngine?: TodayEngineHints | null;  // als jullie dat al hebben als struct
  settings?: { backlogDays?: number; /* … */ };
};
```

Output: het `missions`-object uit §3.1 (zonder `raw` of met `raw` alleen op server response).

### 4.2 Interne stappen (volgorde)

1. Normaliseer taken (één lijst met `scheduledFor`, `isRoutine`, energy, priority, …).
2. `ranked = rankTasks(normalized, { mode, energy, … })` — bestaande UMS/ranking hierin verplaatsen.
3. `capacity = calculateCapacity({ energyBudget, mode, todayEngine, ranked })`.
4. `today = filterTodayTasks(ranked, dateStr, capacity)`.
5. `routine = filterRoutineTasks(normalized)`.
6. `future = filterFutureTasks(ranked, dateStr, backlogRules)`.
7. `recommended = getTopRecommendations({ ranked, today, todayEngine, mode, capacity })`.
8. `decisionBlocks` uit **`buildMissionState`** (nu in `lib/missions/build-mission-state.ts`), aangestuurd door dezelfde context als de oude missions-performance flow; server caching via **`getDecisionBlocksCached`** in `loadMissionsPipeline`, niet als losse pagina-call.

**Regel:** Geen aparte “getDecisionBlocks voor de tasks-pagina”; alleen de pipeline + snapshot/bootstrap.

**Performance-regel:** één pass over genormaliseerde taken waar mogelijk; geen extra DB-roundtrips binnen deze functie — alle inputs zitten al in het geheugen na de parallelle fetch-fase van de route.

---

## 5. Waar de pipeline draait

### 5.1 Server: `/api/bootstrap/today` als spil

Vandaag bouwt `app/api/bootstrap/today/route.ts` al dashboard, taken, daily state, energy budget, enz. parallel.

**Doelstroom:**

1. **Daily bootstrap (server-side indien mogelijk)**  
   - Idealiter: dezelfde logica als `/api/tasks/daily-bootstrap` **eerst** in dezelfde request (of gegarandeerd ervoor in cron).  
   - Als je bootstrap bewust client-only houdt: documenteer dat de *eerste* client-hit na login `daily-bootstrap` triggert vóór je een “final” snapshot vertrouwt, of voer bootstrap server-side toe aan deze route.

2. **Taken + state ophalen** (zoals nu).

3. **`missionState = buildMissionState({ … })`** in de route of in een dunne helper `buildBootstrapTodayPayload()`.

4. **`getDashboardPayload` / critical**  
   - Ofwel: dashboard builder krijgt `missionState` door en roept `deriveUnifiedDecision` aan met **`missions: missionState`** (compacte projectie).  
   - Ofwel: `deriveUnifiedDecision` importeert alleen een *samenvatting* (`missionsSummary`) om dependency-cycles te vermijden.

**Dubbel werk vermijden:** de route ondersteunt al `includeDashboard=0` — gebruik dat in flows waar dashboard en bootstrap in dezelfde user-actie zouden landen, zodat je geen twee keer `getDashboardPayload` betaalt.

### 5.2 Compacte input voor de decision engine

Niet de hele `ranked` array in `deriveUnifiedDecision` duwen. Wel bv.:

```ts
type MissionsDecisionInput = {
  todayCount: number;
  rankedTopIds: string[];
  recommendedCount: number;
  capacity: MissionCapacity;
  hasRoutine: boolean;
  backlogPressure: boolean;
};
```

Zodat regels als “geen taken → create_mission”, “overload → stabilize”, “low energy → light_mission” **dezelfde cijfers** gebruiken als de Missions-tab.

### 5.3 Client: `lib/daily-initialize.ts`

- Bij `fetchMissions`: response JSON bevat al `missions: MissionsSnapshot` (volledig of tiered — zie §7).
- Map naar `snapshot.missions` zonder client-side herberekening.
- `StoreHydrator` / `MissionsProvider`: hydrateren vanuit `snapshot.missions`, niet opnieuw ranken.

---

## 6. Consumers (wat elke plek mag doen)

| Consumer | Mag alleen |
|----------|------------|
| Dashboard shell | `snapshot.dashboard` + eventueel `snapshot.missions.capacity` / `recommended[0]` voor labels |
| Tasks / Missions tab | `snapshot.missions.decisionBlocks`, `ranked`, `recommended` |
| Calendar tab | `snapshot.calendar` **of** `snapshot.missions.today` + maandrange — één bron kiezen en duplicatie vermijden |
| Routine tab | `snapshot.missions.routine` |
| Server actions na mutatie | Taak CRUD → `scheduleSyncDailySnapshot` / merge zoals nu; **geen** lokale re-rank tenzij optimistic |

---

## 7. Performance, netwerk & vlotte loading

Dit is het stuk dat architectuur vertaalt naar **merkbare snelheid**: minder bytes, minder requests, minder dubbel werk, voorspelbare UI tijdens refresh.

### 7.1 Kritieke pad (eerste paint)

| Prioriteit | Wat de gebruiker nodig heeft | Hoe |
|------------|------------------------------|-----|
| P0 | Auth + shell + “vandaag is geladen” | Bestaande `BootstrapGate` / loader stappen |
| P1 | Dashboard critical + missions “hoofdstructuur” | Één `/api/bootstrap/today` (of gesplitst zie §7.6) — **geen** tweede round-trip voor `getDecisionBlocks` op de tasks-route |
| P2 | XP, strategy, analytics, settings | Blijft sequentieel in `initializeDailySystem` — overweeg alleen P2 parallel te trekken **als** metingen tonen dat P1 al snel genoeg is |

**Regel:** zodra `missions` in de bootstrap-response zit, mag de tasks-pagina **niet** opnieuw dezelfde ranking-server-action aanroepen voor de eerste render (SSR of client).

### 7.2 Payload afslanken (JSON-grootte)

Grotere mission state betekent langzamere parse + hogere memory. Richtlijnen:

- **`ranked`:** niet duizend volledige task-records dupliceren. Patronen:  
  - `rankedIds: string[]` + `taskById: Record<string, CompactTask>` één keer in `raw` of naast missions; of  
  - `ranked: CompactTask[]` met alleen velden die de UI nodig heeft (id, titel, datum, energy, status, …).  
  - Voeg `rankedTotalCount` toe als de lijst wordt afgekapt.
- **`future` / backlog:** harde cap (bijv. 50–100 items) of alleen eerste slice + `futureCursor` voor “load more” via aparte lichte route.
- **`decisionBlocks`:** blokken die een taak tonen houden bij voorkeur **taskId** + minimale displayvelden; geen tweede kopie van hele `tasksByDate`.
- **`buildMeta.inputHash`:** korte string (user + date + max `updated_at`) voor conditional requests (§7.4).

### 7.3 Server: één bouwfase na parallelle I/O

- Houd `buildMissionState` **na** `Promise.all([...])` van DB-reads; geen query in een loop per taak.
- Als ranking ooit duur wordt: meet eerst; dan pas micro-optimalisaties (pre-index op datum, één sort).

### 7.4 HTTP: conditional refresh (304 / skip body)

Voor **background merges** (`mergeDailySnapshotFromNetwork`, periodieke refresh):

- Response headers: `ETag: W/"{inputHash}"` of sterke etag.
- Client stuurt `If-None-Match` mee (zelfde als refresh-headers die jullie al gebruiken).
- Bij **304:** geen JSON parse, geen store-rewrite — alleen “still fresh” signal voor UI indien nodig.

Dit pakt vooral het geval “user typt niets, tab terug focus, merge triggert” af.

### 7.5 Client: debounce, coalescing, één vlucht

- **`scheduleSyncDailySnapshot` (~1400 ms):** meerdere snelle mutaties (complete, edit, delete) moeten **één** refetch worden — blijf dit patroon gebruiken; mission pipeline verandert daar niets aan.
- **Parallel guard:** voorkom dat `refreshMergedSnapshotFromNetwork`, periodieke refresh en een handmatige refresh **tegelijk** dezelfde URL hiten — één `inFlight` promise die gedeeld wordt levert minder serverload en minder race’s op de Zustand-store.
- **`fetch`: `cache: "no-store"`** voor authenticated bootstrap blijft logisch; optimaliseer met 304, niet met browser HTTP cache van gevoelige payloads.

### 7.6 Tweedeling “shell” vs “volledig”

**Live:** `GET /api/bootstrap/today?depth=core&includeDashboard=0` — zelfde DCIC/taken/daily state/energy + **`missionsPipeline` op root**, geen budget/learning-queries en geen dashboard-build. Default blijft de volledige payload.

**Optioneel later:** aparte route zoals **`GET /api/missions/extended`** voor extra backlog/ranked-window alleen bij “alles tonen”, als metingen de standaard-response te zwaar maken.

### 7.7 TanStack Query + HQ store (één cachelijn)

- `BootstrapTodayResponse` bevat o.a. `missionsPipeline` (root wanneer dashboard ontbreekt) en dashboard critical met pipeline wanneer dashboard wél zit in de response.
- `applyBootstrapTodayToApp` / `applyBootstrapHydration` patchen dashboard + `missionsPipeline` + slices na merge.
- **`bootstrapTodayQueryKey(date, "full" | "core")`** — `seedBootstrapTodayInCache` schrijft **beide** keys met dezelfde data na eerste bootstrap; `MissionsProvider` abonneert op **`core`** (slankere refetch), layout/budget op **`full`** (default).

### 7.8 Persisted snapshot: stale-while-revalidate

- Als jullie `DailySnapshot` uit storage tonen vóór netwerk: toon **direct** missions uit die snapshot (kan licht verouderd zijn), dan vervangen na succesvolle merge — vermijd lege states als data er al is.
- Zet `ui.offlineMode` / `date` mismatch duidelijk om te voorkomen dat oude rankings als “waarheid van vandaag” worden getoond.

### 7.9 Loading-UX (geen flikkering)

- **Tabwissel naar Missions:** geen suspense die opnieuw fetcht als `snapshot.missions` al bestaat; hooguit `React.startTransition` voor zware lijsten zodat klikken vloeiend blijft.
- **Na mutatie:** optimistic update op **één taak** in de lokale store + debounced merge; geen volledige client-side `buildMissionState` tenzij je een WASM/local copy van de engine hebt (niet nodig als merge snel is).
- **Skeletons:** alleen op het eerste bezoek zonder snapshot; bij refresh met bestaande data: subtiele “syncing” indicator i.p.v. hele pagina leegmaken.

### 7.10 Geheugen op de client

- Eén **`Map`/`Record` taskId → task** als bron na hydrate; `ranked` als id-lijst voorkomt dubbele objectgrafen naast `tasksByDate`.
- Calendar + missions mogen **dezelfde** task-map refereren, niet twee kopieën.

### 7.11 Periodieke refresh (bestaand gedrag)

- `PERIODIC_SNAPSHOT_REFRESH_MINUTES` (nu 10) blijft de “langzame” align met server.  
- Missie-state die in die payload zit, blijft automatisch gelijk aan dashboard — dat is juist het gewenste effect.  
- Throttle “min 25s tussen runs” in `usePeriodicBootstrapRefresh` blijft beschermen tegen focus-spam.

### 7.12 Observability (om echt te meten)

- **Server:** log of span per fase (`db_parallel`, `buildMissionState`, `getDashboardPayload`) — alleen in dev/staging of met sampling.  
- **Client:** optioneel `performance.mark` rond `initializeDailySystem` en rond eerste paint van missions.  
- **Productie:** één metric: p95 tijd tot `bootstrapCompletedAt` en p95 JSON-grootte van `/api/bootstrap/today`.

### 7.13 Anti-patterns (checklist)

- [x] Tasks-pagina SSR: gebruikt `loadMissionsPipeline`, geen losse `getDecisionBlocks`-export voor de pagina.  
- [ ] `ranked` bevat 500× hetzelfde task-object als in `tasksByDate`.  
- [x] Merge + periodieke refresh: gedeelde `inFlight` in `mergeDailySnapshotFromNetwork` (`lib/daily-snapshot-full-sync.ts`).  
- [ ] Backlog zonder cap in de standaard payload.  
- [ ] Decision engine gebruikt `tasksCount` uit een andere query dan `missions.today.length`.

### 7.14 Minimale React-rerenders (client)

Het eerste ontwerp vraagt: **één snapshot, alleen views**. Als de hele `DailySnapshot` bij elke kleine wijziging opnieuw in React Context belandt, re-rendert half de app — dat ondermijnt het voordeel. Richtlijnen:

**Store (Zustand) — smalle selectors**

- Gebruik **`useHQStore(selector, shallow)`** (of `useShallow` uit `zustand/react/shallow`) zodat een component alleen opnieuw rendert als **zijn** slice echt verandert.
- Splits missions in de store: bv. `missionsDecisionBlocks`, `missionsRankedIds`, `missionsCapacity` **of** één `missions` object dat je **alleen vervangt wanneer `inputHash` / servermerge** zegt dat missions echt nieuw is — niet bij elke `setTodayDailyState` tick.
- Na merge: **één** `setState` die missions + dashboard critical samen zet als ze uit dezelfde response komen, i.p.v. vijf losse setters die elk een render-trigger zijn (of batch met `unstable_batchedUpdates` / React 18 automatic batching — nog steeds: liever één coherente update).

**Context (`useDailySnapshot`) — niet de hele boom laten hangen**

- Vermijd `useDailySnapshot()` in de root van grote layouts als dat alleen doorgegeven wordt aan kinderen die **missions** nodig hebben — dat abonneert iedereen op elke snapshot-wijziging.
- Patronen:  
  - **Gesplitste context:** `MissionsSnapshotContext` alleen rond missions-tab + providers die missions nodig hebben, of  
  - **Geen context voor missions:** alleen Zustand-selector op missions-slice (aanbevolen als jullie toch al HQ store gebruiken voor tasks).
- `BootstrapGate` / provider: bij update van `snapshot`, vervang het **root object** alleen wanneer nodig; voor tussentijdse `ui.savedAt` updates overweeg een aparte context of ref om missions-subscribers niet te invalidaten.

**Referentiële stabiliteit**

- Bij **304 / geen wijziging:** geen nieuwe objectreferenties schrijven naar store (zelfde snapshot blijft) — voorkomt cascadererenders (koppelt aan §7.4).
- `useMemo` alleen waar het de **semantiek** beschermt (afgeleide arrays uit props), niet overal blind — de hoofdwinst komt van **minder store writes** en **smalle selectors**.
- `useCallback` voor event handlers die je doorgeeft aan **gememoïseerde** kinderen (`React.memo` op zware rijen).

**Lijsten (missions / calendar)**

- **`React.memo`** op task-rij / decision-block rij; props minimaal houden (`taskId` + weergavevelden, geen hele `snapshot` doorgeven).
- **Lijst-sleutels** stabiel (`taskId`), geen index als key bij sorteerbare lijsten.
- **`startTransition`** voor het tonen van een grote `ranked`-lijst na tab-switch (§7.9) — houdt invoer responsief zonder dubbele data-fetch rerenders.
- Vermijd `ranked.map` die elke render **nieuwe** child-objecten bouwt; data komt uit stabiele snapshot-structuur.

**TanStack Query**

- `useBootstrapToday(date, { variant: "full" | "core" })` — alleen waar nodig; overige views: store + smalle selector (`useShallow`).
- Optioneel: `select` / `notifyOnChangeProps` als één query-key toch te veel rerenders geeft (core-payload is al klein server-side).

**Effecten**

- Geen `useEffect([snapshot])` die alleen “derived state” zet — dat dubbelt renders. Liever afleiding tijdens render met `useMemo` of direct in selector.
- Server actions + `router.refresh()`: koppel niet elke actie aan een **full tree** refresh als alleen missions-slice via merge kan worden bijgewerkt.

**Meten**

- React DevTools **Profiler**: record tijdens complete task + merge; kijk welke componenten >1× renderen door store-updates.
- Doel: na merge **één** “commit” die missions + dashboard critical samen bijwerkt; geen golf door `xp`/`settings` als die niet in de response zitten.

### 7.15 Render-anti-patterns (checklist)

- [ ] Layout roept `useDailySnapshot()` aan en rendert 20+ children die geen missions gebruiken.  
- [x] Eerste paint hydrate: `StoreHydrator` gebruikt **één** `setState` i.p.v. reeks losse HQ-store setters.  
- [ ] 304-merge schrijft toch een **nieuw** `{...snapshot}` naar context.  
- [ ] Tasklijst krijgt elke render een nieuwe `tasks={tasks.filter(...)}` array zonder memo op basis van stabiele ids.  
- [ ] `deriveBrainUI` of vergelijkbaar draait op parent en leidt tot re-render van hele dashboard bij elke missions-touch.

---

## 8. Invalidatie en refresh

- **Na mutatie:** bestaand patroon behouden: `queueDailySnapshotMerge` → `scheduleSyncDailySnapshot` → `mergeDailySnapshotFromNetwork` → `applyBootstrapTodayToApp`.
- **Mission-aware:** zodra missions in de bootstrap zitten, moet elke merge **ook** de missions-slice in store + TanStack Query bijwerken (zie §7.7).
- **Conditioneel:** combineer met §7.4 (`ETag` / `inputHash`) om onnodige parses te skippen.

---

## 9. Gefaseerde implementatie (aanbevolen volgorde)

### Fase A — Contract zonder gedrag te breken

1. Breid `MissionsSnapshot` uit met **optionele** velden (`ranked`, `decisionBlocks`, …).
2. Implementeer `buildMissionState` en roep het aan **alleen server-side** na bestaande queries; vul nieuwe velden, laat oude UI nog ongewijzigd.
3. Log in dev: diff tussen oude `getDecisionBlocks` output en nieuwe pipeline (tijdelijk).
4. Meet JSON-grootte voor/na §7.2.

### Fase B — Decision engine koppelen

1. Voeg `missionsSummary` toe aan `deriveUnifiedDecision` input.
2. Migreer regels die nu op losse `tasksCount` draaien naar samenvatting uit mission state waar dat strikter is.
3. Dashboard blijft werken; gedrag wordt consistenter.

### Fase C — UI alleen-lezen + loading

1. [x] Tasks page: `loadMissionsPipeline` i.p.v. losse decision-blocks call voor de hoofdstructuur.
2. [x] Store-updates voor missions/pipeline via `applyBootstrapHydration` / `applyBootstrapTodayToApp`.
3. Pas skeletons aan: geen dubbele loading states (iteratief).

### Fase D — Bootstrap-volgorde afdwingen

1. Trek `daily-bootstrap` logica naar server pre-step in bootstrap route **of** strikte client volgorde in `initializeDailySystem` vóór eerste paint van missions.
2. Acceptance: geen “lege ranked” op eerste frame tenzij echt geen taken.

### Fase E — Performance-afwerking

1. [x] `ETag` / `If-None-Match` op bootstrap (o.a. `lib/bootstrap-etag.ts`).
2. [x] `inFlight`-dedup voor merge-refetch (`mergeDailySnapshotFromNetwork`).
3. [x] `depth=core` + gesplitste TanStack-keys (`full` / `core`).

### Fase E2 — Rerenders (na missions in store)

1. Introduceer smalle Zustand-selectors voor `missions` / `unifiedDecision`; verwijdere brede `useHQStore()` zonder selector waar mogelijk.
2. Audit `useDailySnapshot()` — beperk tot providers + bladeren die echt multi-slice nodig hebben.
3. Profiler-run na task complete + merge; fix top offenders (memo + stabiele props).

### Fase F — Opschonen

1. [x] Publieke naam `getDecisionBlocks` verwijderd; alleen `getDecisionBlocksCached` voor pipeline + UMS-warm.
2. Verwijder dubbele filtering in tab-componenten (audit).

---

## 10. Test- en acceptatiechecklist

- [ ] Zelfde `dateStr`: dashboard “next action” en missions “top block” verwijzen naar dezelfde intent (geen tegengestelde aanbevelingen).
- [ ] Mode wijzigen (low energy / stabilize) beperkt `today` en verhoogt `overloadRisk` consistent in decision + UI.
- [ ] Na task complete: merge snapshot; geen flash van oude ranking > 1s zonder loading state.
- [x] Drie snelle completes: debounced merge (`scheduleSyncDailySnapshot`) + `inFlight`-dedup op merge-fetch.
- [x] 304-response bij bootstrap refresh: geen JSON-parse; client behoudt vorige state waar van toepassing (`mergeDailySnapshotFromNetwork` → `null` bij 304).
- [ ] Offline / gisteren snapshot: gedocumenteerd gedrag (read-only of force refresh).
- [ ] Snapshot version bump: oude localStorage cache wordt genegeerd en app bootst opnieuw.
- [ ] p95 bootstrap-payload onder afgesproken limiet (stel zelf KB-doel na baseline-meting).
- [ ] Na merge: missions-gerelateerde subtree rendert niet opnieuw als alleen ongerelateerde slice (bv. learning) zou wijzigen — test met Profiler.
- [ ] 304-pad: geen onnodige context/store rewrite → geen extra render van missions-lijst (Profiler verifiëren).

---

## 11. Bestanden die je waarschijnlijk aanraakt

| Gebied | Bestanden |
|--------|-----------|
| Types | `types/daily-snapshot.ts`, eventueel `types/missions-state.ts` |
| Pipeline | **nieuw** `lib/missions/build-mission-state.ts` |
| Bootstrap API | `app/api/bootstrap/today/route.ts` |
| Decision | `lib/unified-decision-engine.ts`, `lib/missions/missions-summary-for-decision.ts`, `app/actions/dashboard-data.ts` |
| Client load | `lib/daily-initialize.ts`, `lib/bootstrap-today-mappers.ts` (als mapping groeit) |
| Merge / refresh | `lib/daily-snapshot-full-sync.ts`, `lib/daily-bootstrap.ts`, `lib/client-refresh.ts` |
| Query | `lib/bootstrap-query.ts`, `lib/use-bootstrap-today.ts` |
| Tasks UI | `app/(dashboard)/tasks/page.tsx`, `components/missions/*` (geen `TasksDailyBootstrap`) |
| Store hydrate | `components/bootstrap/StoreHydrator.tsx` |
| Layout / periodic | `components/dashboard/DashboardLayoutClient.tsx` (periodic hook) |
| Rerenders | `lib/hq-store.ts` (selectors), `components/bootstrap/BootstrapGate.tsx`, `components/missions/MissionsProvider.tsx`, zware lijsten onder `components/missions/*` |

---

## 12. Samenvatting

**Van:** drie plekken die elk “missies” interpreteren (dashboard payload, missions actions, tab-filters), plus risico op dubbele fetches, zware JSON en **cascadererenders** doordat half de app op dezelfde context/store hangt.

**Nu in de repo:** gedeelde server-pipeline (`loadMissionsPipeline`), missions op dashboard critical + bootstrap, tasks-route zonder aparte decision-fetch, optionele **core**-bootstrap, dubbele query-seed, batch **StoreHydrator**, verwijderde client daily-bootstrap-dubbeling.

**Nog richting volledig doelbeeld (§3.4):**

1. **Eén logische system snapshot** — alles wat de app “vandaag” nodig heeft in één coherent contract (nu: stappen via `DailySnapshot` + store; verder uitbreiden waar nodig).  
2. **Frontend leest alleen** — tabs blijven views; geen tweede ranking-engine in de client.  
3. **`deriveUnifiedDecision`** — verder uitlijnen met pipeline-signalen waar nog losse `tasksCount`-paden bestaan.  
4. **Minimale rerenders** — Profiler op zware lijsten (`TaskList` e.d.), 304 zonder nutteloze context-refresh, eventueel `React.memo` op rijen.

Dit document blijft de kaart voor die laatste stappen en voor payload-verdunning (`taskById`, caps).
