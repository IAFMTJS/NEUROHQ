# Analyse: alle chats van vandaag — wat is nog niet (volledig) geïmplementeerd

Dit document bundelt **alle verzoeken uit de chats van vandaag** en geeft per onderdeel aan of het is geïmplementeerd, deels, of nog niet.

---

## Bronnen

- **Chat 1 (Missions Performance Engine):** 7 lagen, Add Mission 3.0, Kalender 3.0, data-architectuur, daarna “alles” implementeren, daarna “analyse van wat nog niet is geïmplementeerd”.
- **Chat 2 (Strategy 4 lagen):** Strategy-pagina (Direction, Allocation, Accountability, Pressure), build-fixes, commit/push.
- **Chat 3 (Insights 2.0):** Insights: verklaren/voorspellen/sturen, data model, insight engine, report-secties, links naar /tasks, mascotte, build-fix.
- **Chat 4 (AICoach, design):** Behavior patterns error, design page verwijderen.
- **Chat 5 (Checklist “Top on site”, PWA, client engine, code splitting):** PWA-marge, missions-popup, brain circles + importance, XP-tracking, VAPID, app shell, client-side engine, code splitting.

---

## 1. MISSIONS PERFORMANCE ENGINE (Chat 1)

| Onderdeel | Status | Opmerking |
|-----------|--------|------------|
| Decision Engine (UMS, Smart Recommendation Hero, dynamische blokken) | ✅ | Geïmplementeerd |
| Strategic Integration (domein, alignment impact, XP/discipline/ROI in details) | ✅ | TaskDetailsModal + strategicByTaskId |
| Mission cards gesorteerd op UMS | ✅ | |
| Task events (view, start, complete, abandon) | ✅ | logTaskEvent overal waar nodig |
| Step 2 Strategic Mapping (Primary/Secondary/Outside + bevestiging) | ✅ | strategyMapping, outside-confirm |
| Friction Alert (gelijkaardige missies lage completion rate) | ✅ | getSimilarTasksCompletionRate, stap 6 |
| Psychology label in Add Mission 3.0 | ✅ | Dropdown stap 6 |
| Emotional State Check (Gefocust/Moe/Weerstand/Afgeleid/Gemotiveerd) | ✅ | FocusModal + daily_state.emotional_state |
| Resistance Index UI | ✅ | getResistanceIndex, ResistanceIndexBanner |
| Alignment <60% 5 dagen → XP -10% | ✅ | getAlignmentPenaltyMultiplier in awardXPForTaskComplete |
| Meta 30 dagen (sabotage, effectief type, comfortzone, groei) | ✅ | getMetaInsights30, MetaInsights30Banner |
| 7 dagen inactive → Recovery Campaign | ✅ | getRecoveryCampaignNeeded, RecoveryCampaignBanner |
| High ROI-sectie | ✅ | HighROISection |
| Auto-Scheduler “Optimaliseer mijn week” | ✅ | getAutoScheduleSuggestions, Toepassen in CalendarModal3 |
| Kalender 3.0 (time budget, pressure, burnout, streak protection) | ✅ | |
| **Discipline Points, Focus Credits, Momentum Boosters** | ❌ | Alleen XP; geen aparte currency |
| **Mission Chains & Campaigns (data model, voltooiing → bonus)** | ❌ | UI-keuze standalone/chain/new wel; geen chains-tabel of completion-logica |
| **Anti-Grind (XP diminishing returns bij herhaling)** | ❌ | Niet geïmplementeerd |
| **Deadline gemist → pressure stijgt volgende cycle (expliciete state)** | ⚠️ | Pressure wordt getoond; geen aparte “pressure boost”-kolom/state na gemiste deadline |
| **Correlaties emotional state: “Je completion rate blijft 72% zelfs als je moe bent”** | ❌ | Emotional state wordt opgeslagen; geen UI die deze correlaties toont |
| **Fase match / Deadline impact (-0.4 dagen) op missiekaart** | ⚠️ | Niet expliciet op kaart; wel in strategic preview in details |
| **Totale geplande tijd per dag (naast energy load)** | ⚠️ | Kalender toont energy + task count; “totale geplande tijd” in minuten niet |
| **Strategic Distribution: % tijd per domein + afwijking = visuele waarschuwing** | ⚠️ | Weekly allocation getoond; “afwijking = visuele waarschuwing” in weekview niet |
| **Pressure gradient in weekview (intensiteit bij naderende deadline)** | ❌ | Alleen pressure-zone tekst; geen gradient in kalender |

---

## 2. STRATEGY 4 LAGEN (Chat 2)

| Onderdeel | Status | Opmerking |
|-----------|--------|------------|
| Thesis, focus, allocation, alignment, momentum, drift, pressure, phase, review, archive | ✅ | Strategy-pagina + strategyFocus.ts |
| Build-fixes (domainLabel, alignmentScore, StrategyDomain, DOMAINS.sort, Tooltip formatter) | ✅ | Verplaatst naar lib, fixes toegepast |
| **“Zonder review: nieuwe week inactive” (blokkeren van nieuwe week)** | ⚠️ | Review-status wordt getoond; product kan nog kiezen om daadwerkelijk te blokkeren |
| **Opportunity Cost Simulator: live bij slider-aanpassing** | ⚠️ | Opportunity cost-tekst bestaat; “live berekening bij aanpassen” kan verder uitgewerkt worden |
| **Anti-Distraction Guard: “Dit verlaagt je Alignment Score” bij missie buiten primary** | ❌ | Niet geïmplementeerd als guard bij start missie |

---

## 3. INSIGHTS 2.0 (Chat 3)

| Onderdeel | Status | Opmerking |
|-----------|--------|------------|
| Data model (daily metrics, mission_events) | ✅ | 032-migratie |
| Insight engine (momentum, trend, streak risk, coach, level projection) | ✅ | lib/insight-engine.ts, app/actions/dcic/insight-engine.ts |
| Report-secties: Momentum Hero, Graph, Gedrag, Risk & Forecast, Coach | ✅ | InsightsMomentumHero, InsightsGraphBlock, etc. |
| Links naar /tasks i.p.v. /missions | ✅ | |
| Mascotte op Insights-pagina | ✅ | |
| **Beste tijdstip (heatmap per uur)** | ❌ | “Beste prestatiedag” wel; heatmap per uur niet |
| **Drop-off pattern (wanneer afhaken: dag 3 streak, moeilijke missies, etc.)** | ❌ | Niet als aparte insight |
| **Correlation Insight Engine (“Wanneer energie <40, productiviteit -27%”)** | ❌ | Niet geïmplementeerd |
| **Strength vs Weakness Radar Chart (5–6 domeinen)** | ❌ | Niet op report |
| **Achievement density (frequency, XP per badge, snelheid unlocks)** | ❌ | Alleen badges/achievements; geen “density”-analyse |
| **Consistency Map (kalender: groen/geel/rood)** | ❌ | Niet op report (wel iets in Calendar 3.0) |
| **Comparative Intelligence (“14% consistenter dan vorige maand”)** | ❌ | Niet geïmplementeerd |
| **Friction Detection (aarzelt 40% langer bij moeilijke missies)** | ⚠️ | task_events + Resistance Index raken dit; geen expliciete “40% langer”-insight |
| **Power User Mode (toggle: ruwe data, export CSV, advanced metrics)** | ❌ | Niet op Insights-pagina |
| **Elke insight eindigt met actieknop** | ⚠️ | Coach en enkele CTAs wel; niet bij elke individuele insight een knop |

---

## 4. AICOACH & DESIGN (Chat 4)

| Onderdeel | Status | Opmerking |
|-----------|--------|------------|
| Behavior patterns error (graceful als tabel ontbreekt) | ✅ | |
| Design page verwijderen | ✅ | |

---

## 5. “TOP ON SITE” CHECKLIST, PWA, CLIENT ENGINE, CODE SPLITTING (Chat 5)

| Onderdeel | Status | Opmerking |
|-----------|--------|------------|
| PWA witte marge | ⚠️ | viewportFit/themeColor/background in code; als het nog wit is op één toestel: herinstall/refresh |
| Missions: alle taken zichtbaar + popup “nog een?” na minimum | ✅ | TaskList + showDoAnotherModal, “All tasks” |
| Add/Edit: 3 brain circles (energy, focus, load) + importance | ✅ | QuickAddModal focus; EditMissionModal; importance/urgency |
| XP goed bijgehouden / cache invalidation | ✅ | revalidateTag na completeTask |
| PWA notifications / VAPID | ⚠️ | Code en script bestaan; **gebruiker moet VAPID keys in .env.local zetten** (niet geïmplementeerd = config) |
| Client-side today engine (getTodayEngineData, useTodayEngine) | ✅ | lib/client-today-engine.ts, hooks/useTodayEngine.ts |
| Code splitting (tasks, dashboard, learning, report, strategy, settings, budget, assistant) | ✅ | Dynamic imports toegepast |
| **Bootstrap-call + client state (één getAppBootstrap, alle pagina’s uit state)** | ❌ | Niet gedaan; pagina’s fetchen nog per route |
| **Offline-first (IndexedDB, queue, sync bij online)** | ❌ | Niet geïmplementeerd |
| **“Nieuwe versie beschikbaar”-toast bij SW-update** | ❌ | Niet geïmplementeerd |

---

## 6. DATA ARCHITECTUUR (uit spec Chat 1)

| Onderdeel | Status | Opmerking |
|-----------|--------|------------|
| MissionProfile (domain, baseXP, cognitiveLoad, emotionalResistance, etc.) | ⚠️ | Velden op **tasks**; geen aparte MissionProfile-tabel |
| MissionUserStats (completionRate, hesitationTime, avgTime, ROI) | ⚠️ | **task_user_stats** view + task_events; ROI in app berekend |
| MissionEvent (view/start/complete/abandon + timestamps) | ✅ | **task_events** (voor tasks); mission_events voor DCIC missions |
| **fatigueImpact op MissionProfile** | ❌ | Niet op tasks |

---

## Samenvatting: nog niet of niet volledig geïmplementeerd

### Volledig ontbrekend

1. **Discipline Points, Focus Credits, Momentum Boosters** — Geen aparte currency naast XP.
2. **Mission Chains & Campaigns** — Geen data model; voltooiing van chain → alignment bonus/multiplier niet.
3. **Anti-Grind** — Geen XP diminishing returns bij herhaald gedrag.
4. **Correlaties emotional state** — Geen UI zoals “Je completion rate blijft 72% zelfs als je moe bent”.
5. **Pressure gradient in weekview** — Geen visuele intensiteit in kalender bij naderende deadline.
6. **Anti-Distraction Guard** — Geen melding “Dit verlaagt je Alignment Score” bij start missie buiten primary.
7. **Insights: Beste tijdstip (heatmap per uur)** — Niet gebouwd.
8. **Insights: Drop-off pattern** — Niet als aparte analyse.
9. **Insights: Correlation Insight Engine** — Geen automatische correlatie-zinnen.
10. **Insights: Strength vs Weakness Radar Chart** — Niet op report.
11. **Insights: Achievement density** — Niet geïmplementeerd.
12. **Insights: Consistency Map (kalender groen/geel/rood)** — Niet op report.
13. **Insights: Comparative Intelligence** — Niet geïmplementeerd.
14. **Insights: Power User Mode** — Geen toggle voor ruwe data/export/advanced.
15. **Bootstrap + client state** — Geen enkele getAppBootstrap; geen app-brede client state.
16. **Offline-first** — Geen IndexedDB, queue, sync.
17. **“Nieuwe versie beschikbaar”-toast** bij service worker-update.

### Deels / config / productkeuze

18. **Deadline gemist → pressure stijgt volgende cycle** — Pressure wordt getoond; expliciete state/kolom na deadline niet.
19. **Fase match / Deadline impact op missiekaart** — Alleen in details, niet op kaart.
20. **Totale geplande tijd per dag (minuten)** — Alleen energy + task count; geen minuten.
21. **Strategic Distribution: afwijking = visuele waarschuwing in weekview** — Weekly allocation wel; visuele waarschuwing niet.
22. **Strategy: zonder review nieuwe week inactive** — Logica mogelijk; product moet blokkeren inschakelen.
23. **Strategy: Opportunity Cost live bij slider** — Basis aanwezig; kan verder.
24. **Insights: elke insight met actieknop** — Gedeeltelijk; niet overal.
25. **Insights: Friction Detection (expliciete “40% langer”-insight)** — Data kan; expliciete copy niet.
26. **PWA witte marge** — In code afgedekt; mogelijk device-specifiek.
27. **PWA VAPID** — Code klaar; **gebruiker moet keys in .env.local zetten**.

### Data model

28. **MissionProfile als aparte entiteit** — Nu velden op tasks; geen aparte tabel.
29. **fatigueImpact** — Niet op tasks/missions.

---

Dit document kun je gebruiken als checklist voor wat je als volgende wilt oppakken (bijv. economie, chains, anti-grind, Insights-uitbreidingen, of client bootstrap/offline).
