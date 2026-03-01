# NEUROHQ — Actieplan: Gedragsarchitectuur (6 lagen)

**Doel:** De volledige gedragsarchitectuur uit de prompt implementeren: Daily Capacity (Brain Circles), Resource & Consequence Engine, Performance & Ranking, Adaptive Difficulty, Decision Cost, Economic Feedback, plus Recovery, Meta-progression en Prime Windows.

**Principe:** Reguleren, niet domineren. Te veel straf → weerstand. Te weinig frictie → betekenisloos.

---

## Huidige stand (wat er al is)

| Onderdeel | In codebase | Opmerking |
|-----------|-------------|-----------|
| **daily_state** | energy, focus, sensory_load, social_load, sleep_hours, emotional_state, mood_note | Geen `mental_battery`, geen aparte `load` (druk). Headroom wordt in app berekend (energy.ts). |
| **Tasks** | energy_required, focus_required, mental_load, social_load, cognitive_load, emotional_resistance, base_xp, mission_intent, psychology_label | Goed uitbreidbaar; ontbreken: expliciete difficulty, socialIntensity als veld (social_load dekt het). |
| **Brain mode** | computeBrainMode(energy, focus, sensory_load, headroom) → tier, slots, risk, addBlocked | sensory_load gebruikt als “load”; design wil Load = opgebouwde druk, Mental Battery = buffer. |
| **XP / streaks** | user_xp, user_streak, xp_events, streak decay (in code) | Geen rank-based XP multiplier (S/A/B/C). |
| **Identity** | user_identity_engine (archetype, evolution_phase), user_gamification (rank_title, momentum) | Design wil Recruit / Operator / Specialist / Commander met mechanische impact. |
| **Behaviour** | behaviour_log (missions), task_events (tasks), user_behavior, behavior_patterns, behavior_profile | Pattern detection bestaat; 7-day performance index en burnout detectie nog niet. |
| **Budget** | budget_entries, budget_targets, payday, last_payday_date | Geen koppeling gedrag ↔ budget (weekly behavior index → +€10 / -€50). |
| **Recovery** | mission_intent = 'recovery' | Geen recovery missions type, rest day bonus, streak shield, burnout reset. |
| **Frictie** | task_events (view/start/complete/abandon), friction_events | Cancel-cost (XP -10%, Load +5) en activatiekosten (Focus -5) nog niet. |

---

## Overzicht fases (uitvoerbare volgorde)

| Fase | Naam | Prioriteit | Kort |
|------|------|------------|------|
| **1** | Daily Capacity Layer (Brain Circles) | P0 | mental_battery, load (druk), effectiveStress, capacity-modifiers in engine |
| **2** | Resource & Consequence Engine | P0 | energyCost/focusRequirement/socialIntensity op taken, failure states, XP-modifiers |
| **3** | Performance Rank (S/A/B/C) + XP multiplier | P1 | Score per voltooiing, rank → +15% / +5% / -10% XP |
| **4** | Daily obligation + Auto Suggestion | P1 | Min 1 missie/dag, 0 completions → Load +10, streak decay, suggesties uit state |
| **5** | Decision Cost & Friction | P1 | Cancel = XP -10% + Load +5; activatie zware missie = Focus -5; te veel actief = Load stijgt |
| **6** | Recovery System | P1 | Recovery missions (Load -20, Energy +15), rest day bonus, burnout detectie |
| **7** | Adaptive Difficulty & Profiling | P2 | 7-day performance index, pattern detection (maandag, high-focus avoidance, social overload) |
| **8** | Meta-progression (Ranks) | P2 | Recruit / Operator / Specialist / Commander met mechanische regels |
| **9** | Prime Windows (time pressure) | P2 | Historisch focuspatroon → prime window; +10% XP, lagere failure binnen window |
| **10** | Economic Feedback (Budget) | P2 | Weekly Behavior Index → +€10 discretionary / -€50 savings; herstelpad “3 S-rank → unlock budget restore” |

---

# Fase 1: Daily Capacity Layer (Brain Circles)

**Doel:** Energy, Focus, Mental Battery als capacity modifiers; Load = opgebouwde druk. effectiveStress = load - (mentalBattery * 0.5). Circles bepalen max missions, XP multiplier, deep work, social risk.

## 1.1 Schema

| # | Actie | Done |
|---|--------|------|
| 1.1.1 | Migratie: `daily_state` uitbreiden met `mental_battery` (smallint 1–10), `load` (smallint 0–100 of 1–10) als opgebouwde druk. Optioneel: `load` per dag resetten of cumulatief — start met “per dag” (ochtend reset). | ☐ |
| 1.1.2 | Documenteer: Energy = output-capaciteit, Focus = cognitieve kwaliteit, Mental Battery = sociale/emotionele tolerantie, Load = druk (objectief). | ☐ |

## 1.2 Engine (lib + actions)

| # | Actie | Done |
|---|--------|------|
| 1.2.1 | Berekening: `effectiveStress = load - (mentalBattery * 0.5)` (schaal afstemmen: bv. load 0–100, mentalBattery 1–10 → factor 5). | ☐ |
| 1.2.2 | Bij hoge effectiveStress: failure chance ↑, XP multiplier ↓, “Suggest recovery” in suggesties. | ☐ |
| 1.2.3 | Energy → max missions per dag, energy drain rate, heavy missions beschikbaarheid (sluiten aan op bestaande `getHeadroomTier` / `allowHeavyNow`). | ☐ |
| 1.2.4 | Focus → XP multiplier, S-rank haalbaarheid, deep work recommendation (in suggestie-engine). | ☐ |
| 1.2.5 | Mental Battery → social mission risk, failure chance bij interactietaken, leadership bonus (waar van toepassing). | ☐ |

## 1.3 UI

| # | Actie | Done |
|---|--------|------|
| 1.3.1 | Ochtend-check-in: Energy, Focus, Mental Battery (en evt. Load als read-only “opgebouwde druk” of later invulbaar). | ☐ |
| 1.3.2 | Brain-status / dashboard: toon capacity-modifiers en effect (max missies, tier, risk, recovery-suggestie). | ☐ |

---

# Fase 2: Resource & Consequence Engine

**Doel:** Elke missie/taak heeft energyCost, focusRequirement, socialIntensity, difficulty. Failure states: Energy=0, Load>80, 5 dagen niets → duidelijke consequenties (geen schuld, wel frictie).

## 2.1 Schema / task-model

| # | Actie | Done |
|---|--------|------|
| 2.1.1 | Tasks: zorg dat energy_required, focus_required, mental_load, social_load overal gebruikt worden als energyCost, focusRequirement, (mental) load, socialIntensity. Voeg evt. `difficulty` (0.1–1) toe indien nog niet overal aanwezig. | ✅ |
| 2.1.2 | Missions (DCIC): zelfde velden / mapping zodat engine één model gebruikt. | ✅ |

## 2.2 Failure states (engine)

| # | Actie | Done |
|---|--------|------|
| 2.2.1 | Energy = 0 (of onder drempel): XP multiplier -20%, next mission cost +15%. | ✅ |
| 2.2.2 | Load > 80: failure chance 25–40%, alleen recovery missions unlocked. | ✅ |
| 2.2.3 | 5 dagen niets: streak decay, weekly performance penalty, recovery protocol active. | ✅ |

## 2.3 Consequenties in UI

| # | Actie | Done |
|---|--------|------|
| 2.3.1 | Toon bij hoge load / lage energy (ConsequenceBanner) duidelijke maar neutrale boodschap (geen schuld): bv. “Alleen recovery-missies beschikbaar” of “Volgende missie kost 15% meer.” | ✅ |

---

# Fase 3: Performance Rank (S / A / B / C) + XP multiplier

**Doel:** Score per voltooiing op tijd-efficiëntie, energy-efficiëntie, focus-stabiliteit, consistentie. Rank → XP modifier.

## 3.1 Berekening

| # | Actie | Done |
|---|--------|------|
| 3.1.1 | Definieer scoreformule (0–100): tijd-efficiëntie, energy-efficiëntie, focus-stabiliteit, consistentie (gewicht bv. 25% elk of aangepast). | ✅ |
| 3.1.2 | Mapping: S ≥ 90 → +15% XP, A ≥ 75 → +5% XP, B ≥ 60 → neutraal, C < 60 → -10% XP. | ✅ |
| 3.1.3 | Bij voltooiing: bereken score, sla rank op (task_events of behaviour_log uitbreiden met performance_rank / performance_score). | ✅ |
| 3.1.4 | XP-award: base_xp * (1 + rankMultiplier) toepassen in bestaande XP-flow. | ✅ |

## 3.2 Schema

| # | Actie | Done |
|---|--------|------|
| 3.2.1 | task_events / behaviour_log: kolom `performance_score` (smallint 0–100) en `performance_rank` (text: S/A/B/C). | ✅ |

## 3.3 UI

| # | Actie | Done |
|---|--------|------|
| 3.3.1 | Toon rank (S/A/B/C) na voltooiing en in geschiedenis/rapporten. | ✅ |

---

# Fase 4: Daily obligation + Auto Suggestion

**Doel:** Minimum 1 missie per dag. 0 completions → Load +10, next day energy -10%, streak decay. Systeem altijd actief: suggesties op basis van Energy, Focus, Mental Battery, dag van week, historisch gedrag.

## 4.1 Rules

| # | Actie | Done |
|---|--------|------|
| 4.1.1 | Minimum daily impact = 1 missie (nagaan of dit “minimaal 1 voltooiing” is of “minimaal 1 actieve/geplande”; doc: “1 missie” → voltooiing). | ☐ |
| 4.1.2 | 0 completions op een dag: Load +10 (volgende dag), next day energy -10%, streak decay multiplier toepassen. | ✅ |
| 4.1.3 | Auto-suggest mode: als geen actieve missie, toon suggesties gebaseerd op capacity + dag + historiek. | ✅ |

## 4.2 Integratie

| # | Actie | Done |
|---|--------|------|
| 4.2.1 | Rollover / end-of-day job: schrijf “0 completions”-consequenties (load bump, energy penalty, streak). | ✅ |
| 4.2.2 | Dashboard / “Wat nu?”: suggestie-engine die getTodayEngine + capacity + patterns gebruikt voor 1–3 concrete suggesties. | ☐ |

---

# Fase 5: Decision Cost & Friction

**Doel:** Activatie zware missie kost Focus -5. Cancel missie kost XP -10% + Load +5. Te veel actieve missies → Load stijgt passief. Minimalisme beloond, impulsiviteit krijgt frictie.

## 5.1 Regels

| # | Actie | Done |
|---|--------|------|
| 5.1.1 | Bij start zware missie: trek 5 focus af van dagelijkse focus/capacity (of equivalent in je model). | ✅ |
| 5.1.2 | Bij cancel (abandon) missie: XP -10% (van die missie of dagtotaal), Load +5. | ✅ |
| 5.1.3 | Te veel actieve missies (bijv. > focusSlots): passieve Load-stijging per extra missie (formule vastleggen). | ✅ |

## 5.2 Schema / events

| # | Actie | Done |
|---|--------|------|
| 5.2.1 | task_events: event_type 'abandon' al aanwezig; koppel aan cancel-cost (XP, Load) in engine. | ✅ |
| 5.2.2 | daily_state of aparte “consumed” pool: bij start zware missie focus -5 bijwerken. | ✅ |

## 5.3 UI

| # | Actie | Done |
|---|--------|------|
| 5.3.1 | Bij cancel: bevestiging met tekst over gevolg (XP -10%, Load +5). | ✅ |
| 5.3.2 | Bij te veel actieve missies: waarschuwing dat Load stijgt. | ✅ |

---

# Fase 6: Recovery System

**Doel:** Recovery missions (Load -20, Energy +15, lage XP). Rest day bonus (1 rustdag per 7 dagen → streak shield). Burnout detectie (3 dagen lage energy + gemiste missies → difficulty reset, social beperken).

## 6.1 Recovery missions

| # | Actie | Done |
|---|--------|------|
| 6.1.1 | Mission type of label “recovery”: bij voltooiing Load -20, Energy +15 (volgende dag of direct in daily_state), lage XP. | ✅ |
| 6.1.2 | Alleen recovery unlocken wanneer Load > 80 of failure state (zie Fase 2). | ✅ |
| 6.1.3 | Templates: 3–5 recovery-missies in master pool (lichte, stabiliserende taken). | ✅ |

## 6.2 Rest day & burnout

| # | Actie | Done |
|---|--------|------|
| 6.2.1 | Rest day: 1 geplande rustdag per 7 dagen → streak shield (geen streak decay die dag). | ✅ |
| 6.2.2 | Burnout detectie: 3 dagen lage energy + gemiste missies → difficulty reset, social missions beperken, toon recovery-first. | ✅ |
| 6.2.3 | Schema: evt. user_preferences of behavior: rest_days_per_week (default 1), last_rest_day. | ✅ |

---

# Fase 7: Adaptive Difficulty & Behavior Profiling

**Doel:** 7-day Performance Index (completion rate, gem. rank, consistentie). High performance → difficulty +10%, reward +10%. Low → difficulty -10%, recovery emphasis. Pattern detection: maandag-vermijding, high-focus avoidance, social overload, cancels > threshold.

## 7.1 7-day index

| # | Actie | Done |
|---|--------|------|
| 7.1.1 | Berekening: completion rate, gemiddelde rank (S=4, A=3, B=2, C=1), consistentie (dagen met ≥1 voltooiing). | ☑ |
| 7.1.2 | High index → difficulty +10%, reward +10%. Low index → difficulty -10%, recovery emphasis in suggesties. | ☑ |
| 7.1.3 | Opslaan: wekelijkse snapshot (bijv. in weekly_reports of user_analytics_daily geaggregeerd). | ☑ |

## 7.2 Pattern detection

| # | Actie | Done |
|---|--------|------|
| 7.2.1 | Detectie: maandag vermijding, high-focus avoidance, social overload trends, cancels > drempel. | ☑ |
| 7.2.2 | Interventie: bonus XP tijdelijk, difficulty verlagen, mission type herstructureren (in suggestie-engine). | ☑ |
| 7.2.3 | Hergebruik behavior_patterns + behaviour_log / task_events; uitbreiden pattern_type indien nodig. | ☑ |

---

# Fase 8: Meta-progression (Ranks: Recruit → Commander)

**Doel:** Recruit (lage penalties, lage variance), Operator (strengere energy impact, XP afhankelijk van rank), Specialist (risk/reward, advanced missions), Commander (delegation, budget impact unlock). Rank = identiteit met regels.

## 8.1 Definitie

| # | Actie | Done |
|---|--------|------|
| 8.1.1 | Map Recruit / Operator / Specialist / Commander naar bestaande identity (evolution_phase of nieuwe rank-ladder). | ☑ |
| 8.1.2 | Per rank: regels voor penalties, variance, energy impact, XP, risk/reward, delegation, budget. | ☑ |

## 8.2 Schema

| # | Actie | Done |
|---|--------|------|
| 8.2.1 | user_gamification of user_identity_engine: rank = 'recruit' | 'operator' | 'specialist' | 'commander'. | ☑ |
| 8.2.2 | Unlock criteria voor volgende rank (XP, streak, completion rate, etc.). | ☑ |

## 8.3 Engine & UI

| # | Actie | Done |
|---|--------|------|
| 8.3.1 | Engine leest rank en past mechanica toe (penalties, energy, XP, delegation, budget). | ☑ |
| 8.3.2 | UI toont huidige rank en progressie naar volgende. | ☑ |

---

# Fase 9: Prime Windows (time pressure)

**Doel:** Prime window = historisch beste focus-tijd. Binnen window: +10% XP, lagere failure chance. Buiten: hogere energy drain.

## 9.1 Berekening

| # | Actie | Done |
|---|--------|------|
| 9.1.1 | Uit task_events / behaviour_log: gemiddelde starttijd of piek-voltooiingstijd per gebruiker → prime window (bijv. 2 uur breed). | ☑ |
| 9.1.2 | Binnen window: +10% XP, lagere failure chance (in failure-formule). Buiten: energy drain multiplier > 1. | ☑ |

## 9.2 UI

| # | Actie | Done |
|---|--------|------|
| 9.2.1 | Toon “Prime window: 10:00–12:00” op dashboard of bij missie-start. | ☑ |

---

# Fase 10: Economic Feedback (Budget)

**Doel:** Weekly Behavior Index (completion rate, performance rank, budget discipline). Hoog → +€10 discretionary. Laag → -€50 auto-transfer naar savings. Herstelpad: “Complete 3 S-rank missions to unlock budget restore.”

## 10.1 Index

| # | Actie | Done |
|---|--------|------|
| 10.1.1 | Weekly Behavior Index: completion rate + gem. rank + budget discipline (bv. binnen budget gebleven). | ☑ |
| 10.1.2 | Drempels: index hoog → +€10 discretionary (budget_entries of aparte “discretionary” pot). Index laag → -€50 naar savings (auto-transfer of vlag). | ☑ |
| 10.1.3 | Herstel: “Complete 3 S-rank missions to unlock budget restore” (ontgrendel terugdraaien of extra kans). | ☑ |

## 10.2 Schema

| # | Actie | Done |
|---|--------|------|
| 10.2.1 | Koppel budget_entries / budget_targets aan wekelijkse job; evt. weekly_budget_adjustment of behavior_index in users/weekly_reports. | ☑ |
| 10.2.2 | RLS en rechten: alleen systeem/backend mag auto-transfers schrijven; gebruiker ziet resultaat. | ☑ |

## 10.3 UI

| # | Actie | Done |
|---|--------|------|
| 10.3.1 | Toon wekelijkse uitkomst: “+€10 discretionary” of “-€50 naar savings” + herstelpad-indicator. | ☑ |

---

# Flow-overzicht (volledige dag)

- **Ochtend:** User zet Energy / Focus / Mental Battery (Fase 1). Systeem berekent capacity, daily target, suggesties (Fase 4).
- **Dag:** User kiest missie → energy drain, Load impact, performance rank, XP (Fase 2, 3), decision cost bij cancel/activatie (Fase 5), recovery beschikbaar bij hoge load (Fase 6).
- **Avond:** Failure checks, recovery aanbeveling, next-day modifiers (Fase 2, 4, 6).
- **Week:** Performance index (Fase 7), budget adjustment (Fase 10), rank evaluation (Fase 8).

---

# Volgorde van uitvoering (aanbevolen)

1. **Fase 1** (Daily Capacity) — basis voor alle andere lagen.
2. **Fase 2** (Resource & Consequence) — failure states en kosten.
3. **Fase 3** (Performance Rank) — nodig voor XP-modifiers en later budget/index.
4. **Fase 5** (Decision Cost) — kleine, duidelijke regels.
5. **Fase 6** (Recovery) — voorkomt crash bij hoge load.
6. **Fase 4** (Auto Suggestion + daily obligation) — maakt het systeem actief.
7. **Fase 7** (Adaptive Difficulty) — verbetert suggesties en difficulty.
8. **Fase 8** (Meta-progression) — rank-mechanica.
9. **Fase 9** (Prime Windows) — tijdspressure.
10. **Fase 10** (Economic Feedback) — budget-koppeling.

---

# Documentatie- en testchecklist

- [ ] DATA_SUPABASE_VS_APP.md bijwerken met nieuwe tabellen/velden (daily_state.load, mental_battery; task_events.performance_rank; weekly behavior index; recovery missions).
- [ ] Unit/logic tests voor effectiveStress, rank-formule, failure states, decision costs.
- [ ] E2E of handmatige flow: ochtend check-in → suggestie → voltooiing → rank → avond-modifiers → week budget.

Dit actieplan is klaar om fase voor fase uitgevoerd te worden. Start met Fase 1 (schema + engine + UI voor Brain Circles).
