# Wat in Supabase vs in de app

## Overzicht

- **Supabase** wordt gebruikt voor: gebruikersgegevens, state die over sessies/apparaten moet syncen, en data die door de backend (cron, API) moet worden gelezen of geschreven.
- **In de app (site code)** blijft: statische content, templates, configuratie die niet per gebruiker hoeft te variëren.

## Wat wordt naar Supabase weggeschreven / vandaar geladen?

| Categorie | In Supabase | Kan in-app blijven? |
|-----------|-------------|----------------------|
| **Auth & profiel** | users (auth, payday_day_of_month, last_payday_date, budget_period, preferences, …) | Nee – moet server-side en cross-device |
| **Taken** | tasks, task_events | Nee – kern van de app, rollover, rapporten |
| **Budget** | budget_entries, budget_targets, income_sources, savings_goals, … | Nee – moet persistent en gedeeld |
| **Agenda** | calendar_events, user_google_tokens | Nee – sync en OAuth |
| **Quotes** | — (geen tabel meer) | **In app** – `lib/quotes-data.json` + `lib/quotes.ts`; geen Supabase-query |
| **Daily state** | daily_state (energy, focus, load, mental_battery, zero_completion_penalty_applied, focus_consumed, is_rest_day, …) | Nee – gebruikt door engine en rapporten |
| **Game/XP** | user_xp, user_streak, achievements, user_gamification (progression_rank, prime_window_start/end), weekly_reports (performance_index, avg_rank_numeric, consistency_days), weekly_budget_adjustment (Fase 7–10) | Nee – progressie en identity |
| **Mission templates (auto-missies)** | Alleen de *gecreëerde* taken (in `tasks` met psychology_label MasterPoolAuto) | **Templates in code** – zie hieronder |

## Wat wordt nu al uit de app geladen (geen Supabase-query)?

Deze data komt **niet** uit Supabase; ze staan in de app en zijn daarmee sneller en offline-vriendelijker:

| Data | Waar in de app | Gebruik |
|------|----------------|--------|
| **Quotes (dagelijkse quote)** | `lib/quotes-data.json` + `lib/quotes.ts` → `getQuoteForDay` / `getQuoteByDayNumber` | Dashboard, cron push, API dashboard data |
| **Mission templates (MASTER_MISSION_POOL)** | `lib/mission-templates.ts`, `lib/master-mission-pool.ts` | Auto-missies; alleen gekozen taken → `tasks` in Supabase |
| **Achievement-definities** (keys, voorwaarden) | `app/actions/dcic/achievements.ts` (ACHIEVEMENT_KEYS, checks) | Alleen “wie heeft wat geunlocked” staat in Supabase |
| **Preference-defaults** | `types/preferences.types.ts` (PREFERENCES_DEFAULTS) | `getUserPreferencesOrDefaults`; alleen opgeslagen waarden in `user_preferences` |
| **Feature-flag-defaults** | `app/actions/feature-flags.ts` (DEFAULTS) | Per-user overrides in `feature_flags`; zonder override = default uit code |
| **Assistant feature-flag-defaults** | `app/actions/assistant/get-engine-state.ts` (return bij `!data`) | Per-user overrides in `assistant_feature_flags` |
| **CTA-/copy-varianten** | Inline in `app/api/dashboard/data/route.ts` + `getAdaptiveSuggestions` | Geen tabel; afgeleid uit mode/state |
| **Mascots, thema’s, emoties** | o.a. `lib/mascots.ts`, `lib/theme-tokens`, `lib/emotions` | Statische lijsten in code |

## Wat wordt wél uit Supabase geladen maar zou (deels) uit de app kunnen?

- **Feature flags** (`feature_flags`): Defaults staan al in de app; de Supabase-query is alleen voor per-user overrides. **Optie:** eerste paint altijd met DEFAULTS uit code; optioneel een lazy fetch van overrides (bijv. na first paint of alleen op pagina’s die flags nodig hebben). Dan is de kritieke pad niet afhankelijk van Supabase voor flags.
- **Assistant feature flags** (`assistant_feature_flags`): Zelfde patroon – defaults in code, Supabase alleen voor overrides. **Optie:** standaard in-code defaults; Supabase alleen aanroepen wanneer de assistant wordt gebruikt.
- **Quotes**: Vroeger mogelijk een `quotes`-tabel; nu al volledig in de app (zie boven). Geen actie.

De rest (tasks, daily_state, budget, users, calendar, …) is echte gebruikers-/sessiedata en moet in Supabase blijven voor persistentie en sync.

## Wat kan gerust in de app blijven?

- **Quote-bibliotheek**: als je geen CMS nodig hebt, kun je quotes als JSON/array in de code hebben; `getQuoteForDay` zou dan uit die array lezen i.p.v. Supabase. Scheelt een roundtrip per quote.
- **Mission templates (MASTER_MISSION_POOL)**: staan nu in `lib/mission-templates.ts`. Die horen in de app: geen DB nodig om de pool te lezen, alleen om de gekozen taken als `tasks` op te slaan.
- **Feature flags**, **default preferences**: kunnen in code met optionele override in Supabase.
- **Statische teksten**, **CTA-varianten**, **mascot bestandsnamen**: al in code.

## Auto-missies: Supabase of in de site code?

- **Sneller in de site code (zoals nu):**
  - De **templates** (MASTER_MISSION_POOL) staan in `lib/mission-templates.ts`; selectielogica in `lib/master-mission-pool.ts`. Geen DB-read voor de pool.
  - Alleen het **resultaat** van “vandaag 2–4 auto-missies” wordt in Supabase opgeslagen (`tasks` met `psychology_label = 'MasterPoolAuto'`).
- **Als je ze in Supabase zet:**
  - Je zou een tabel `master_mission_templates` kunnen hebben en bij elke page load of cron die pool ophalen. Dat is **trager** (extra query) en complexer (migraties, RLS) zonder echte voordeel, tenzij je templates per gebruiker of via een admin UI wilt beheren.
- **Advies:** templates in de code houden; alleen de aangemaakte taken in Supabase. Als je later templates per gebruiker of via CMS wilt, kun je alsnog een Supabase-tabel toevoegen en de code daarop laten fallback.
