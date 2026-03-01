# NEUROHQ — Actieplan: Gevaarlijke modules (strak, systemisch)

**Doel:** De 10 gekozen modules implementeren: data-driven identity, cognitive load forecast, weekly mode, chaos missions, social layer, scarcity, autopilot, focus investment, regret, real-life anchor. Geen fluff. Frictie zonder schaamte, regulatie zonder dominantie.

**Principes:** Identiteit = mechanisch effect, geen permanente stempel. Forecast = adviserend, niet dramatisch. Autopilot = stabilisatie, geen straf. Max-caps overal (chaos 2/week, scarcity 1/dag, investment 1/dag) om stressmachine te voorkomen.

---

## Huidige stand

| Module | Status | Opmerking |
|--------|--------|-----------|
| **Identity** | Deels | Archetype user-chosen (lib/identity-engine); reputation uit gedrag. Geen data-driven drift (completion type, cancel ratio, social/solo, push/recovery) → geen dynamische types (Volatile Sprinter, etc.) met modifiers. |
| **Cognitive Load Forecast** | Nee | Geen overloadRisk-formule; geen “recovery week / difficulty -10%” bij >60%. |
| **Weekly Tactical Mode** | Nee | WeeklyTacticalCard = budget (allowance). Geen Stability/Push/Recovery/Expansion week voor XP/penalties/suggesties. |
| **Controlled Chaos** | Nee | Geen random high-reward mission, max 2/week. |
| **Social Simulation** | Deels | mental_battery + load in engine; social risk in actieplan. Geen social intensity score per missie, geen XP bonus/drain/solo bonus uit battery. |
| **Scarcity Windows** | Nee | Prime Windows = beste focus-tijd, niet “beschikbaar 24h, gemist = weg”, max 1/dag. |
| **Autopilot** | Nee | Geen refusal count, geen force na 3x/30d. |
| **Cognitive Investment** | Nee | Geen “invest focus voor start → +XP / dubbel verlies bij fail”, max 1/dag. |
| **Regret** | Nee | Geen Missed Opportunity Index, geen “3 completionszelfde type reset”. |
| **Real-Life Anchor** | Deels | Fase 10: behavior index → discretionary/savings. Geen expliciete discretionary cap, growth unlocks, savings transfer als aparte flow. |

---

# 2 — Identity Drift Model

## 🔧 Mechaniek

- Gebruiker kiest geen identiteit; identiteit ontstaat uit data.
- Engine analyseert 30–90 dagen: completion type distribution, average rank score, cancel ratio, social vs solo ratio, push vs recovery ratio.
- Dynamische identiteit met types o.a.: Structured Operator, Volatile Sprinter, Avoidant Strategist, Social Executor, Burnout Cycler.
- Elke type activeert subtiele modifiers (bijv. Volatile: hoge peak XP + snellere load buildup; Structured: consistent XP multiplier + lagere high-risk reward).
- Identiteit mag verschuiven; geen permanente stempel.

## 📐 Engine-structuur

```ts
identityScore = {
  disciplineIndex,      // uit completion + streak
  volatilityIndex,     // variance in rank/load
  avoidanceIndex,      // cancel + delay
  recoveryDependencyIndex,
  socialIntensityIndex
}
// Map naar type → modifiers (xpPeakMult, loadBuildRate, riskRewardRatio, …)
```

## ⚖️ Balans

- Mechanisch effect verplicht; nooit alleen label.
- Recompute bij einde week of bij 7d nieuwe data; smooth transition (geen harde swap per dag).

---

| # | Actie | Done |
|---|--------|------|
| 2.1 | Schema: identity_drift_snapshot (user_id, period_end, discipline_index, volatility_index, avoidance_index, recovery_dependency_index, social_intensity_index, derived_type). | ☐ |
| 2.2 | Engine: bereken indices uit behaviour_log + task_events (30–90d): completion types, avg rank, cancel ratio, social/solo, push/recovery. | ☐ |
| 2.3 | Map indices → type (Structured Operator, Volatile Sprinter, Avoidant Strategist, Social Executor, Burnout Cycler); definieer modifiers per type. | ☐ |
| 2.4 | Integreer modifiers in XP/load/formules (today-engine, smart-suggestion, XP-award). | ☐ |
| 2.5 | UI: toon huidige “drift type” + korte uitleg; geen keuze, wel inzicht. | ☐ |

---

# 4 — Cognitive Load Forecast

## 🔧 Mechaniek

- Trendanalyse: load trend 3d, energy trend, completion drop, social mission density.
- overloadRisk = loadTrend×0.4 + energyDecline×0.3 + failureIncrease×0.3 (schaal 0–1).
- Als > 0.6: suggest recovery week, difficulty -10%, social missions beperkt.
- Copy: “Projected overload Wednesday.” Niet: “You are failing.”

## 📐 Engine-structuur

```ts
overloadRisk = (
  loadTrend3d * 0.4 +
  energyDecline * 0.3 +
  failureIncrease * 0.3
);
if (overloadRisk > 0.6) → recoveryWeekSuggested, difficultyModifier = -0.1, socialCap = true;
```

## ⚖️ Balans

- Alleen adviserend; geen straf-tone.
- Input uit daily_state + behaviour_log (laatste 3–7 dagen).

---

| # | Actie | Done |
|---|--------|------|
| 4.1 | Engine: computeOverloadRisk(loadTrend3d, energyDecline, failureIncrease) → 0–1. | ☐ |
| 4.2 | Bij >0.6: vlag recoveryWeekSuggested; difficulty -10% in difficulty-engine; social mission cap in suggestie. | ☐ |
| 4.3 | UI: compacte forecast (“Projected overload [dag]”) + optionele “Recovery week aanbevolen.” | ☐ |

---

# 5 — Weekly Tactical Mode

## 🔧 Mechaniek

- Elke week heeft een modus: Stability Week, Push Week, Recovery Week, Expansion Week.
- Mode beïnvloedt: XP multipliers, failure penalties, suggestion bias, budget index weight.
- Bepaling: o.a. high burnout → Recovery; high stability → Push.
- Gebruiker mag 1× per week wijzigen.

## 📐 Engine-structuur

```ts
weeklyMode = 'stability' | 'push' | 'recovery' | 'expansion';
// determineBasedOnPerformance(burnoutRisk, stabilityIndex, lastWeekMode)
// Per mode: xpMult, failurePenalty, suggestionBias, budgetWeight
```

## ⚖️ Balans

- Eén override per week; daarna vast tot volgende week.

---

| # | Actie | Done |
|---|--------|------|
| 5.1 | Schema: weekly_mode (user_id, week_start, mode, user_override_used). | ☐ |
| 5.2 | Engine: determineWeeklyMode(performance, burnout, lastMode) + apply modifiers in XP/failure/suggestie/budget. | ☐ |
| 5.3 | UI: toon huidige weekmodus + knop “Wijzig modus” (1×/week). | ☐ |

---

# 6 — Controlled Chaos Missions

## 🔧 Mechaniek

- Random high-reward mission verschijnt (bijv. “2-hour deep focus block today only”). Reward +40% XP; failure Load +15.
- Breekt voorspelbaarheid; voorkomt stagnatie.
- Max 2 per week.

## 📐 Engine-structuur

```ts
chaosMissionsThisWeek = countFromBehaviourLog(userId, week, intent = 'chaos');
if (chaosMissionsThisWeek < 2) → mayEmitChaosMission();
chaosMission: base_xp * 1.4, failLoadPenalty = 15, expires_end_of_day.
```

## ⚖️ Balans

- Hard cap 2/week. Niet dagelijks.

---

| # | Actie | Done |
|---|--------|------|
| 6.1 | Mission type/label “chaos” of intent; expiry EOD. | ☐ |
| 6.2 | Engine: emissie-logica (max 2/week), XP +40%, fail Load +15. | ☐ |
| 6.3 | UI: duidelijke “vandaag alleen”-badge; geen spam. | ☐ |

---

# 8 — Social Simulation Layer

## 🔧 Mechaniek

- Social intensity score per missie.
- mentalBattery hoog: social mission XP bonus, leadership unlocks.
- mentalBattery laag: failure chance ↑, social drain ↑, solo bonus ↑.
- Mental battery beïnvloed door: social missions, conflict missions, recovery (niet alleen self-report).

## 📐 Engine-structuur

```ts
socialIntensityPerMission = f(social_load, mission_intent);
xpModifier += mentalBatteryHigh ? socialBonus : 0;
failureChance += mentalBatteryLow ? socialPenalty : 0;
soloBonus = mentalBatteryLow ? true : false;
// Battery decay/gain from completions (social/conflict/recovery)
```

## ⚖️ Balans

- Battery wordt door systeem bijgewerkt op basis van gedrag, niet alleen check-in.

---

| # | Actie | Done |
|---|--------|------|
| 8.1 | Social intensity op missie (bestaat deels als social_load); expliciet in engine voor XP/failure/solo. | ☐ |
| 8.2 | Battery update: na social/conflict mission drain; na recovery mission gain (naast ochtend-check-in). | ☐ |
| 8.3 | Integreer in today-engine + suggestie (solo bonus tonen bij lage battery). | ☐ |

---

# 9 — Scarcity Windows

## 🔧 Mechaniek

- Missies met tijdslimiet (“Available for 24h”). Gemist = reward weg.
- Scarcity gebaseerd op gedrag: high discipline → uitdagende scarcity; low discipline → lage drempel.
- Max 1 per dag.

## 📐 Engine-structuur

```ts
scarcityToday = countScarcityCompletionsOrOffers(userId, date);
if (scarcityToday >= 1) → noNewScarcity;
scarcityDifficulty = f(disciplineIndex); // high discipline → harder scarcity
```

## ⚖️ Balans

- Max 1/dag. Geen random spam.

---

| # | Actie | Done |
|---|--------|------|
| 9.1 | Mission flag/type “scarcity” + expires_at (24h). | ☐ |
| 9.2 | Engine: max 1 scarcity per dag; difficulty naar discipline. | ☐ |
| 9.3 | UI: “Beschikbaar 24u” + countdown; gemist = neutrale feedback, geen schuld. | ☐ |

---

# 12 — Autopilot Mode

## 🔧 Mechaniek

- Systeem detecteert: high volatility, avoidance patterns, planning fatigue → stelt Autopilot Day voor.
- User moet toestemming geven. Weigeren mag max 3× per 30 dagen. Na 3 weigeringen: autopilot wordt verplicht uitgevoerd.
- Autopilot bepaalt: missies, volgorde, difficulty, recovery moments. User kan alleen uitvoeren of falen.
- Framing: “System stabilization”, niet controle/straf.

## 📐 Engine-structuur

```ts
autopilotRefusals = countRefusals(userId, last30d);
if (autopilotSuggested && autopilotRefusals >= 3) → forceAutopilot();
autopilotDay: missions + order + difficulty + recovery slots from engine; user actions = complete/fail only.
```

## ⚖️ Balans

- Duidelijke, neutrale uitleg; geen schuldtaal. Log weigeringen en force alleen na 3.

---

| # | Actie | Done |
|---|--------|------|
| 12.1 | Schema: autopilot_refusal (user_id, suggested_at) + autopilot_day (user_id, date, forced). | ☐ |
| 12.2 | Detectie: volatility + avoidance + planning fatigue → suggestAutopilot(). | ☐ |
| 12.3 | Flow: voorstel → accept/refuse; refuse → +1 weigering; 3 in 30d → force autopilot volgende voorstel. | ☐ |
| 12.4 | Autopilot day: engine genereert dagplan; UI toont alleen uitvoeren/falen, geen herschikken. | ☐ |
| 12.5 | Copy: “Dag stabilisatie” / “System stabilization”, geen straf-woorden. | ☐ |

---

# 13 — Cognitive Investment System

## 🔧 Mechaniek

- Voor start: user kan Focus investeren (bijv. 20). Succes: +25% XP. Failure: focus verlies dubbel.
- Max 1 invested mission per dag.

## 📐 Engine-structuur

```ts
investedFocus = userInput; // optional, 0 = no investment
onSuccess: xp *= 1.25;
onFailure: focusConsumed += investedFocus * 2;
if (alreadyInvestedToday) → noInvestOption.
```

## ⚖️ Balans

- 1/dag. Geen gokken-stack.

---

| # | Actie | Done |
|---|--------|------|
| 13.1 | Schema/state: invested_mission_today (user_id, date) of flag in daily_state. | ☐ |
| 13.2 | Pre-start UI: “Investeer focus voor +25% XP (bij falen: dubbel verlies)” — alleen als nog 0 invested vandaag. | ☐ |
| 13.3 | XP en focus-consumption in completion/abandon flow. | ☐ |

---

# 14 — Regret Mechanic

## 🔧 Mechaniek

- Gemiste high-value mission verhoogt Missed Opportunity Index.
- Bij hoge index: XP multiplier licht dalend; suggesties benadrukken missed type.
- 3 completions van hetzelfde type resetten regret voor dat type. Geen schuld; psychologische spiegel.

## 📐 Engine-structuur

```ts
missedOpportunityIndex[missionType] = f(missedHighValueCount, time);
xpModifier -= smallDecay(missedOpportunityIndex);
suggestionBias += towardMissedType;
onCompletion(type, 3 in window) → resetRegret(type);
```

## ⚖️ Balans

- Geen schuld-copy. “Je hebt dit type even niet gepakt” → suggestie, geen berisping.

---

| # | Actie | Done |
|---|--------|------|
| 14.1 | Schema: missed_opportunity (user_id, mission_type, missed_at, value) of geaggregeerd in weekly snapshot. | ☐ |
| 14.2 | Engine: index per type; lichte XP-daling + suggestion bias; reset na 3 completionszelfde type. | ☐ |
| 14.3 | UI: geen “je hebt gefaald”; wel “Dit type kwam minder aan bod” in suggesties. | ☐ |

---

# 15 — Real-Life Anchor System

## 🔧 Mechaniek

- Gedrag beïnvloedt: budget, savings transfer, discretionary cap, growth unlocks.
- Weekly Behavior Index bepaalt: € bonus, € restrictie, growth unlock, mission difficulty (al deels in Fase 10).
- Expliciet: discretionary cap, savings transfer flow, growth unlocks gekoppeld aan index.

## 📐 Engine-structuur

```ts
weeklyBehaviorIndex → discretionaryBonus | savingsTransfer | discretionaryCap;
growthUnlock = f(behaviorIndex, streak, rank);
missionDifficultyModifier = f(behaviorIndex);
```

## ⚖️ Balans

- Transparant: user ziet wat er gebeurt en herstelpad (bijv. 3 S-rank → unlock).

---

| # | Actie | Done |
|---|--------|------|
| 15.1 | Uitbreiden weekly_budget_adjustment / behavior index: discretionary cap, growth_unlock_eligible. | ☐ |
| 15.2 | Savings transfer als duidelijke flow (niet alleen vlag); koppel aan index. | ☐ |
| 15.3 | Mission difficulty modifier uit behavior index in today-engine. | ☐ |
| 15.4 | UI: wekelijkse uitkomst + cap + growth unlock status. | ☐ |

---

# Volgorde van uitvoering (aanbevolen)

1. **Identity Drift** (2) — basis voor modifiers in alle andere engines.
2. **Cognitive Load Forecast** (4) — lichtgewicht, direct nuttig.
3. **Weekly Tactical Mode** (5) — week-context voor chaos en autopilot.
4. **Social Simulation Layer** (8) — mental battery al aanwezig; uitbreiden.
5. **Scarcity Windows** (9) — eenvoudige cap 1/dag.
6. **Controlled Chaos** (6) — cap 2/week.
7. **Cognitive Investment** (13) — cap 1/dag, duidelijke UX.
8. **Regret Mechanic** (14) — suggestie-bias, geen straf.
9. **Real-Life Anchor** (15) — uitbreiding Fase 10.
10. **Autopilot** (12) — laatste; meest gevoelig voor framing en test.

---

# Bewaken

- **Overcomplexiteit:** Elke module moet één duidelijke vraag beantwoorden; geen overlap zonder reden.
- **Perfectionisme-trigger:** Geen “perfect streak”-druk; herstelpaden altijd zichtbaar.
- **Compulsief gedrag:** Harde caps (chaos 2, scarcity 1, investment 1); autopilot na 3 weigeringen, niet na 1.
- **Frictie zonder schaamte:** Copy overal neutraal en adviserend.
- **Regulatie zonder dominantie:** User kan weekmodus 1× wijzigen; autopilot = stabilisatie, geen straf.

Dit actieplan is klaar om module voor module uitgevoerd te worden. Start met Identity Drift (2) voor engine-structuur, daarna Forecast (4) en Weekly Mode (5).
