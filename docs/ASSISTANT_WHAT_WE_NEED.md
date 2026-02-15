# Wat we nog nodig hebben voor een goede AI-assistant (NEUROHQ)

**Doel**: Eén overzicht van wat er al is en wat er nog moet komen om de NEUROHQ AI-assistant te laten werken volgens het gemapte concept (logica, chatbox, brein).

**Bronnen**: NEUROHQ_AI_LOGIC_100_PERCENT_ANALYSIS.md, NEUROHQ_ASSISTANT_DETAILED_PLAN.md, ASSISTANT_BRAIN_BEHAVIOR_MAP.md, bestaande codebase.

---

## Samenvatting

| Categorie | Status | Wat nog moet |
|-----------|--------|--------------|
| **Documentatie** | ✅ Klaar | — |
| **Data / schema** | ⚠️ Deels | Aggregated state, escalation_logs, identity_events, assistant feature flags, optioneel assistant_messages |
| **Formules / engines** | ❌ Ontbreekt | Avoidance trend, IAS, stability index, courage gap, defensive identity, crisis guard, escalation engine |
| **Backend API** | ❌ Ontbreekt | State aggregator, prompt builder, POST /api/assistant/message, OpenAI (of andere provider), rate limiting, optioneel identity-choice endpoint |
| **Frontend** | ❌ Ontbreekt | Route /assistant, chat UI (berichten, input, loading, fout), nav-item, copy |
| **Operatie** | ⚠️ Deels | Logging/monitoring voor escalation en overrides (kan later) |

---

## 1. Wat we al hebben

### 1.1 Documentatie (compleet)

- **NEUROHQ_AI_LOGIC_100_PERCENT_ANALYSIS.md** – Regels, thresholds, flow, nooit/altijd, API-contract.
- **NEUROHQ_ASSISTANT_DETAILED_PLAN.md** – Chatbox layout, UI-states, copy, technische integratie, flows, edge cases, appendix prompt.
- **ASSISTANT_BRAIN_BEHAVIOR_MAP.md** – Situatie→gedrag, wat zeggen/vragen, templates, nooit zeggen, defensive identity/courage.

### 1.2 Data (bestaande tabellen)

- **daily_state** – energy, focus, sensory_load, sleep_hours, social_load, mood_note (per dag).
- **tasks** – title, due_date, completed, completed_at, carry_over_count, energy_required, priority, strategy_key_result_id.
- **user_analytics_daily** – tasks_completed, tasks_planned, carry_over_count, learning_minutes, brain_status_logged (per dag).
- **quarterly_strategy** – identity_statement, primary_theme, secondary_theme, key_results, savings_goal_id, etc.
- **learning_sessions** – minutes, date, topic (strategy_quarter, strategy_year).
- **calendar_events** – duration_hours, is_social (voor energy budget).
- **users**, **user_preferences**, **feature_flags** (generiek: name, enabled, user_id).

### 1.3 Server actions (bestaand)

- **daily-state**: getDailyState, saveDailyState.
- **tasks**: CRUD, rollover (carry_over_count).
- **analytics**: getWeekSummary, upsertDailyAnalytics.
- **adaptive**: getMode, getAdaptiveSuggestions (theme/emotion/task count op basis van mode; geen escalation).
- **strategy**: getQuarterlyStrategy, upsertQuarterlyStrategy.
- **mode**: getMode (o.a. low_energy, driven, stabilize).

---

## 2. Data / schema – Wat nog moet

### 2.1 Aggregated state voor de engine

De escalation engine heeft één **state-object** per user met o.a.:

- **energy**, **focus**, **sensory_load**, **sleep_hours** (laatste of gemiddelde uit daily_state).
- **carry_over_level** of **carry_over_cycles** (uit tasks / rollover).
- **avoidance_trend** (float 0–1) – moet berekend worden uit gedrag (zie sectie 4).
- **identity_alignment_score** (float 0–100) – moet berekend worden (zie sectie 4).
- **stability_index** (float) – moet berekend worden (zie sectie 4).
- **courage_gap_score** (float 0–1) – moet berekend worden (zie sectie 4).
- **defensive_identity_probability** (float 0–1) – optioneel, voor defensive-identity-protocol.
- **days_active** (int) – aantal dagen met check-in of activiteit (voor dual escalation: 30+).
- **crisis** (boolean) – of crisis guard actief is (afgeleid of apart veld).

**Keuze**:

- **A. Geen aparte tabel**: state bij elke request **berekenen** uit daily_state, tasks, user_analytics_daily, quarterly_strategy, learning_sessions (en eventueel escalation_logs voor stability).  
- **B. Tabel `user_state`**: periodiek (bijv. na check-in of cron) bijwerken met bovenstaande velden; engine leest deze tabel. Sneller, maar formules moeten ergens draaien.

**Aanbeveling voor MVP**: **A** (berekenen bij request) zodat je geen extra cron of triggers nodig hebt; later kan naar B als performance het vereist.

### 2.2 Escalation logs (verplicht)

Tabel **escalation_logs**:

- **id** (uuid, PK).
- **user_id** (uuid, FK users).
- **tier** (smallint: 1, 2, 3).
- **trigger_type** (text, bijv. avoidance, identity_drift, energy_mismatch).
- **evidence_snapshot** (jsonb) – state-snapshot op moment van escalation (voor analyse en debugging).
- **created_at** (timestamptz).

RLS: auth.uid() = user_id. Insert only (immutable); geen update/delete voor users.

**Migratie**: nieuwe file, bijv. `021_assistant_escalation_identity.sql`.

### 2.3 Identity events (verplicht)

Tabel **identity_events**:

- **id** (uuid, PK).
- **user_id** (uuid, FK users).
- **type** (text: 'soft' | 'forced' | 'override').
- **reason** (text, optioneel).
- **created_at** (timestamptz).

Voor override/reconfirm/redefine; altijd loggen. RLS: auth.uid() = user_id.

### 2.4 Assistant feature flags

De engine heeft per-user flags: **confrontation_level**, **identity_intervention**, **defensive_identity_detection**, **courage_attribution**, **energy_fact_check**.

**Keuze**:

- **A. Uitbreiden feature_flags**: bestaande tabel heeft (name, enabled, user_id). Nieuwe names: e.g. `assistant_confrontation_level` (waarde in metadata of aparte kolom), `assistant_identity_intervention`, …  
- **B. Nieuwe tabel `assistant_feature_flags`**: user_id (PK), confrontation_level (text, default 'adaptive'), identity_intervention (bool), defensive_identity_detection (bool), courage_attribution (bool), energy_fact_check (bool, default true), updated_at.

**Aanbeveling**: **B** voor duidelijke defaults en eenvoudige lees per user; of A als je alles in één feature_flags-systeem wilt houden.

### 2.5 Assistant messages (optioneel, voor persistentie)

Tabel **assistant_messages** (optioneel, voor gespreksgeschiedenis):

- **id** (uuid, PK).
- **user_id** (uuid, FK users).
- **role** ('user' | 'assistant').
- **content** (text).
- **escalation_tier** (smallint, null voor user).
- **identity_alert** (boolean, null voor user).
- **courage_flag** (boolean, null voor user).
- **created_at** (timestamptz).

RLS: auth.uid() = user_id. Index (user_id, created_at) voor ophalen laatste N berichten.

Zonder deze tabel: gesprek alleen in client state (bij refresh leeg). Met deze tabel: bij openen /assistant laatste N berichten laden.

---

## 3. Formules / engines – Wat nog moet

Alle formules moeten **deterministisch** zijn (geen AI); input = bestaande data, output = getallen of decision object.

### 3.1 Avoidance trend (0–1)

**Input**: o.a. carry_over_count per task over tijd, tasks completed vs. planned (user_analytics_daily), eventueel override usage (identity_events type 'override').

**Idee**: Hoe meer carry-over en hoe lager completion rate, hoe hoger avoidance_trend. Exacte formule staat niet in de docs; voor MVP: bijv. gewogen gemiddelde van (1 - completion_rate) over laatste 14 of 30 dagen, of op basis van carry_over_cycles (3+ cycles → verhogen).

**Plaats**: Pure functie in bijv. `lib/assistant/avoidance.ts` of `app/actions/assistant/engine.ts`.

### 3.2 Identity Alignment Score (IAS, 0–100)

**Input**: % tijd op primary focus (tasks gekoppeld aan strategy/key result vs. totaal), learning compliance (learning_sessions vs. target), financial adherence (budget/savings), avoidance patterns.

**Idee**: Hoger wanneer gedrag overeenkomt met identity_statement en primary_theme. Exacte formule in docs niet gegeven; voor MVP: simpele score op basis van bv. task alignment + learning minutes vs. target.

**Plaats**: Pure functie, bijv. `lib/assistant/identity-alignment.ts`.

### 3.3 Stability index

**Input**: Check-in consistency (dagen met daily_state), response to confrontation (lastig zonder explicite data; kan later), override abuse (aantal identity_events type override per periode), volatility (bijv. variantie in energy), emotional reactivity (optioneel, uit mood_note of niet).

**Idee**: Hoger = consistenter, minder override abuse. Escalation unlock: stability > 70 en 30+ dagen actief.

**Plaats**: Pure functie, bijv. `lib/assistant/stability.ts`.

### 3.4 Courage gap score (0–1)

**Input**: Evaluation exposure level (welke taken feedback/exposure geven), risk reduction behavior, exposure avoidance (welke taken worden overgedragen die exposure hadden).

**Idee**: Hoger = meer vermijding van evaluatieve blootstelling. courageFlag = courage_gap_score > 0.7. Alleen gebruiken als energy >= 6, capacity, geen overload.

**Plaats**: Pure functie, bijv. `lib/assistant/courage.ts`. Voor MVP kan een vereenvoudigde proxy (bijv. op basis van task types of carry-over van “exposure”-taken) volstaan.

### 3.5 Defensive identity probability (0–1)

**Input**: 21+ dagen data, identity shift follows failure (wijziging identity_statement na periode met lage resultaten), risk reduction measurable, exposure decrease.

**Idee**: Alleen als probability > 0.7 en feature flag aan mag de assistant “Je huidige identiteit oogt defensief” zeggen + data + keuze.

**Plaats**: Pure functie; kan in MVP op 0 gezet worden of simpel houden (bijv. alleen als identity_statement recent gewijzigd na slechte week).

### 3.6 Crisis guard

**Input**: Lage energie + veel gemiste taken, of expliciete “crisis”-marker (bijv. uit user_preferences of apart veld). Geen harde definitie in docs.

**Idee**: Als crisis: tier dwingen naar 1, geen confrontatie, geen courage attribution.

**Plaats**: Eerste stap in de engine: if (crisis) return { tier: 1, identityAlert: false, courageFlag: false } en in prompt “crisis: respond supportively only”.

### 3.7 Escalation engine (kern)

**Input**: Aggregated state (energy, avoidance_trend, identity_alignment_score, stability_index, courage_gap_score, days_active, crisis), dual gate (30+ dagen, stability > 70).

**Logica** (zoals in 100% analyse):

- tier = 1 (default).
- If crisis → tier = 1, identityAlert = false, courageFlag = false.
- If !crisis && avoidance_trend > 0.6 && energy >= 6 → tier = 2.
- If !crisis && avoidance_trend > 0.8 && identity_alignment_score < 40 && energy >= 6 → tier = 3.
- Dual gate: als days_active < 30 of stability_index <= 70 → max tier = 1 (of tier niet hoger dan 1).
- identityAlert = (identity_alignment_score < 50).
- courageFlag = (courage_gap_score > 0.7); en alleen als energy >= 6 en geen overload in prompt meenemen.

**Output**: `{ tier, identityAlert, courageFlag }` (+ eventueel triggerType voor logging).

**Plaats**: Eén bestand, bijv. `lib/assistant/escalation-engine.ts`, pure functie `evaluate(state): Decision`.

---

## 4. Backend API – Wat nog moet

### 4.1 State aggregator

**Functie**: Haal op: laatste/gemiddelde daily_state, recente tasks, user_analytics_daily (laatste 7–30 dagen), quarterly_strategy (huidige), learning_sessions, calendar_events (vandaag/week), identity_events (override count). Bereken: avoidance_trend, IAS, stability_index, courage_gap_score, defensive_identity_probability, days_active, crisis. Return één **EngineState**-object.

**Plaats**: Server action of interne functie in de API-route, bijv. `app/actions/assistant/get-engine-state.ts` of in `app/api/assistant/route.ts`.

### 4.2 Prompt builder

**Functie**: Input: engine state, decision object (tier, identityAlert, courageFlag), userMessage, feature flags. Bouw:

- **System prompt**: Vaste tekst uit ASSISTANT_BRAIN_BEHAVIOR_MAP + NEUROHQ_ASSISTANT_DETAILED_PLAN appendix; + instructies voor tier (1: adaptive, 2: corrective + confrontation protocol, 3: hard); + crisis-indicator als crisis; + “identityAlert/courageFlag: only use if criteria and flags allow”.
- **User prompt**: userMessage + optioneel korte state-samenvatting (energie, avoidance, IAS, etc.).
- **Inclusief in system prompt**: gesprek (check-in: hoe gaat het, hoe voel je je qua energie), suggesties (wat te doen), boeken voorstellen, reflectieve vragen (uitgaven, uitstel); zie ASSISTANT_BRAIN_BEHAVIOR_MAP sectie 12.

**Plaats**: `lib/assistant/prompt-builder.ts` of `app/actions/assistant/prompt-builder.ts`.

### 4.3 AI-provider (OpenAI of andere)

**Functie**: Aanroep van model (bijv. GPT-4 of GPT-4o) met system + user messages; stream optioneel. API key alleen server-side (env OPENAI_API_KEY of vergelijkbaar).

**Plaats**: `app/api/assistant/route.ts` of aparte `lib/assistant/ai-client.ts`.

### 4.4 POST /api/assistant/message

**Flow**:

1. Auth: alleen ingelogde user.
2. Body: `{ message: string }`. Valideer (niet leeg, max length).
3. Rate limit: bijv. X requests per minuut per user (bijv. 10).
4. State aggregator → engine state.
5. Crisis guard (als crisis → tier 1, flags uit).
6. Escalation engine → decision.
7. Prompt builder → system + user prompt.
8. AI aanroep → response tekst.
9. Als tier > 1: insert escalation_logs (tier, trigger_type, evidence_snapshot).
10. Optioneel: insert assistant_messages (user + assistant).
11. Return `{ response, escalationTier, identityAlert, courageFlag }`.

**Plaats**: `app/api/assistant/message/route.ts` (of `app/api/assistant/route.ts` met POST).

### 4.5 POST /api/assistant/identity-choice (optioneel)

**Body**: `{ choice: 'reconfirm' | 'redefine' | 'override' }`. Insert identity_events; bij redefine eventueel redirect-URL of frontend handelt navigatie naar strategy/settings. Rate limit en auth.

---

## 5. Frontend – Wat nog moet

### 5.1 Route en pagina

- **Route**: `app/(dashboard)/assistant/page.tsx`.
- **Layout**: Zelfde als andere dashboard-pagina’s (layout met bottom nav, max-width, theming).
- **Inhoud**: Header “Assistant”, message list (scroll), input area (tekstveld + verstuur). State: lijst van berichten (user + assistant) met per assistant-bericht metadata (escalationTier, identityAlert, courageFlag).

### 5.2 Chat-componenten

- **Message list**: Map over berichten; user bubble rechts, assistant bubble links; optioneel tier-label onder assistant (Tier 2: “Patroon”, Tier 3: “Direct”).
- **Input**: Textarea of input, placeholder “Bericht aan assistant…”, max-length optioneel; verstuurknop (disabled bij leeg of tijdens laden).
- **Loading**: Onder laatste user-bericht “Analyseren…” of drie puntjes.
- **Error**: Banner of inline “Het antwoord kon niet worden geladen. Probeer het opnieuw.”
- **Rate limit**: “Je hebt te veel berichten verstuurd. Wacht even en probeer het opnieuw.” + disable invoer tijdelijk.
- **Lege staat**: Korte welkomsttekst (zie Detailed Plan sectie 8).

### 5.3 Identity-keuze (als forced intervention)

Onder het betreffende assistant-bericht: drie knoppen “Bevestig identiteit”, “Herschrijf identiteit”, “7 dagen override”. Bij klik: call naar POST /api/assistant/identity-choice (of server action), daarna knoppen verbergen of bevestiging tonen.

### 5.4 Navigatie

- **Bottom nav**: Nieuw item “Assistant” (of “Chat”) met icoon, link naar `/assistant`. Aanpassen in `components/DashboardNav.tsx` (of waar BottomNav gedefinieerd is).

### 5.5 Copy

Alle teksten uit Detailed Plan sectie 8 (placeholder, lege staat, loading, fout, rate limit, tier-labels, identity-knoppen) in NL (of EN) in de componenten of een copy-file.

### 5.6 Toegankelijkheid

Focus op invoer bij openen; aria-live voor loading en nieuw antwoord; Enter = verstuur, Shift+Enter = nieuwe regel; semantische HTML (header, form, list/log).

---

## 6. Volgorde van bouwen (aanbevolen)

1. **Schema**: Migratie 021 – escalation_logs, identity_events, (optioneel) assistant_feature_flags, (optioneel) assistant_messages.
2. **State aggregator**: Functie die uit bestaande tabellen één EngineState bouwt; voor avoidance/IAS/stability/courage eerst **vereenvoudigde** formules (bijv. avoidance = f(carry_over, completion rate), IAS = simpele alignment score, stability = f(check-in consistency, override count), courage = 0 of simpele proxy).
3. **Escalation engine**: Pure functie evaluate(state) + crisis guard; unit test met mock state.
4. **Prompt builder**: System + user prompt uit docs; tier en flags meegeven.
5. **API route**: POST /api/assistant/message met auth, rate limit, state → engine → prompt → AI → log → return.
6. **Frontend**: /assistant-pagina, message list, input, send, loading, error; geen persistentie eerst.
7. **Nav**: Assistant-item in bottom nav.
8. **Optioneel**: assistant_messages tabel + ophalen bij laden; identity-choice endpoint + drie knoppen; verfijning formules (IAS, stability, courage, defensive identity).

---

## 7. Checklist – “We hebben een goede AI-assistant als…”

- [ ] Documentatie wordt gevolgd (logica, plan, brein).
- [ ] Engine state wordt berekend uit bestaande data (of user_state tabel).
- [ ] Escalation engine is deterministisch en getest (thresholds, dual gate, crisis).
- [ ] Escalation_logs en identity_events bestaan en worden gevuld waar nodig.
- [ ] Prompt builder geeft system + user prompt met tier en flags door.
- [ ] AI wordt alleen server-side aangeroepen; geen key in frontend.
- [ ] POST /api/assistant/message is beveiligd (auth, rate limit) en retourneert response + escalationTier + identityAlert + courageFlag.
- [ ] Chat UI toont berichten, loading, fout, rate limit; optioneel tier-labels en identity-knoppen.
- [ ] Copy en tone kloppen met Brain Behavior Map (geen shaming, wel evidence en structured correction).
- [ ] Gesprek, suggesties, boeken en reflectieve vragen zijn in de prompt opgenomen (check-in, wat te doen, boeken, vragen over uitgaven/uitstel); zie Brain Behavior Map sectie 12.
- [ ] Crisis en lage energie onderdrukken escalation en courage; geen confrontatie zonder data.

Als dit allemaal staat, heb je een goede basis voor een werkende, veilige en evidence-based AI-assistant binnen NEUROHQ.
