# Analyse: NEUROHQ_FULL_INTELLIGENCE_LAYER_v1 + NEUROHQ_CONVERSATION_MASTER_v1

**Doel**: De twee nieuwe bestanden in "Info en opdracht" analyseren en in kaart brengen ten opzichte van de bestaande NEUROHQ-assistantdocumentatie (100% Analyse, Detailed Plan, Brain Behavior Map).

---

## 1. Welke bestanden

| Bestand | Inhoud in het kort |
|---------|--------------------|
| **NEUROHQ_FULL_INTELLIGENCE_LAYER_v1.txt** | Volledige deterministische “intelligence layer”: intent classifier, signal extractor, state updater, crisis engine, conversation mode router, 30-day pattern memory. AI doet alleen formatting. |
| **NEUROHQ_CONVERSATION_MASTER_v1.txt** | Conversatie-architectuur: 5 modi (Diagnostic, Strategic, Reflective, Pressure, Stabilisation), response-structuur, **200-intervention library** (vragen/statements per modus), rhythm rule, failsafes. |

---

## 2. FULL INTELLIGENCE LAYER – Wat erin zit

### 2.1 Principe (sluit aan op wat we al hebben)

- **AI beslist geen logica**: alle escalation, scoring en gedragsinterpretatie is deterministisch; de AI formatteert alleen output. Dit is hetzelfde als in de 100% Analyse.

### 2.2 Interpretatie-engine (flow)

**interpretation.engine.ts** – bij elk user-bericht:

1. `classifyIntent(message)` → intent
2. `extractSignals(message)` → signals
3. `evaluateCrisis(message, signals)` → crisisAssessment
4. `updateStateFromSignals(currentState, signals, crisisAssessment)` → updatedState
5. `evaluateEscalation(updatedState)` → escalationDecision
6. `determineConversationMode(updatedState, escalationDecision, crisisAssessment)` → conversationMode

Output: `{ intent, signals, crisisAssessment, updatedState, escalationDecision, conversationMode }`.  
Daarna: prompt bouwen met dit object → AI formatteert → eventueel escalation loggen → pattern memory updaten.

**Verschil met huidige flow**: We hadden al state → escalation → decision. Hier komt **voor** de bestaande state **intent + signals + crisis uit de message** en een **state update op basis van die message**. De escalation draait dus op **updatedState** (state + effect van het huidige bericht).

### 2.3 Intent classifier (nieuw)

**classifyIntent(message)** – op basis van zinsdelen (NL):

| Intent | Voorbeelden van triggers (lowercase) |
|--------|--------------------------------------|
| **crisis** | "ik trek het niet", "ik ben kapot", "overweldigd", "alles is te veel" |
| **rationalisation** | "weinig energie", "geen tijd", "te druk", "verkeerde mindset" |
| **reflection** | "ik twijfel", "ik weet dat ik mezelf", "misschien moet ik", "richting klopt niet" |
| **execution_update** | "ik heb gedaan", "afgewerkt", "klaar" |
| **status_update** | default |

**Nut**: De prompt/response kan per intent anders (crisis → stabilisatie; rationalisation → niet meegaan in excuus; reflection → reflectieve vragen; execution_update → bevestigen + volgende stap).

### 2.4 Signal extractor (nieuw)

**extractSignals(message)** – uit de tekst van het bericht:

- **reportedEnergy**: bijv. "weinig energie" → 3, "veel energie" → 8, anders null.
- **taskCompleted**: "ik heb gedaan" of "klaar".
- **externalBlame**: "te druk", "anderen", "geen tijd".
- **avoidanceAdmitted**: "uitgesteld", "vermeden", "niet gedaan".
- **identityDoubt**: "twijfel", "richting klopt niet".

**Nut**: Zonder LLM kunnen we uit de message al gedragssignalen halen en die in state en crisis meenemen.

### 2.5 State updater (nieuw)

**updateStateFromSignals(state, signals, crisisAssessment)** – wijziging van state op basis van message-signalen:

- externalBlame → stabilityIndex -= 2
- avoidanceAdmitted → avoidanceTrend += 0.1
- taskCompleted → progress += 5, avoidanceTrend = max(0, avoidanceTrend - 0.1)
- identityDoubt → identityAlignmentScore -= 5
- crisisAssessment.active → intensityTier = 1
- Alles geclamped (stabilityIndex 0–100, avoidanceTrend 0–1, identityAlignmentScore 0–100).

**Nut**: Het gesprek zelf past de “werkstate” aan (voor deze request); je kunt ervoor kiezen dit niet te persisten of later te mergen met DB-state.

### 2.6 Crisis detection engine (nieuw, expliciet)

**evaluateCrisis(message, signals)**:

- severity += 2 bij zinnen als "ik trek het niet", "alles is te veel", "ik ben kapot"
- severity += 1 als reportedEnergy !== null && reportedEnergy <= 2
- active = severity >= 2

**Nut**: Duidelijke, implementeerbare crisis-detectie uit message + signals; sluit aan bij “crisis state suppresses escalation”.

### 2.7 Conversation mode (nieuw t.o.v. alleen tier)

**determineConversationMode(state, escalation, crisisAssessment)**:

- crisisAssessment.active → **"stabilisation"**
- state.energy <= 3 → **"stabilisation"**
- escalation.tier === 3 → **"pressure"**
- escalation.tier === 2: identityAlignmentScore < 50 → **"reflective"**, anders **"diagnostic"**
- state.energy >= 6 → **"strategic"**
- default → **"diagnostic"**

**Nut**: Naast tier (1/2/3) heb je nu vijf **conversatiemodi** die bepalen welke soort vragen/statements de AI kiest (diagnostic, strategic, reflective, pressure, stabilisation).

### 2.8 Pattern memory engine (30-day summary)

**generate30DaySummary(checkins, tasks, escalationLogs)**:

- **avoidanceTrend**: incompleteCore / total (core tasks niet af).
- **energyStability**: variantie van energy over check-ins.
- **identityDrift**: nonCore / total (niet-core taken).
- **escalationFrequency**: aantal escalationLogs.

**Nut**: Concreet formulevoorstel voor 30-day pattern; kan als input voor escalation of voor prompt-context (bijv. “laatste 30 dagen: avoidance X, identity drift Y”).

---

## 3. CONVERSATION MASTER – Wat erin zit

### 3.1 Regels

- De assistant praat nooit “random”; elk antwoord hoort bij een **gedefinieerde modus**.
- **Modi**: Diagnostic, Strategic, Reflective, Pressure, Stabilisation (zelfde 5 als in Intelligence Layer).
- **Structuur per interventie**: Trigger → Direct statement (bij escalation) → Evidence (indien nodig) → Question or analysis → Direction.
- **Rhythm rule**: Confront → Question → Silence → Summary → Correction.
- **Tone**: Variëren tussen short and sharp; analytical and structured; reflective and probing; stabilising and minimal.
- **Failsafes**: Nooit escaleren bij crisis; nooit pressure bij energy <= 3; nooit meer dan 1 confrontatiezin per response; altijd minstens 1 concrete actie-suggestie.

### 3.2 Mode router (pseudocode)

Zelfde logica als in Intelligence Layer (energy <= 3 → stabilisation; tier 3 → pressure; tier 2 + IAS < 50 → reflective, else diagnostic; energy >= 7 && tier >= 2 → pressure; energy >= 6 → strategic; else diagnostic).

### 3.3 Response-opbouw: 3–6 interventies

- **selectInterventions(mode, escalationDecision)**: kies 3–6 interventies, max 6, altijd minstens 1 actionable direction.
- Per modus een **mix uit pools**: pressurePool, diagnosticPool, strategicPool, reflectivePool, stabilisationPool.  
  Voorbeelden: pressure = 1 pressure + 2 diagnostic + 1 strategic; diagnostic = 3 diagnostic + 1 strategic; strategic = 3 strategic + 1 diagnostic; reflective = 3 reflective + 1 strategic; stabilisation = 3 stabilisation + 1 strategic.

### 3.4 200-intervention library

- **Diagnostic (1–40)**: Vragen als “What happened concretely?”, “What did you avoid?”, “What is the consequence?”, “What is the action?”, “What is the likely cause?”, “What does the data show?”, “What is the cost of delay?”, enz.
- **Strategic (41–80)**: “What is the smallest executable version?”, “What aligns with your quarter?”, “What is high leverage?”, “What is your next visible action?”, enz.
- **Reflective (81–120)**: “Why did you choose this direction?”, “Is this growth or protection?”, “What identity are you performing?”, “What would you choose without fear?”, “What would courage look like?”, enz.
- **Pressure (121–160)**: Statements als “This is avoidance.”, “Your energy was sufficient.”, “This pattern repeats.”, “You are choosing safety.”, “You are avoiding evaluation.”, “This is a choice.”, enz.
- **Stabilisation (161–200)**: “Today we build stability.”, “What fits within 20 units?”, “What is enough for today?”, “What reduces pressure?”, “What prevents burnout?”, enz.

**Nut**: Geeft de AI (of de prompt builder) een vaste set vragen/statements per modus; vermindert willekeur en houdt toon consistent.

---

## 4. Relatie met bestaande documentatie

| Onderdeel | 100% Analyse / Plan / Brain Map | Full Intelligence Layer | Conversation Master |
|-----------|---------------------------------|--------------------------|----------------------|
| **AI = formatter** | ✅ | ✅ | ✅ (impliciet) |
| **Escalation tier (1/2/3)** | ✅ thresholds | ✅ via evaluateEscalation(updatedState) | ✅ gebruikt in mode router |
| **Crisis onderdrukt escalation** | ✅ | ✅ crisis engine + state updater | ✅ failsafe |
| **State uit DB** | ✅ (state aggregator) | ✅ + update uit message (signals) | — |
| **Conversation mode** | — | ✅ 5 modi | ✅zelfde 5 + 200 interventions |
| **Intent uit message** | — | ✅ 5 intents (crisis, rationalisation, …) | — |
| **Signals uit message** | — | ✅ energy, completion, blame, avoidance, identity | — |
| **Response-structuur** | ✅ statement → evidence → analysis → correction | — | ✅ Trigger → statement → evidence → question → direction; rhythm rule |
| **Wat zeggen/vragen** | ✅ Brain Map (templates, verboden, gesprek/suggesties/boeken) | — | ✅ 200 interventions als library |
| **Drielagen-analyse** | ✅ | — | — (diagnostic vragen sluiten aan) |
| **Check-in, suggesties, boeken, reflectieve vragen** | ✅ Brain Map sectie 12 | — | ✅ strategic/stabilisation/diagnostic/reflective sluiten aan |

---

## 5. Nieuwe bouwstenen t.o.v. wat we al hadden

1. **Intent classifier** (message → crisis | rationalisation | reflection | execution_update | status_update) – stuur prompt/response per intent.
2. **Signal extractor** (message → reportedEnergy, taskCompleted, externalBlame, avoidanceAdmitted, identityDoubt) – input voor state update en crisis.
3. **State updater** (state + signals + crisis → updatedState) – state voor deze request kan afwijken van alleen-DB.
4. **Crisis engine** (message + signals → active, severity) – expliciete implementatie van crisis-detectie.
5. **Conversation mode** (state + escalation + crisis → diagnostic | strategic | reflective | pressure | stabilisation) – naast tier, voor keuze van type interventie.
6. **30-day pattern summary** – formules voor avoidanceTrend, energyStability, identityDrift, escalationFrequency uit checkins/tasks/logs.
7. **200-intervention library** – vaste vragen/statements per modus; bruikbaar als prompt-context of als pool waaruit de AI kiest.
8. **Rhythm rule** – Confront → Question → Silence → Summary → Correction.
9. **Regel “3–6 interventies, max 6, altijd 1 actionable direction”** – duidelijke begrenzing van lengte en inhoud.

---

## 6. Spanning: Pressure-pool vs. “no labeling”

In de **Brain Behavior Map** staat: geen persoonlijkheidstrekken labelen, geen shaming, geen “je bent een uitsteller”. In de **Pressure-pool (121–160)** staan zinnen als:

- “This is self-sabotage.”
- “You are choosing safety.” / “You are lowering risk.” / “You are avoiding evaluation.”
- “This is defensive positioning.”

**Afweging**:

- **Streng**: Alleen objectieve, feitelijke statements toestaan (bijv. “This is avoidance.” + evidence; “Your energy was sufficient.” + data). “Self-sabotage”, “defensive positioning” en “you are choosing safety” dan schrappen of herformuleren naar gedrag + data.
- **Soepel**: Pressure mag “confronterend” zijn maar blijft binnen “geen diagnose, geen shaming”; dan alleen de scherpste (persoonlijkheid/label) eruit filteren en de rest als “hard but evidence-based” toelaten.

**Aanbeveling**: Pressure alleen met **evidence in dezelfde response**; geen losse “You are choosing safety” zonder data. De 200-library gebruiken als **richting** (type vraag/statement), niet als letterlijke one-liners zonder context. In de prompt expliciet maken: “Pressure mode: use at most one direct statement from the pressure style; always pair with evidence and one concrete action.”

---

## 7. Integratie in bestaande docs / implementatie

- **100% Analyse**: Flow uitbreiden met: message → intent + signals → crisis → state update → escalation (op updatedState) → conversation mode. Crisis engine en state updater toevoegen als verplichte stappen.
- **ASSISTANT_WHAT_WE_NEED.md**: In “State aggregator” en “Escalation engine” opnemen: intent classifier, signal extractor, crisis engine, state updater; conversation mode als output van de engine (naast tier). Pattern memory (30-day summary) als optionele input voor state/samenvatting.
- **Prompt builder**: Input uitbreiden met: **intent**, **conversationMode**, **signals** (optioneel). System prompt: “Current conversation mode: [diagnostic|strategic|reflective|pressure|stabilisation]. Use interventions that fit this mode; max 3–6 interventions, always at least one concrete action. Rhythm: confront → question → summary → correction where applicable.”
- **Brain Behavior Map / Detailed Plan**: Sectie toevoegen over **conversation modes** (wat elke modus inhoudt, wanneer welke) en **verwijzing naar de 200-intervention library** als bron voor vraag/statement-stijl (niet alle 200 letterlijk; wel de stijl en failsafes). Pressure-formuleringen afstemmen op “no labeling”-regel (zie §6).
- **Implementatie**: 
  - `lib/assistant/intent-classifier.ts`, `signal-extractor.ts`, `crisis-engine.ts`, `state-updater.ts`, `pattern-memory.ts` (of één module “intelligence-layer”).
  - Escalation engine blijft; input wordt **updatedState** (na state updater).
  - Conversation mode = `determineConversationMode(updatedState, escalationDecision, crisisAssessment)`.
  - Prompt builder krijgt intent, conversationMode, (optioneel) signals en 30-day summary; kan een subset van de 200 interventions als voorbeelden in de prompt zetten of als aparte context-file.

---

## 8. Samenvatting

- **Full Intelligence Layer** voegt een **deterministische laag** toe vóór de bestaande escalation: intent, signals, crisis, state-update uit de message, en conversation mode. Pattern memory geeft 30-day formules. Alles blijft “engine = brein, AI = formatter”.
- **Conversation Master** voegt **vijf conversatiemodi**, een vaste response-structuur, een **rhythm rule**, **failsafes** en een **200-intervention library** toe. Dat maakt de assistant voorspelbaarder en consistenter.
- Beide bestanden zijn **complementair** aan de bestaande docs; ze specificeren **hoe** state en modus tot stand komen en **welke soorten** zinnen per modus gebruikt kunnen worden. De ene echte spanning is de **Pressure-pool vs. no labeling**; die los je op door pressure te koppelen aan evidence en max één confrontatiezin, en eventueel enkele uitspraken te schrappen of te herformuleren.

Als je wilt, kan ik de concrete wijzigingen voor 100% Analyse, ASSISTANT_WHAT_WE_NEED, Brain Map en prompt-appendix als patch-tekst uitschrijven.
