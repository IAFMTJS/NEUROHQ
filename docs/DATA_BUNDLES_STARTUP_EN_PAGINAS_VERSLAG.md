# NEUROHQ data-bundles in mensentaal

Dit is een praktisch overzicht van:
- welke data bij startup wordt geladen,
- wat lokaal als snapshot/cache wordt bewaard,
- en welke data per pagina wordt opgehaald.

## 1) Wat laadt NEUROHQ bij startup?

Bij elke start van een dashboard-route draait `BootstrapGate` + `BootstrapLoader`.
De app probeert eerst een **geldige same-day snapshot** van het device te gebruiken. Als die er niet is, wordt alles opnieuw van het netwerk geladen via `initializeDailySystem`.

De startup-stappen zijn:

1. **Missions + dag-kern (`fetchMissions`)**
   - Via `GET /api/bootstrap/today`.
   - Dit levert de grootste bundle met o.a.:
     - datum,
     - dashboard payload (critical + secondary),
     - `dcicGameState`,
     - tasks voor vandaag,
     - `dailyState`,
     - `energyBudget`,
     - budget snapshot,
     - learning snapshot.
   - Daarna wordt ook kalender-tab data opgehaald via `GET /api/tasks/calendar-tab?...`.

2. **XP-context (`fetchXP`)**
   - Via `GET /api/xp/context?date=...`.
   - Voor XP/identity/forecast/insight context.

3. **Strategy snapshot (`fetchStrategy`)**
   - Via `GET /api/strategy/snapshot`.

4. **Analytics snapshot (`fetchAnalytics`)**
   - Via `GET /api/analytics/snapshot`.

5. **Settings payload (`fetchSettings`)**
   - Via settings API-client (`preferences + payday`).

Kort: startup is een **dagpakket** (dashboard/missions/tasks/energy/budget/learning) plus aparte bundles voor **XP, strategy, analytics en settings**.

## 2) Wat wordt lokaal bewaard?

## 2a) Local snapshot (cold-start snapshot)

De primaire startup-snapshot staat in **IndexedDB** database `neurohq-device`, store `dailySnapshot`, record `neurohq-daily-init-v3`.

Daarin zit per user + dag:
- `snapshot` (dagstate),
- `bootstrapToday` (raw bootstrap payload),
- `savedAt`,
- `snapshotVersion`,
- `validityDayKey`.

Gebruik:
- Bij volgende app-start op dezelfde dag: direct uit lokale snapshot renderen.
- Daarna stille network merge/refresh.

## 2b) Mobile data-cache (SQLite op native, IndexedDB fallback)

Voor mobile sync/local-first gebruikt NEUROHQ:
- native app: SQLite `neurohq_mobile`,
- web/PWA fallback: IndexedDB `neurohq-mobile-cache`.

Belangrijkste stores/tabellen:
- `entity_cache` (server payloads met `stale_at`, bv `tasks:YYYY-MM-DD`),
- `outbox` (offline mutaties),
- `sync_checkpoint` (cursor per domein).

Native-only extra:
- `native_asset_registry`,
- `native_extended_kv`.

## 2c) LocalStorage (lichte UI/cache sleutels)

`localStorage` wordt gebruikt voor lichte clientdata, niet als bron van waarheid:
- `neurohq:mutations:*` (legacy mutation queue),
- `neurohq:ui:*` (UI voorkeuren),
- mobile feature rollout bucket (`neurohq:mobile:bucket`),
- mobile metrics (`neurohq:mobile:metrics:v1`),
- persona/sound/speech voorkeuren,
- enkele pending client states (bv budget/daily pending writes).

Let op:
- Oude daily snapshot key in localStorage (`neurohq-daily-snapshot-v1`) wordt alleen nog opgeschoond; primaire snapshot zit in IndexedDB.

## 3) Welke data wordt per pagina geladen?

Onderstaande is het actuele gedrag in de page-load code.

### Dashboard (`/dashboard`)
- Auth-check via Supabase user.
- Dashboard-content gebruikt vooral data die al in de bootstrap/snapshot zit (via layout providers + store hydratie).
- Extra componenten zoals growth strip laden hun eigen data asynchroon.

### Tasks (`/tasks`)
- Altijd dynamisch geladen.
- Laadt o.a.:
  - user preferences,
  - backlog tasks,
  - routine tasks + suggesties,
  - calendar-tab data (tasksByDate + upcoming events + Google-connect status),
  - missions-tab data (mode, completedToday, smartSuggestion, energy cap/budget, missions pipeline, identity, behavior profile, subtasks).
- Door tab-architectuur worden calendar/routine/missions data parallel voorbereid.

### Budget (`/budget`)
- Eerst preamble: preferences + periode/payday context.
- Daarna grote batch met budgetdata:
  - goals, entries, recurring, frozen,
  - budget settings,
  - maand/week income + expenses,
  - finance state + insights,
  - discipline/weekly review,
  - optimization/control/pacing hints,
  - aanvullende context voor execute/analysis/lock tabs.
- Bij history view extra maand-specifieke aggregaties.

### Learning / Growth (`/learning`)
- Sync van growth focus naar kalenderweek.
- Laadt parallel:
  - user preferences,
  - protocol library,
  - protocol progress map,
  - growth focus,
  - strategy pacing hints.

### Strategy (`/strategy`)
- Laadt:
  - user preferences,
  - actieve strategy focus + history.
- Bij actieve strategy volgen extra calls:
  - budget savings context + contract-check,
  - alignment berekening/upsert,
  - pressure index,
  - review status,
  - quarter engine snapshot,
  - alignment this week.

### Settings (`/settings`)
- Auth-check.
- Laadt parallel:
  - Google Calendar token-status,
  - timezone,
  - XP,
  - push tijden + quiet hours + push-enabled,
  - user preferences,
  - budget settings.
- Daarmee worden alle settings cards initieel gevuld.

### Report (`/report`)
- Laadt zelf geen report data meer.
- Redirect direct naar `/profile?view=insights...`.

### Home/Login/Signup/Offline/Not-found/Error
- Geen zware domeinbundles; vooral auth/UI routing.

## 4) Samenvatting in 6 regels

- Startup gebruikt eerst een **device snapshot**, anders een **5-staps network bootstrap**.
- Grootste bundle is `/api/bootstrap/today` (dashboard + tasks + energy + budget + learning + game state).
- Snapshot voor cold start staat in IndexedDB `neurohq-device` (`dailySnapshot`).
- Mobile local-first cache staat in SQLite (native) of IndexedDB fallback (`neurohq-mobile-cache`).
- `localStorage` is vooral voor UI/pending/metrics/flags, niet voor hoofddata.
- Per pagina wordt aanvullende domeindata geladen; `tasks` en `budget` zijn de zwaarste pagina-loads.
