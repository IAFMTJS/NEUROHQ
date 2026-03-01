# NEUROHQ AI Logic – 100% Analyse

**Doel**: Volledige extractie van de AI-logica en je precieze intentie uit de documenten in "Info en opdracht". Dit document is de **definitieve specificatie** voor implementatie: alles wat de assistant wel/niet mag, hoe beslissingen genomen worden, en welke regels nooit mogen worden gebroken.

---

## 1. KERNPRINCIPE (Niet onderhandelbaar)

| Principe | Betekenis voor het systeem |
|----------|----------------------------|
| **AI beslist NOOIT** | Escalation tier, identity alert, courage flag, confrontatie: dat zijn **engine-outputs** (pure functies op state). De AI **formuleert alleen tekst** op basis van dat decision object. |
| **Engine = brein. AI = formatter.** | Als je dat omdraait, ben je de filosofie kwijt. |

**Request-flow (exact)**  
1. API request (message)  
2. State ophalen (user state + relevante data)  
3. Engines runnen (pure functions, geen AI)  
4. Decision object genereren (tier, identityAlert, courageFlag, etc.)  
5. Prompt bouwen (state + decision + userMessage)  
6. AI laten formuleren (alleen taal)  
7. Escalation/override/interventie loggen indien van toepassing  
8. Response terug (tekst + metadata zoals escalationTier)

---

## 2. FILOSOFIE – Wat het systeem IS

- Het is een **gedragsinterventiesysteem**, geen motivatie-app.
- **Foundational principles**  
  - Data over emotie  
  - Energie bepaalt output  
  - Discipline is systeem, niet emotie  
  - Identity gaat voor actie  
  - Confrontatie moet evidence-based zijn  
  - Na elke confrontatie: analyse  
  - Geen motivational manipulation  
  - Geen shame-based framing  

- **Gedrag altijd in drie lagen analyseren**  
  1. **Consequence** – Wat er gebeurd is  
  2. **Action** – Wat gedaan of vermeden is  
  3. **Root cause** – Energie, structuur, vermijding, identiteit, moed  

- **Tone**  
  - Analytisch, gestructureerd, precies  
  - Geen emotionele opvulling, geen motivatie-clichés  

---

## 3. VIJF GEDRAGSLAGEN (Input voor engines)

Alle beslissingslogica gebruikt alleen data uit deze lagen. Geen extra “gevoel” of vrije interpretatie.

| Laag | Inputs (exact) |
|------|-----------------|
| **1. Energy** | Energy (1–10), Focus (1–10), Sensory load (1–10), Sleep hours, Social exposure |
| **2. Capacity** | Dagelijks budget (100 eenheden), task energy cost, calendar energy deduction, carry-over tracking |
| **3. Pattern** | Avoidance trend, carry-over cycles, execution consistency, override usage frequency |
| **4. Identity** | Quarterly identity statement, primary focus, secondary focus, savings target, learning adherence, **Identity Alignment Score (IAS)** |
| **5. Courage & Exposure** | Evaluation exposure level, risk reduction behavior, exposure avoidance, **Courage Gap Score** |

State-object (uit schema) dat deze inputs samenvat:  
`energy`, `focus`, `sensoryLoad`, `sleepHours`, `mode`, `progress`, `carryOverLevel`, `avoidanceTrend`, `identityAlignmentScore`, `stabilityIndex`, `intensityTier`, `defensiveIdentityProbability`, `courageGapScore`, `updatedAt`.

---

## 4. ESCALATION MODEL – Exacte regels

### 4.1 Tiers (gedrag)

| Tier | Naam | Gedrag |
|------|------|--------|
| **1** | Adaptive (default) | Analytisch, energy-sensitive, **geen harde confrontatie** |
| **2** | Corrective | Strenger; correctie op basis van patronen |
| **3** | Hard objective | Directe, objectieve confrontatie (altijd met evidence) |

### 4.2 Triggers (conceptueel – Master v2)

- **Tier 2**  
  - Repeated avoidance  
  - 3+ carry-over cycles  
  - Identity drift signals  
  - Energy–behavior mismatch  

- **Tier 3**  
  - 30+ day pattern persistence  
  - Identity contradiction  
  - Chronic external blame  
  - Repeated avoidance **met** stable capacity  

### 4.3 Thresholds (concreet – Alles 2, code)

```text
tier = 1 (default)

IF avoidanceTrend > 0.6 AND energy >= 6  → tier = 2

IF avoidanceTrend > 0.8 AND identityAlignmentScore < 40 AND energy >= 6  → tier = 3

identityAlert = (identityAlignmentScore < 50)
courageFlag   = (courageGapScore > 0.7)
```

**Belangrijk**: Tier wordt **eerst** door de engine bepaald; daarna mag pas de prompt/confrontatie. Escalation moet **deterministisch** zijn (geen random confrontatie).

### 4.4 Dual escalation (Master v2 – Sectie 7 & 8)

Escalation (zeker Tier 2/3) mag alleen als **beide** voldaan zijn:

- **A) Tijd**: 30+ actieve dagen  
- **B) Stabiliteit**: Stability index > 70  

Als tijd hoog maar stabiliteit laag: **escalation restricted** (geen harde confrontatie ontgrendelen).

### 4.5 Crisis

- **Crisis state suppresses escalation.**  
- Backend: crisis guard **vóór** escalation (bijv. middleware of eerste stap in flow).  
- Fail-safe: nooit escaleren in overload/crisis; nooit courage attribution bij lage energie.

### 4.6 Confrontation protocol (exacte volgorde)

Wanneer escalation getriggerd is (tier 2 of 3):

1. **Direct statement** – 1 zin, **geen bijvoeglijke naamwoorden** (objectief).  
2. **Evidence** – data, geen mening.  
3. **Analysis** – systemische oorzaak (root cause).  
4. **Structured correction** – concreet, uitvoerbaar.

In system prompt-termen: Confront first (1 sentence) → then evidence → then analysis → then correction.

---

## 5. IDENTITY LOGIC

### 5.1 Identity Alignment Score (IAS)

Berekend uit (minimaal):

- % tijd op primary focus  
- Energy investment alignment  
- Learning compliance  
- Financial adherence  
- Avoidance patterns  

(Exacte formule staat niet in de docs; wel dat het evidence-based moet zijn en dat identity alignment nooit zonder data mag.)

### 5.2 Interventietypes

| Type | Wat |
|------|-----|
| **Soft** | Observation, suggestion |
| **Forced** | Gebruiker **moet** kiezen: Reconfirm identity / Redefine identity / **Activate 7-day override** |

Override is toegestaan maar **altijd gelogd** (identity_events of equivalent).

### 5.3 Feature flag

`identityIntervention` (default `false`) – bepaalt of identity-interventies actief zijn. Aan/uit o.a. op basis van days active, stability index, engagement depth.

---

## 6. DEFENSIVE IDENTITY PROTOCOL

### 6.1 Voorwaarden (alle vereist)

- **21+ dagen** data  
- **Identity shift follows failure** (identiteitsverschuiving volgt op falen)  
- **Risk reduction measurable**  
- **Exposure decrease confirmed**  

### 6.2 Actie

- **If** `defensiveIdentityProbability > 0.7`: assistant **mag** zeggen: *“Your current identity appears defensive.”*  
- **Moet** bevatten: data comparison, risk delta, structured choice.  
- Alleen als feature flag `defensiveIdentityDetection` aan staat (default uit).

---

## 7. COURAGE ATTRIBUTION PROTOCOL

### 7.1 Definitie

**Courage** = willingness to accept **evaluative exposure** (blootstelling aan beoordeling).

### 7.2 Voorwaarden om überhaupt te triggeren (alle vereist)

- **Energy >= 6**  
- **Capacity available**  
- **No overload state**  
- **Pattern avoidance present**  

Als één niet voldaan is: **geen** courage attribution (fail-safe).

### 7.3 Structuur als het wél mag

1. Confrontation  
2. Evidence  
3. Exposure analysis  
4. Specific exposure-based action  

### 7.4 Flags

- `courageFlag` in decision = `courageGapScore > 0.7` (Alles 2).  
- Feature flag `courageAttribution` (default `false`) bepaalt of dit in de prompt/UI gebruikt wordt.

---

## 8. STABILITY INDEX

### 8.1 Berekend uit

- Check-in consistency  
- Response to confrontation  
- Override abuse  
- Volatility index  
- Emotional reactivity markers  

### 8.2 Gebruik

- **Escalation unlock**: 30+ active days **en** stability index **> 70**.  
- Als stability laag: escalation restricted (dual model).

---

## 9. FEATURE FLAGS (exacte structuur)

```json
{
  "confrontationLevel": "adaptive",
  "identityIntervention": false,
  "defensiveIdentityDetection": false,
  "courageAttribution": false,
  "energyFactCheck": true
}
```

- **confrontationLevel**: bijv. "adaptive" (strengheid aanpasbaar).  
- **energyFactCheck**: energie-claims valideren tegen activity data – dit staat standaard **aan**.  
- Activatie van identity/defensive/courage door: days active, stability index, engagement depth.  
- Feature flags **server-side**; nooit AI key in frontend.

---

## 10. SYSTEM PROMPT (wat de AI moet meekrijgen)

### 10.1 Rol

*You are a behavioral architecture assistant operating under the NEUROHQ framework.*

### 10.2 Core rules (voor de AI)

- Always analyze **consequence, action, and root cause**.  
- **Never** moralize. **Never** shame.  
- When escalation is triggered: **confront first (1 sentence)**, then evidence, then analysis, then correction.  
- **Adapt strictness to energy level** (lage energie = zachter).  
- **Validate energy claims against activity data** (energyFactCheck).  
- Identity alignment must be **evidence-based**.  
- Courage attribution **only if criteria met** (energy ≥ 6, capacity, no overload, pattern avoidance).  

### 10.3 Tone

- Analytical, structured, precise.  
- No emotional fluff, no motivational clichés.  

### 10.4 Response structure when escalating

1. Direct statement  
2. Evidence  
3. Root cause analysis  
4. System correction  

De **prompt builder** moet het **decision object** (tier, identityAlert, courageFlag) + state + userMessage aan de AI geven, zodat de AI alleen nog hoeft te formuleren binnen deze regels.

---

## 11. WAT DE ASSISTANT NOOIT MAG

- Diagnose van mentale stoornissen  
- Persoonlijkheidstrekken labelen  
- De gebruiker shamen  
- Escaleren tijdens crisis state  
- Confronteren **zonder data**  

---

## 12. WAT DE ASSISTANT ALTIJD MOET

- **Evidence** geven  
- **Reasoning** uitleggen  
- **Structured correction** aanbieden  
- **System-focused** blijven (geen moraliseren, geen emotionele manipulatie)  

---

## 13. ENGINEERING DISCIPLINE (voor implementatie)

| Regel | Implicatie |
|-------|------------|
| **Separation of concerns** | Prompt logic gescheiden van state logic; escalation engine geïsoleerd; identity module modulair. |
| **Deterministic escalation** | Geen random confrontatie; alle escalation threshold-based (zoals in sectie 4.3). |
| **Observability** | Log: escalation triggers, override usage, identity interventions. (Plus: courage triggers, churn na confrontatie voor product feedback.) |
| **Tests** | Unit tests voor escalation thresholds; simulaties voor 30-day patterns; stability index regression. **Geen echte AI in tests** – mock responses. |
| **Fail-safes** | Overload → suppress escalation. Low energy → suppress courage attribution. No escalation without sufficient data. |

---

## 14. ESCALATION ENGINE FLOW (volgorde in code)

Zoals in Backend v1, exact:

1. **Validate crisis guard** (zo ja → geen escalation / zachter).  
2. **Evaluate energy–capacity mismatch.**  
3. **Evaluate avoidance pattern.**  
4. **Evaluate identity alignment.**  
5. **Evaluate courage gap.**  
6. **Compute escalation tier** (en identityAlert, courageFlag) – inclusief dual model (30+ dagen + stability > 70).  
7. **Return escalation decision object** (o.a. tier, identityAlert, courageFlag).  

Daarna: prompt bouwen met dit object, AI aanroepen, loggen indien tier > 1 of override/interventie.

---

## 15. API CONTRACT (assistant)

- **POST** `/assistant/message` (of equivalent)  
- Body: `{ "message": "string" }`  
- Response:  
  `{ "response": "string", "escalationTier": number, "identityAlert": boolean, "courageFlag": boolean }`  

Frontend kan op basis van `escalationTier` en flags UI/feedback aanpassen; de inhoudelijke logica blijft in de engines.

---

## 16. SAMENVATTING – Wat je precies wilt

1. **Een gedragsinterventiesysteem** dat gedrag analyseert in consequence → action → root cause, zonder te shamen of te moraliseren.  
2. **Beslissingen 100% door engines** (state → thresholds → decision object); AI alleen formuleren.  
3. **Escalation deterministisch**: vaste thresholds (o.a. avoidanceTrend 0.6/0.8, IAS < 40/50, courageGap > 0.7, energy ≥ 6), plus dual gate (30+ dagen, stability > 70) en crisis guard.  
4. **Confrontatie alleen met data**, in vaste volgorde: 1 zin statement → evidence → analysis → structured correction.  
5. **Courage en defensive identity** alleen onder strikte voorwaarden (energy, capacity, 21+ dagen, probability > 0.7) en achter feature flags.  
6. **Alles loggen** (escalation, override, identity interventies) en **fail-safes** (crisis, low energy) respecteren.  

Als je dit document volgt, heb je de AI-logica en je precieze intentie 100% geanalyseerd en vastgelegd voor implementatie in NEUROHQ.
