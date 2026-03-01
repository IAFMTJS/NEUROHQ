# Overzicht: wat is nog niet geïmplementeerd / niet aangemaakt / niet uitgebreid

**Bron:** Analyse van alle chats (vandaag/laatste periode) + codebase-verificatie.  
**Referentie:** `ANALYSIS_TODAY_CHATS_NOT_IMPLEMENTED.md`, `CHECK_COMPLETE_STATUS.md`, `MISSIONS_PERFORMANCE_ENGINE_STATUS.md`.

---

## Samenvatting per type

| Type | Nog niet / niet volledig |
|------|--------------------------|
| **Modals** | Geen nieuwe ontbrekende modals; enkele verbeteringen open (zie hieronder). |
| **Cards** | 1 insight-card ontbreekt (Achievement density). Enkele cards: actieknop per kaart nog niet overal. |
| **Functions** | Achievement density (insight-engine), optioneel: bootstrap-refactor, opportunity-cost live. |
| **Features** | Zonder review nieuwe week blokkeren (productkeuze), totale UI uit bootstrap (refactor). |

---

## 1. Nog volledig ontbrekend

### Insights — Report

| Onderdeel | Beschrijving | Status |
|-----------|--------------|--------|
| **Achievement density** | Frequency, XP per badge, snelheid unlocks op report. | ❌ Geen `getAchievementDensity()` in `app/actions/dcic/insight-engine.ts`; geen `InsightsAchievementDensityCard` op report. |

*Alle overige Insights (HourHeatmap, DropOff, Correlation, Radar, Comparative, Friction40, ConsistencyMap, PowerUserMode) zijn wel geïmplementeerd en op de report-pagina.*

---

## 2. Deels geïmplementeerd of productkeuze

### Modals

| Modal | Wat ontbreekt / kan beter |
|-------|---------------------------|
| **TaskDetailsModal** | Fase match / deadline impact staat alleen in de strategische sectie; niet expliciet op de missiekaart zelf. |
| **CalendarModal3** | Alles uit de spec is aanwezig; geen verdere open punten. |
| **Add Mission 3.0 / FocusModal** | Volledig volgens chat-specs. |

### Cards

| Card | Opmerking |
|------|-----------|
| **Insights (report)** | Niet bij elke individuele insight een actieknop/CTA; Coach en enkele secties wel. |

### Strategy-pagina

| Onderdeel | Status |
|-----------|--------|
| **Zonder review → nieuwe week inactive** | Review-status wordt getoond; daadwerkelijk blokkeren van een nieuwe week is een productkeuze (nog niet ingeschakeld). |
| **Opportunity Cost bij slider** | Tekst aanwezig; live berekening bij aanpassen kan nog verder uitgewerkt worden. |

### PWA / config

| Onderdeel | Status |
|-----------|--------|
| **VAPID keys** | Code klaar; gebruiker moet keys in `.env.local` zetten. |
| **PWA witte marge** | In code afgedekt (viewportFit/themeColor); kan op sommige toestellen nog wit zijn → herinstall/refresh. |

### Data / architectuur

| Onderdeel | Status |
|-----------|--------|
| **MissionProfile als aparte tabel** | Nu velden op `tasks`; geen aparte MissionProfile-tabel. |
| **Pagina’s volledig uit bootstrap** | Dashboard/tasks fetchen nog eigen data; bootstrap is beschikbaar voor client components maar niet als enige bron. |

---

## 3. Wat wél is geïmplementeerd (referentie)

- **Missions:** Decision Engine, UMS, Smart Recommendation Hero, DecisionBlocksRow, TaskDetailsModal, Add Mission 3.0, CalendarModal3, task events, Emotional State, Resistance Index, Meta 30, Recovery Campaign, High ROI, Auto-Scheduler, economy (Discipline Points, Focus Credits, Momentum), mission chains, anti-grind, pressure gradient, totale geplande tijd per dag, strategic distribution warning, emotional state correlaties (EmotionalStateCorrelationBanner).
- **Strategy:** 4 lagen, Anti-Distraction Guard in FocusModal, build-fixes.
- **Insights:** Momentum Hero, Graph, Gedrag, Risk, Coach, HourHeatmap, DropOff, Correlation, Radar, Comparative, Friction40, ConsistencyMap, PowerUserModeToggle.
- **PWA/Client:** Bootstrap (`getAppBootstrap`, BootstrapProvider), offline queue (OfflineQueueSync), “Nieuwe versie beschikbaar”-toast, code splitting.
- **Data:** task_events, mission_events, task_user_stats, fatigue_impact op tasks, economy/chain-migraties.

---

## 4. Aanbevolen vervolgstappen (prioriteit)

1. **Achievement density** — `getAchievementDensity()` in `insight-engine.ts` + `InsightsAchievementDensityCard` toevoegen en op report renderen.
2. **Fase match / deadline impact op kaart** — Optioneel: op de missiekaart zelf een korte indicator (bijv. “Fase match” / “Deadline -0.4d”).
3. **Elke insight een actieknop** — Optioneel: per insight-card een CTA (bijv. “Bekijk taken”, “Naar strategy”).
4. **Bootstrap-refactor** — Optioneel: dashboard/tasks laten lezen uit `useBootstrap()` i.p.v. eigen fetches.
5. **Productkeuze** — “Zonder review nieuwe week inactive” expliciet blokkeren als gewenst.

---

*Dit overzicht is gebaseerd op de bestaande analyse-docs en een snelle codebase-check. Voor gedetailleerde status per chat zie `ANALYSIS_TODAY_CHATS_NOT_IMPLEMENTED.md` en `CHECK_COMPLETE_STATUS.md`.*
