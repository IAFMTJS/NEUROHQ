# Analyse V2: Prompt-specs vs implementatie (grondig)

**Datum:** 22 feb 2025  
**Doel:** Eerlijke, bestandsgebaseerde vergelijking. Waar de vorige analyse te rooskleurig was, staat hier wat er **echt** in de code zit en wat **ontbreekt of kapot** is.

---

## 1. Nieuwe missies / Mission library

### Wat de spec vraagt
- **Mission library (100+):** vaste set missies per domein (Discipline 25, Learning 20, Health 20, Recovery 15, Pressure 10, Alignment Fix 10) met o.a. baseXP, estimatedTime, difficulty, validationType.
- Gebruiker kiest of start een missie uit die library; completion geeft XP volgens die definitie.

### Wat er in de code zit

**Twee losse systemen:**

1. **`tasks` table (waar de UI op draait)**  
   - **Bron:** `app/actions/tasks.ts` — `getTodaysTasks`, `createTask`, `completeTask`.  
   - **Missions-pagina:** toont **tasks** (user-created), niet een library.  
   - **AddMissionModal3** (`components/missions/AddMissionModal3.tsx`): gebruiker vult **vrije titel** in + intent/domain/DNA. Er is **geen** “Kies uit 100+ missies”-stap, geen template-picker, geen vaste `baseXP`/`estimatedTime` uit een library.  
   - **Conclusie:** De “nieuwe missies” (library van 100+ templates) zitten **niet** in de app. Alleen vrije taken met strategische velden.

2. **`missions` table (DCIC)**  
   - **Bron:** `021_dcic_missions.sql`, `app/actions/dcic/game-state.ts`.  
   - `getGameState()` leest `missions` met `user_id`, `limit 20` — dit zijn **per-user mission-rijen**, geen gedeelde library.  
   - Start/complete lopen via `app/actions/dcic/missions.ts` → `behaviour_log`.  
   - **Tasks-pagina** gebruikt **geen** `getGameState()` of DCIC missions; die pagina toont alleen `tasks`.  
   - **Conclusie:** DCIC-missions zijn een apart pad (o.a. assistant); er is **geen** gedeelde mission library van 100+ die op de Missions-pagina wordt gebruikt.

### Status: **NIEUWE MISSIES ONTBREKEN**
- Geen mission library (geen seed, geen template-picker).
- Geen “Focus Sprint 5 min”, “Deep Work 30 min”, etc. als selecteerbare missies.
- Wat wél bestaat: vrije taken (tasks) met domain/intent/DNA; DCIC-missions als apart systeem, niet geïntegreerd met de hoofdpagina Missions.

---

## 2. XP wordt niet over de hele site meegenomen

### 2.1 Waar XP wél wordt bijgewerkt en getoond
- **Bijwerken:** `completeTask` (tasks.ts) roept `awardXPForTaskComplete(domain)` → `app/actions/xp.ts` → `addXP()`. `user_xp.total_xp` wordt geüpdatet.  
- **Tonen:**  
  - **Dashboard:** `getXP()`, `getXPIdentity()`, `XPBadge` (total_xp, level).  
  - **XP-pagina:** `getXPIdentity()`, `getXPForecast()`, progress/range.  
  - **Learning:** `getXP()`, `CommanderXPBar`.  
  - **Settings:** `getXP()`, `XPBadge`.

### 2.2 Waar XP ontbreekt of niet wordt meegenomen
- **Tasks-pagina:** Haalt **geen** `getXP()` of `getXPIdentity()`. Geen XP-badge, geen level, geen “+XP bij voltooien” in de hoofdnavigatie van die pagina.  
- **Strategy-pagina:** Geen `getXP()` in de page; geen XP/level in de header.  
- **Report/Insights-pagina:** Geen XP-badge/level in de layout; insight-engine leest wel `user_xp.total_xp` voor o.a. levelprojectie, maar de **dagelijkse XP voor de grafiek** komt uit `user_analytics_daily.xp_earned` — en die wordt **nergens gezet** (zie sectie 3).  
- **Revalidate:** In `addXP()` staan `revalidatePath` voor dashboard, settings, tasks, learning, xp. **Report en strategy ontbreken.** Na een XP-wijziging kunnen report/strategy dus verouderde XP tonen tot refresh/navigatie.

### Status: **XP NIET CONSISTENT SITEBREED**
- XP wordt wel bij task completion gegeven en op dashboard/xp/learning/settings getoond.
- Ontbreekt: XP (badge/level) op Tasks, Strategy, Report; revalidate voor report/strategy; en de **data voor Insights** (xp_earned) wordt niet gevuld.

---

## 3. Insights-pagina is “miniem” — datapipeline kapot

### 3.1 Wat de Insights-pagina verwacht
- **`app/actions/dcic/insight-engine.ts`:**  
  - `loadDailyMetrics()` leest `user_analytics_daily`: **xp_earned**, **missions_completed**, **energy_avg**, **focus_avg** (naast datum).  
  - `getInsightEngineState()` gebruikt die data voor o.a. `xpLast7`, `xpPrevious7`, `graphData`, momentum, trend, coach.  
  - `getCompletionRateLast7()` leest **behaviour_log** (mission_started_at, mission_completed_at).

### 3.2 Wat er daadwerkelijk wordt weggeschreven
- **`app/actions/analytics.ts` — `upsertDailyAnalytics()`:**  
  - Schrijft alleen: `active_seconds`, **tasks_completed**, **tasks_planned**, `learning_minutes`, `brain_status_logged`, `carry_over_count`.  
  - **Schrijft NIET:** `xp_earned`, `missions_completed`, `energy_avg`, `focus_avg`.  
- Migratie **032_insights_daily_metrics_mission_events.sql** voegt die kolommen toe, maar **geen enkele code path** vult ze in.  
- **Gevolg:** `loadDailyMetrics()` leest voor elke dag `xp_earned = 0` (default). De XP-grafiek blijft vlak, momentum/trend zijn gebaseerd op nul XP, Insights ziet er “leeg/miniem” uit.

### 3.3 Completion rate
- `getCompletionRateLast7()` gebruikt **behaviour_log**.  
- **Task completion** (tasks.ts) schrijft **niet** naar behaviour_log; alleen DCIC `confirmCompleteMission` doet dat.  
- Wel: `logTaskEvent({ taskId, eventType: "complete" })` schrijft naar **task_events**. Die tabel wordt **niet** gebruikt in `getCompletionRateLast7()`.  
- **Gevolg:** Voor gebruikers die alleen via de Tasks-pagina voltooien, is completion rate in Insights 0 of alleen gebaseerd op DCIC-pad.

### Status: **INSIGHTS MINIEM DOOR KAPOTTE DATA**
- UI-blokken (Momentum Hero, Graph, Behavior, Risk, Coach, Heatmap, etc.) bestaan, maar:
  - **xp_earned** (en daarmee XP-grafiek en momentum) wordt nooit gezet → altijd 0.
  - **missions_completed** / **energy_avg** / **focus_avg** idem.
  - Completion rate komt uit behaviour_log, niet uit task_events → voor task-only users altijd leeg/0.
- **Concrete fix:** In `upsertDailyAnalytics()` ook berekenen en schrijven:  
  - `xp_earned` (bijv. afgeleid van voltooide tasks die dag × XP per task, of XP per completion ergens loggen),  
  - `missions_completed` = aantal voltooide tasks die dag,  
  - `energy_avg` / `focus_avg` uit `daily_state` voor die dag.  
  En/of completion rate (deels) uit `task_events` halen.

---

## 4. Mission page modals niet geoptimaliseerd

### 4.1 AddMissionModal3 (Add mission 3.0)
- **Bestand:** `components/missions/AddMissionModal3.tsx`.  
- **Stappen:** 1 Intent, 2 Strategic Mapping, 3 Mission DNA, 4 Live Impact Preview, 5 Campaign Integration, 6 Completion & Commitment.  
- **Wat ontbreekt t.o.v. spec:**  
  - **Step 4 (Live Impact):** Geen “Deadline verschuiving”, geen “Pressure impact”. Alleen: Verwachte XP, Discipline effect, Alignment impact, Energy cost.  
  - **Step 5 (Campaign):** Keuze standalone/chain/new wordt **niet** in DB opgeslagen. `createTask()` kent geen campaign_id of chain; campaign is alleen UI.  
  - Geen veld **geschatte tijdsduur** (estimated time), geen **benodigde items**.  
  - Friction alert (step 6) en similar tasks completion rate zijn wel aanwezig.

### 4.2 TaskDetailsModal (mission detail sheet)
- **Bestand:** `components/missions/TaskDetailsModal.tsx`.  
- Toont: category, domain, due, energy, mental/social load, **strategic preview** (expected XP, alignment, discipline, ROI, pressure, psychology label), notes, subtasks.  
- **Wat ontbreekt t.o.v. spec:**  
  - Geen **expliciete geschatte tijdsduur** (bijv. “~25 min”).  
  - Geen **benodigde items** (required items).  
  - Geen **validation type** (binary/structured/high_stakes) zichtbaar.

### 4.3 CalendarModal3
- **Bestand:** `components/missions/CalendarModal3.tsx`.  
- Heeft: time budget per dag, energy load, overload-indicator, pressure overlay, “Add 5-min mission” voor lege dagen (streak protection), distribution warning.  
- **Mogelijke verbeteringen:** “Strategic distribution view” (% tijd per domein per week) en “Auto-scheduler” (getAutoScheduleSuggestions) zijn deels aanwezig; UX kan strakker (duidelijkere labels, CTA’s).

### Status: **MODALS DEELS GEÏMPLEMENTEERD, NIET OPTIMAAL**
- AddMissionModal3: geen deadline/pressure in Live Impact; campaign niet persistent; geen estimated time/required items.  
- TaskDetailsModal: geen estimated time, geen required items, geen validation type.  
- CalendarModal3: dicht bij spec, kan nog aangescherpt worden.

---

## 5. Overige punten uit de eerdere analyse (bevestigd of aangescherpt)

- **Dashboard:** Geen single “wat moet ik nu doen?”-doel; CTA vast “Start Mission” zonder context (“Voltooi 1 missie voor +120 XP”); mascotte niet status-afhankelijk; geen news/updates-card; CTA niet adaptief bij streak.  
- **Stat rings:** Alleen percentage in de ring; geen absolute waarden, geen low-value (<20%) next steps, geen export voor de rings.  
- **Missions-filters:** All/Work/Personal/Recurring; geen Active/Daily/Recommended/New.  
- **Skill tree:** Geen tooltips (why locked / what to unlock), geen respec.  
- **Streaks:** Geen earnable/purchasable grace-day token; geen re-engagement (email/push) met concrete benefit.  
- **Toasts:** Geen algemeen toast-systeem met undo.  
- **Analytics:** Geen named client events (mission_started, CTA_clicked); completion rate uit verkeerde bron (behaviour_log i.p.v. task_events voor tasks).  
- **Strategy:** Anti-distraction guard (“Dit verlaagt Alignment”) niet bij missie-start buiten primary.

---

## 6. Aanbevolen prioriteiten (gecorrigeerd)

1. **Insights datapipeline repareren (kritiek)**  
   - In `upsertDailyAnalytics()`: `xp_earned`, `missions_completed`, `energy_avg`, `focus_avg` berekenen en meeschrijven.  
   - Bepalen hoe `xp_earned` wordt afgeleid (bijv. per task completion XP loggen of uit bestaande regels afleiden).  
   - Overweeg `getCompletionRateLast7()` (deels) op `task_events` te baseren voor task-completions.

2. **XP sitebreed maken**  
   - XP (badge/level) tonen op Tasks-, Strategy- en Report-pagina.  
   - In `addXP()` (en evt. andere XP-mutaties) `revalidatePath` voor `/report` en `/strategy` toevoegen.

3. **Mission library (nieuwe missies)**  
   - Beslissen: óf een echte library (100+ templates) met seed data en template-picker in AddMissionModal, óf expliciet accepteren dat alleen vrije taken bestaan en de spec daarop aanpassen.  
   - Als library gewenst is: missions/templates tabel of seed, koppeling tasks ↔ template, en UX “Kies missie” in de flow.

4. **Mission modals optimaliseren**  
   - AddMissionModal3: Live Impact uitbreiden met deadline/pressure; campaign/chain persistent maken of uit UI halen; estimated time + optional required items.  
   - TaskDetailsModal: estimated time, required items, evt. validation type tonen.

5. **Dashboard quick wins**  
   - Eén meetbaar doel + CTA met context + adaptief bij streak (zoals in eerdere analyse).

---

*Deze analyse is gebaseerd op daadwerkelijke bestanden: `app/actions/analytics.ts`, `app/actions/tasks.ts`, `app/actions/xp.ts`, `app/actions/dcic/insight-engine.ts`, `app/actions/dcic/game-state.ts`, `components/missions/AddMissionModal3.tsx`, `components/missions/TaskDetailsModal.tsx`, `app/(dashboard)/report/page.tsx`, `app/(dashboard)/tasks/page.tsx`, en migraties 021, 032.*
