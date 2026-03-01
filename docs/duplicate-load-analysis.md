# Analyse: onnodig dubbel geladen data

Korte inventaris van waar dezelfde Supabase-tabellen of -flows meerdere keren worden geladen in één request of in opeenvolgende acties.

---

## 1. Dashboard critical request (`GET /api/dashboard/data?part=critical`)

In één response worden o.a. deze parallel aangeroepen:

| Data | Aantal loads | Waar |
|------|--------------|------|
| **Tasks (vandaag)** | **2×** | `getTodayEngine(dateStr)` roept intern `getTodaysTasks()` aan; daarna wordt `getTodaysTasks(dateStr, taskMode)` nóg eens aangeroepen (regel 110) voor `todaysTasks` en `carryOverCount`. |
| **daily_state (vandaag)** | **3–4×** | (1) `getDailyState(dateStr)` in Promise.all; (2) `getMode(dateStr)` binnen `getTodayEngine` roept `getDailyState(dateStr)` aan; (3) `getTodayEngine` haalt zelf `daily_state` op via Supabase; (4) `getEnergyBudget(dateStr)` haalt `daily_state` op. Alleen `getDailyState` en eventueel `getEnergyBudget` gebruiken `unstable_cache`. |
| **Tasks (vandaag)** | +1 in energy | `getEnergyBudget` laadt ook `tasks` voor die datum (completed + incomplete) voor energy-used/planned. Dus **tasks** voor dezelfde dag: 2× volledige lijst + 1× voor energy = effectief **3×** aanroepen naar de `tasks`-tabel. |

**Conclusie critical:** taken voor vandaag 2× (of 3× met energy), daily_state voor vandaag 3–4×.

---

## 2. Dashboard secondary request (`part=secondary`)

| Data | Opmerking |
|------|-----------|
| **getTodayEngine(dateStr)** | Wordt opnieuw aangeroepen. Als de gebruiker eerst `critical` en daarna `secondary` laadt, zijn today-engine + taken + streak + daily_state voor vandaag opnieuw geladen. |
| **getDailyState** | `getDailyState(dateStr)` en `getDailyState(yesterdayStr)` worden opnieuw aangeroepen (regels 290–291), terwijl `state`/energy al in andere onderdelen zit. |
| **getEnergyBudget(dateStr)** | Wordt aan het einde opnieuw aangeroepen (regel 318) → weer daily_state + tasks + calendar_events. |

---

## 3. Game state en missions

**getGameState()** laadt o.a.:  
`user_xp`, `missions`, `user_streak`, `achievements`, `user_skills`, `daily_state` (vandaag), en roept **getFinanceState()** aan (die o.a. `users`, `income_sources`, `budget_entries`, `budget_targets`, `savings_goals`, `budget_weekly_reviews` laadt).

| Waar | Aanroepen |
|------|-----------|
| **dcic/missions.ts** | `getGameState()` in: `startMission`, `confirmStartMission`, `completeMission`, `confirmCompleteMission` → tot **4×** de volledige game state (incl. finance) bij een flow start → confirm → complete → confirm. |
| **dcic/finance-xp.ts** | 1× `getGameState()` alleen voor finance-gerelateerde data. |
| **lib/dcic/assistant-integration.ts** | 1× `getGameState()`. |

**getFinanceState()** wordt dus ook geladen wanneer alleen missions worden gebruikt (niet alleen op de budget-pagina).

---

## 4. user_streak

Dezelfde `user_streak`-rij (voor de ingelogde user) wordt opgehaald in o.a.:

- `game-state.ts` (getGameState)
- `today-engine.ts` (getTodayEngine + getTodayEngineData)
- `missions-performance.ts` (2× in verschillende functies)
- `insight-engine.ts`
- `momentum.ts`
- `smart-suggestion.ts`
- `xp-forecast.ts` (via getTodayEngine)
- `streak.ts`

Geen gedeelde cache tussen deze flows → bij meerdere acties/pagina’s wordt streak meerdere keren geladen.

---

## 5. getFinanceState() dubbel

- **game-state.ts**: `getGameState()` roept altijd `getFinanceState()` aan, ook als de UI alleen level/XP/missions toont.
- **budget/page.tsx**: roept `getFinanceState()` direct aan.

Als iemand zowel dashboard (of missions, via game state) als budget opent, wordt finance state twee keer volledig opgehaald.

---

## 6. getTodaysTasks() op meerdere plekken

- **dashboard/data critical**: in `getTodayEngine` + expliciet nog eens (dubbel).
- **dashboard/data secondary**: in `getTodayEngine`.
- **tasks/page.tsx**: 1× voor de taskpagina.
- **missions-performance.ts**: 2× in twee verschillende functies (regels 208 en 592).
- **today-engine**: zowel `getTodayEngine` als `getTodayEngineData` roepen `getTodaysTasks` aan.

Geen gedeelde cache tussen dashboard, tasks-pagina en missions-performance.

---

## 7. Overlap today-engine en daily state

- **getTodayEngine** en **getTodayEngineData** doen allebei:  
  `getMode(dateStr)` → `getDailyState(dateStr)`, plus eigen Supabase-aanroep voor `daily_state` en `user_streak`.
- **getMode** roept voor dezelfde `date` altijd **getDailyState(date)** aan.

Dus voor één datum: meerdere keren mode + meerdere keren daily_state binnen dezelfde “today”-flow.

---

## Samenvatting aantal onnodige/dubbele loads

| Onderdeel | Geschat dubbel/onnodig |
|-----------|------------------------|
| **Tasks (vandaag)** in 1 critical request | 2× volledige lijst + 1× voor energy |
| **daily_state (vandaag)** in 1 critical request | 3–4× |
| **getGameState** bij mission-flow (start + confirm + complete + confirm) | 4× volledige state (incl. finance) |
| **getFinanceState** | 1× in game state (ook wanneer niet op budget) + 1× op budget-pagina |
| **user_streak** | Geen gedeelde cache; bij elke flow opnieuw (today, game, insights, momentum, etc.) |
| **getTodaysTasks** | 2× in dezelfde critical request; opnieuw bij secondary, tasks page, missions-performance |

---

## Aanbevelingen (kort)

1. **Dashboard critical**:  
   - Niet naast `getTodayEngine(dateStr)` nog eens `getTodaysTasks(dateStr, taskMode)` aanroepen.  
   - `carryOverCount` en de takenlijst voor de CTA uit de **bestaande** `todayEngine`-resultaat halen (eventueel today-engine uitbreiden met `carryOverCount`), zodat tasks maar 1× (of 1× + energy) worden geladen.

2. **daily_state voor vandaag**:  
   - Eén “bron van waarheid” in de critical response (bijv. alleen `getDailyState(dateStr)`), en die doorgeven aan o.a. `getTodayEngine` en `getEnergyBudget` als ze die datum nodig hebben, of een kleine “daily state context” die één keer wordt geladen en hergebruikt.

3. **getGameState / getFinanceState**:  
   - Finance alleen laden wanneer de UI het nodig heeft (bijv. optionele parameter of aparte `getGameStateWithoutFinance()` voor missions).  
   - Of game state cachen (bijv. request-scoped of korte TTL) zodat opeenvolgende mission-acties niet 4× dezelfde state laden.

4. **user_streak / getTodaysTasks**:  
   - Waar mogelijk resultaten cachen (bijv. `unstable_cache` met duidelijke key per user + datum) of één “today context” (tasks + streak + daily_state) bouwen en hergebruiken in dashboard, today-engine en missions-performance.

5. **secondary response**:  
   - Geen tweede keer `getDailyState` / `getEnergyBudget` voor dezelfde datum als die al in de eerder geladen critical of in de parallelle secondary-data zit; die hergebruiken in de response.

Als je wilt, kan er per aanbeveling een concreet refactorstapje (functiesignaturen + call sites) worden uitgewerkt.

---

## Client-side: 1× laden en in localStorage tot er een update is

Deze data verandert zelden of alleen na een duidelijke gebruikersactie. Ideaal om **één keer** op te halen, in **localStorage** te zetten en pas te verversen bij update of na invalidation.

### Sterke kandidaten (wijzigen alleen in settings of door admin)

| Data | Huidige plekken | Cache key (voorbeeld) | Wanneer invalideren |
|------|-----------------|------------------------|----------------------|
| **User preferences** (theme, color_mode, compact_ui, reduced_motion, auto_master_missions) | Dashboard critical, settings, bootstrap, ThemeHydrate, adaptive, master-missions | `prefs-{userId}` of gewoon `prefs` (1 user per device) | Na `updateUserPreferences()` — direct na opslaan in settings lokaal overschrijven of key verwijderen. |
| **Feature flags** | Diverse checks | `flags-{userId}` | Na wijziging in settings of na login (versie per sessie). |
| **Budget settings** (currency, monthly_budget_cents, savings, payday, etc.) | Dashboard critical + secondary, budget page, report, settings | `budget-settings-{userId}` | Na elke budget-mutatie (save settings, update target, etc.) — revalidatePath wordt al aangeroepen; client kan na die actie cache clearen of overschrijven. |
| **Behavior profile** | Today-engine (2×), settings, xp page, confrontation, master-missions, behavior-missions, thirty-day-mirror | `behavior-profile-{userId}` | Na opslaan in behavior/profile settings. |
| **Accountability settings** | Dashboard critical, behavior actions | `accountability-{userId}` | Na wijziging in learning/accountability settings. |
| **Quarterly strategy** (doelen, key results) | Dashboard secondary, strategy page, strategyFocus, learning-state | `strategy-{userId}-{year}-{quarter}` | Na aanmaken/bewerken/archiveren van strategy (revalidatePath strategy wordt al gedaan). |

Implementatie-idee: bij eerste load per pagina/shell eerst `localStorage.getItem(key)`; als er een geldige waarde + optioneel `updated_at` of `version` in zit, die gebruiken (en eventueel in de achtergrond revalidaten). Anders server action aanroepen, response in localStorage zetten met timestamp/version, daarna tonen. Bij elke **mutatie** die deze data wijzigt: na succesvolle server action dezelfde key in localStorage updaten of verwijderen, zodat de volgende read opnieuw fetcht.

### Per-dag cache (key bevat datum; geldig tot dagwissel of tot mutatie)

| Data | Cache key | Wanneer invalideren |
|------|------------|----------------------|
| **Quote van de dag** | `quote-{dayOfYear}` (1–365) | Automatisch: volgende dag andere key. Optioneel: TTL tot middernacht. |
| **Daily state voor een datum** | `daily-state-{userId}-{date}` | Bij `saveDailyState()` voor die datum: cache voor die date updaten of verwijderen. |
| **Mode voor een datum** | Afgeleid uit daily_state + carryOver; kan in dezelfde “dag”-cache zitten als daily_state. | Zelfde als daily_state. |

Quotes zijn nu al server-side gecached (unstable_cache 24h); lokaal cachen is optioneel en bespaart vooral round-trips als de gebruiker meerdere keren dezelfde dag opent.

### Minder geschikt voor “tot update” in localStorage

- **Taken voor vandaag** — verandert bij elke complete/add/delete/snooze. Invalideren zou bij elke task-actie moeten; makkelijker met server/revalidate of korte TTL.
- **Streak / XP / game state** — verandert bij mission complete, task complete, XP-events. Veel mutaties; cache zou vaak moeten invalideren.
- **Finance state (entries, targets, insights)** — wijzigt bij elke budget-entry of target-edit. Liever server-cache of korte sessie-cache.

### Praktisch stappenplan

1. **Eén helper** (bijv. `lib/client-cache.ts`):  
   `getCachedOrFetch<T>(key, fetcher, options?)`  
   - Lees localStorage; als geldig (aanwezig + niet verlopen), return.  
   - Anders `fetcher()` aanroepen (server action), resultaat + `updated_at` of `version` wegslaan, return.

2. **Invalidatie**: bij elke bestaande mutatie die preferences/budget/behavior/strategy wijzigt, na succes:  
   - `localStorage.setItem(key, JSON.stringify({ data: newData, updated_at: Date.now() }))`  
   of  
   - `localStorage.removeItem(key)`  
   zodat de volgende read vers ophaalt.

3. **Eerst toepassen op**: user preferences en feature flags (veel reads, weinig writes). Daarna budget settings en behavior profile als die op meerdere plekken worden gelezen.
