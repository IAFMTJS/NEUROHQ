# Missions Performance Engine — Implementatiestatus

**Laatste update:** Alle ontbrekende onderdelen zijn geïmplementeerd.

## ✅ Geïmplementeerd

### 1. Decision Engine
- **Smart Recommendation Hero** — "Wat moet ik NU doen?" + top UMS-taak + UMS-breakdown (Alignment, Completion, ROI, Energy match, Pressure).
- **Unified Mission Score (UMS)** — Formule (StrategyAlignment×0.3 + CompletionProbability×0.2 + ROI×0.2 + EnergyMatch×0.15 + PressureImpact×0.15), server-side in `getDecisionBlocks` / `getTasksSortedByUMS`.
- **Dynamische blokken** — ⚠ Streak Critical, 🔥 High Pressure, 🟢 Recovery, 🎯 Alignment Fix (gevuld op basis van streak at risk, pressure zone, alignment score).
- **Mission grid gesorteerd op UMS** — Eerste kaart "Aanbevolen", overige tonen UMS %.

### 2. Strategic Integration
- **TaskDetailsModal** — Sectie "Strategische impact": Verwachte XP, Alignment %, Discipline effect, ROI, Pressure, Strategische waarde, Psychology label.
- **Mission cards** — UMS-sorting; strategicByTaskId doorgegeven aan TaskList voor details.
- **Domein op taken** — Kolom `domain` (discipline/health/learning/business); gebruikt in UMS en alignment fix.

### 3. Data-architectuur
- **Migration 034** — `tasks`: domain, cognitive_load, emotional_resistance, discipline_weight, strategic_value, psychology_label, mission_intent; tabel `task_events`; views mission_user_stats, task_user_stats.
- **getDecisionBlocks**, **getTasksSortedByUMS**, **getCalendarWeekData**, **getWeekPlannedLoad**.

### 4. Add Mission Modal 3.0
- **6 stappen** — Intent, Strategic Mapping (domain), Mission DNA (presets + sliders), Live Impact Preview, Campaign Integration (standalone/chain/new), Completion + Commitment slider.
- **Commitment <70%** — Waarschuwing "Overweeg de missie aan te passen."
- **createTask** — Uitgebreid met domain, cognitive_load, emotional_resistance, discipline_weight, strategic_value, mission_intent.

### 5. Kalender Modal 3.0
- **Time Budget Visualizer** — Per dag: energy load, task count, overload-indicator (cap 10).
- **Strategic Distribution** — Weekly allocation + primary domain.
- **Pressure overlay** — Zone (comfort/healthy/risk) + dagen tot deadline.
- **Burnout detectie** — Waarschuwing bij 3 opeenvolgende zware dagen (energy ≥ 7).
- **Streak protection** — Lege dagen: "Voeg 5-min missie toe" (knop).
- **Auto-scheduler** — Placeholder-knop "Optimaliseer mijn week (binnenkort)".

### 6. Task events (volledig)
- **logTaskEvent** bij `view` (TaskDetailsModal open), `start` (Focus timer start), `complete` (completeTask), `abandon` (modal sluiten/Edit/Delete/Duplicate zonder voltooien).

### 7. Add Mission 3.0 — volledig
- **Step 2 Strategic Mapping:** Primary (+30%), Secondary (+10%), Outside (-20%) met bevestiging "Ik bevestig: deze missie valt buiten mijn huidige focus." (strategyMapping uit getDecisionBlocks).
- **Friction Alert:** getSimilarTasksCompletionRate(cognitiveLoad, energy, domain); waarschuwing in stap 6 als vergelijkbare missies lage completion rate hadden.
- **psychology_label** — Dropdown in Stap 6 (Avoidance Breaker, Identity Reinforcer, Consistency Builder, Momentum Booster, Fear Confronter).

### 8. Psychologische laag
- **Emotional State Check** — In FocusModal: "Hoe voel je je nu?" (Gefocust, Moe, Weerstand, Afgeleid, Gemotiveerd); opslag in daily_state.emotional_state (migratie 035).
- **Resistance Index** — getResistanceIndex(); UI "Je vermijdt hoge cognitieve missies" / "Veel missies niet afgerond" / "Je twijfelt lang voordat je start" op Missions-pagina (ResistanceIndexBanner).

### 9. Consequenties & druk
- **Alignment <60% voor 5 dagen → XP -10%** — In awardXPForTaskComplete: getAlignmentPenaltyMultiplier(); bij gemiddelde alignment < 0.6 over laatste 5 dagen wordt XP_TASK_COMPLETE met 0.9 vermenigvuldigd.
- **Deadline gemist → pressure** — Pressure wordt getoond (getPressureIndex); expliciete "pressure stijgt volgende cycle" na gemiste deadline niet als aparte state opgeslagen (kan later).

### 10. Meta & recovery
- **Meta 30 dagen** — getMetaInsights30(): grootste sabotagepatroon, meest effectieve type, comfortzone score, groei per domein; MetaInsights30Banner op Missions-pagina.
- **7 dagen inactive → Recovery Campaign** — getRecoveryCampaignNeeded(); RecoveryCampaignBanner met "Voeg 3 micro-missies toe" (link naar /tasks?add=today).

### 11. High ROI & Auto-Scheduler
- **High ROI-sectie** — HighROISection op Missions-pagina (top 3 taken op ROI uit tasksSortedByUMS).
- **Auto-Scheduler** — getAutoScheduleSuggestions(weekStart): suggesties om taken van overloaded naar lichte dagen te verplaatsen; in Kalender 3.0 knop "Optimaliseer mijn week" + "Toepassen" (updateTask due_date).

---

## Nog niet geïmplementeerd (optioneel)

- **Discipline Points, Focus Credits, Momentum Boosters** — Economie naast XP (alleen XP gebruikt).
- **Mission Chains & Campaigns** — Data model voor chains (voltooiing → alignment bonus); UI-keuze standalone/chain/new wel aanwezig.
- **Anti-Grind** — Diminishing returns bij herhaald exploit-gedrag.
- **Deadline gemist → pressure stijgt volgende cycle** — Expliciete state/kolom voor "pressure boost" na gemiste deadline.
