# Map & analyse: Info en opdracht

Overzicht van de inhoud in **D:\NEUROHQ\AI Modal start\Info en opdracht** en hoe die samenhangt met NEUROHQ.

---

## 1. Bestandenoverzicht

| Bestand | Rol | Taal | Kerninhoud |
|--------|-----|------|------------|
| **Alles 2.txt** | Implementatie-stappen | NL | Prisma schema, NestJS skeleton, escalation engine, 30-dagen plan |
| **alles gewoon.txt** | Operationeel plan | NL | Tech stack, mappenstructuur, MVP-volgorde, security, deployment, “wat nog moet” |
| **NEUROHQ_PRODUCTION_BACKEND_v1.txt** | Backend-architectuur | EN | Folderstructuur, DB-schema, API-contract, escalation flow, engineering rules |
| **NEUROHQ_AI_MASTER_ARCHITECTURE_v2.txt** | Master-architectuur | EN | Filosofie, 5 lagen, escalation/identity/courage/stability, prompt template, roadmap |

---

## 2. Conceptuele kaart

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NEUROHQ = gedragsinterventiesysteem (geen “motivatie-app”)                 │
│  Principe: AI = formatter | Engine = brein | Confrontatie = evidence-based  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
┌───────────────┐             ┌─────────────────┐             ┌─────────────────┐
│  DATA LAGEN   │             │  BESLISSING     │             │  PRODUCTIE      │
│  (wat je      │             │  (hoe streng)   │             │  (hoe bouwen)   │
│   meet)       │             │                 │             │                 │
├───────────────┤             ├─────────────────┤             ├─────────────────┤
│ • Energy      │             │ Escalation      │             │ NestJS + Prisma │
│ • Capacity    │    ──────►  │ Tier 1/2/3      │  ──────►    │ PostgreSQL      │
│ • Patterns    │             │ Identity Alert  │             │ JWT, Docker     │
│ • Identity    │             │ Courage Flag    │             │ Railway/Fly.io  │
│ • Courage     │             │ Crisis guard    │             │ Supabase/Neon   │
└───────────────┘             └─────────────────┘             └─────────────────┘
```

- **Data**: wat je in DB en state bijhoudt (check-ins, tasks, identity, logs).
- **Beslissing**: pure logic in engines (escalation, identity, courage, stability); AI gebruikt alleen die beslissing om tekst te formuleren.
- **Productie**: stack en structuur uit “alles gewoon” en Production Backend v1.

---

## 3. Inhoud per bestand (gedetailleerd)

### 3.1 Alles 2.txt

- **STAP 1** – Volledig Prisma-schema (copy-paste klaar):
  - `User`, `UserState`, `DailyCheckin`, `Task`, `IdentityQuarter`, `IdentityEvent`, `EscalationLog`, `FeatureFlag`
  - Pad genoemd: `/apps/api/prisma/schema.prisma` (NestJS monorepo)
- **STAP 2** – NestJS-module:
  - `AssistantModule` met o.a. `AssistantController`, `AssistantService`, `EscalationEngine`, `PromptService`, `AiService`
  - Endpoint: `POST message` met `AuthGuard`
  - `handleMessage`: state → escalation decision → prompt → AI → (optioneel) log escalation
- **STAP 3** – Escalation engine (pseudo):
  - Tier 2: `avoidanceTrend > 0.6` en `energy >= 6`
  - Tier 3: `avoidanceTrend > 0.8`, `identityAlignmentScore < 40`, `energy >= 6`
  - Output: `tier`, `identityAlert`, `courageFlag`
- **STAP 4** – 30-dagen plan (dagen 1–30) opgesplitst in blokken (auth → check-in → tasks → escalation → identity → stability → defensive identity → courage → deploy/monitoring/beta).

**Belangrijk**: Je huidige codebase is **Next.js + Supabase**, geen NestJS/Prisma. Dit bestand is dus een **alternatief ontwerp** (NestJS-backend); schema en logica zijn wel herbruikbaar als referentie.

---

### 3.2 alles gewoon.txt

- **1. Tech stack (definitief)**
  - Backend: Node, TypeScript, NestJS, Prisma, PostgreSQL, JWT, OpenAI wrapper, Docker.
  - Infra: Railway/Fly.io/Render, Supabase of Neon, Sentry, PostHog. Geen Kafka/K8s/microservices.
- **2. Folderstructuur**
  - Onder `/apps/api`: modules (auth, users, checkin, tasks, identity, assistant, admin), domain (engines), services, guards, config, utils, infra, prisma.
- **3. Prisma**
  - Zelfde modellen als in Alles 2 (hoog niveau).
- **4. Logica-architectuur**
  - Duidelijke regel: AI beslist nooit; flow = request → state → engines → decision → prompt → AI (formatter) → log → response.
- **5. MVP in weken**
  - Week 1: Auth, UserState, check-in, Task CRUD, capacity.
  - Week 2: Escalation, avoidance, carry-over, basic identity, assistant endpoint.
  - Week 3: Identity alignment, stability, feature flags, tiers.
  - Week 4: Defensive identity, courage gap, energy fact-check.
- **6–9** Security (bcrypt, JWT refresh, rate limit, immutable logs, no AI key in frontend), monitoring (escalation/override/identity/courage/churn), deployment (Docker → Railway/Fly.io → env vars), teststrategie (unit + integration, geen echte AI in tests).
- **10. Wat je nog nodig hebt**
  - Landing, privacy, terms, data disclaimer, beta feedback, admin dashboard, manual feature-flag override, crisis failsafe, onboarding.

Dit is het **operationeel plan** dat alles in één doc wilde vangen.

---

### 3.3 NEUROHQ_PRODUCTION_BACKEND_v1.txt

- **1. Folderstructuur** (`/src`)
  - config, modules (auth, users, energy, capacity, patterns, identity, escalation, courage, stability, assistant, analytics), domain (state, scoring, rules), services, infrastructure, middlewares, utils, tests.
- **2. Database (PostgreSQL)**
  - Zelfde tabellen als Prisma-schema maar in snake_case (users, user_state, daily_checkins, tasks, identity_quarters, identity_events, escalation_logs, feature_flags).
- **3. API-contract**
  - Auth: register, login.
  - Check-in: POST body met energy, focus, sensoryLoad, sleepHours, socialExposure.
  - Tasks: POST, GET, PATCH complete.
  - Identity: current, update, override.
  - Assistant: POST message → response met `response`, `escalationTier`, `identityAlert`, `courageFlag`.
- **4. Escalation flow**
  - Crisis guard → energy-capacity mismatch → avoidance → identity alignment → courage gap → tier → decision object.
- **5. Engineering rules**
  - Escalation deterministisch, geen confrontatie zonder data, prompt gescheiden van state, domain onafhankelijk van AI-provider, alle escalation events gelogd, crisis onderdrukt escalation.

Dit is de **backend-spec** (kan naast NestJS ook voor een andere Node-backend gebruikt worden).

---

### 3.4 NEUROHQ_AI_MASTER_ARCHITECTURE_v2.txt

- **Sectie 1 – Filosofie**
  - Data over emotie, energie bepaalt output, discipline is systeem, identity voor actie, confrontatie evidence-based, geen moraliseren/shamen.
- **Sectie 2 – Vijf gedragslagen**
  1. Energy (energy, focus, sensory load, sleep, social exposure)
  2. Capacity (100-unit budget, task/calendar cost, carry-over)
  3. Pattern (avoidance, carry-over cycles, overrides)
  4. Identity (quarterly statement, focus, savings, learning, IAS)
  5. Courage & exposure (evaluative exposure, courage gap)
- **Sectie 3 – Escalation**
  - Tier 1: adaptief, analytisch, energy-sensitive.
  - Tier 2: corrective (avoidance, carry-over, identity drift, energy–gedrag mismatch).
  - Tier 3: hard (30+ dagen patroon, identity-tegenspraak, chronische external blame).
  - Protocol: direct statement → evidence → analysis → structured correction.
- **Sectie 4–8**
  - Identity (IAS, soft/forced intervention, override).
  - Defensive identity (21+ dagen, identity shift na falen, probability > 0.7).
  - Courage (alleen bij energy ≥ 6, capacity, geen overload).
  - Stability index (check-in consistency, response to confrontation, override abuse).
  - Dual escalation: tijd-drempel **én** stability-drempel (bijv. 30 dagen + stability > 70).
- **Sectie 9 – Feature flags**
  - confrontationLevel, identityIntervention, defensiveIdentityDetection, courageAttribution, energyFactCheck.
- **Sectie 10 – System prompt template**
  - Rol: behavioral architecture assistant; regels voor consequence/action/root cause, no moralizing/shaming, confront → evidence → analysis → correction, energy-adapt, validate energy vs data.
- **Sectie 11 – Technical roadmap**
  - Sprint 1: state, energy, capacity, chat, prompt builder.
  - Sprint 2: patterns, escalation, confrontation.
  - Sprint 3: identity, IAS, override.
  - Sprint 4: defensive identity, courage, energy discrepancy, stability.
  - Sprint 5: feature flags, crisis suppression, escalation gating, monitoring.
- **Sectie 12–13**
  - Engineering discipline (separation, deterministic escalation, observability, tests, fail-safes).
  - Non-negotiables: no diagnose/label/shaming, no escalation in crisis, no confront without data; wel evidence, reasoning, structured correction.

Dit is de **master-doc** voor gedragslogica en AI-gedrag; de bron voor prompt en productregels.

---

## 4. Overlap en verschillen

| Onderwerp | Alles 2 | alles gewoon | Backend v1 | Master v2 |
|----------|---------|--------------|------------|-----------|
| Prisma/DB-schema | ✅ Volledig | 🔹 Verwijzing | ✅ Tabellen | — |
| NestJS/modules | ✅ Skeleton | 🔹 Structuur | 🔹 Structuur | — |
| Escalation tiers | ✅ Code | 🔹 Tekst | 🔹 Flow | ✅ Uitgewerkt |
| Identity/IAS | 🔹 In schema | 🔹 Week 3 | 🔹 In flow | ✅ Volledig |
| Courage / stability | 🔹 In schema | 🔹 Week 4 | 🔹 In flow | ✅ Volledig |
| API-contract | 🔹 Message | — | ✅ Volledig | — |
| System prompt | — | — | — | ✅ Template |
| 30-dagen / weken | ✅ Dagen | ✅ Weken | — | ✅ Sprints |
| Security/monitoring | — | ✅ | 🔹 Rules | 🔹 Rules |

- **Alles 2** = meest concreet voor “bouw nu” (schema + NestJS + engine + 30 dagen).
- **alles gewoon** = breed plan (stack, MVP, security, wat nog moet).
- **Backend v1** = API + DB + flow + engineering rules.
- **Master v2** = gedragsregels, escalation/identity/courage/stability, prompt, non-negotiables.

---

## 5. Relatie met je huidige NEUROHQ-codebase

- Je project gebruikt **Next.js** (App Router) en **Supabase** (auth, DB), geen NestJS of Prisma.
- In de repo zitten o.a.:
  - `app/actions/` (daily-state, learning, quote, tasks, adaptive, analytics, preferences, xp)
  - `components/` (dashboard, missions, HQ, settings, …)
  - Supabase-migrations (o.a. `019_user_preferences_xp_analytics.sql`, `020_tasks_mental_social_load.sql`)

**Gap**:  
De docs in “Info en opdracht” beschrijven een **aparte Node/NestJS-backend** met Prisma. Je kunt:

1. **Optie A** – Backend zoals beschreven apart bouwen (NestJS + Prisma) en Next.js als frontend; dan zijn Alles 2 + Backend v1 de blauwdruk.
2. **Optie B** – Logica en gedrag **in je bestaande stack** implementeren: Supabase (schema + RPC of Edge Functions) + Next.js Server Actions; dan gebruik je Master v2 + Backend v1 als **specificatie** en vertaal je schema/engines naar Supabase/TypeScript.

De **filosofie en regels** (AI = formatter, engines = brein, escalation deterministisch, geen confrontatie zonder data) zijn stack-onafhankelijk en direct toepasbaar in beide opties.

---

## 6. Aanbevolen gebruik van deze map

- **Voor “wat moet het systeem doen?”** → **NEUROHQ_AI_MASTER_ARCHITECTURE_v2.txt** (en deze analyse sectie 3.4).
- **Voor “welke API en DB?”** → **NEUROHQ_PRODUCTION_BACKEND_v1.txt** + Prisma uit **Alles 2.txt**.
- **Voor “in welke volgorde bouwen?”** → **Alles 2.txt** (30 dagen) of **alles gewoon.txt** (weken) of Master v2 (sprints); kies één ritme en houd je eraan.
- **Voor “wat ontbreekt nog voor productie?”** → **alles gewoon.txt** punt 10 (landing, privacy, terms, admin, crisis failsafe, onboarding).

Als je wilt, kan de volgende stap zijn: (1) een **concrete vertaalslag** van dit map-document naar je bestaande Supabase-schema en app-structuur, of (2) een **prioriteitenlijst** (bijv. eerst escalation engine + assistant endpoint in Next.js).
