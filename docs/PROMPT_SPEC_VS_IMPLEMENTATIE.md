# Vergelijking: prompt-specs vs huidige implementatie

**Datum:** 22 feb 2025  
**Doel:** Eén overzicht van wat uit je prompts al bestaat, wat gedeeltelijk is uitgewerkt, en wat nog moet.

---

## 1. Dashboard / Home

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Eén meetbaar doel (weekly/daily mission progress)** | ❌ Ontbreekt | Geen single “wat moet ik nu doen?” hero. Wel: `ActiveMissionCard` (vandaag), `TodayEngineCard` (critical/high impact/growth), maar geen **één** doel met weekly/daily progress. |
| **Single CTA met context** (bv. “Voltooi 1 missie voor +120 XP”) | ❌ Ontbreekt | CTA is vast “Start Mission” zonder XP/context. Geen dynamische copy zoals “Voltooi 1 missie voor +120 XP”. |
| **Personaliseer hero: mascotte reageert op status** (low energy → “Slaap eerst”) | ❌ Ontbreekt | Mascotte is één beeld per pagina (PNG), geen status-gebaseerde variant of tooltip. |
| **Lightweight news/updates card** (changelogs, events) | ❌ Ontbreekt | Geen news/changelog/events-card op dashboard. |
| **Primaire CTA adaptief bij streak** (copy + micro-animation) | ❌ Ontbreekt | CTA blijft “Start Mission”; geen streak-afhankelijke copy of micro-animatie. |

**Quick wins:**  
- Eén meetbaar doel + single CTA met context (bv. eerste incomplete missie + XP) toevoegen.  
- CTA-copy dynamisch maken (streak → “Behoud je streak”, anders “Voltooi 1 missie voor +120 XP”).

---

## 2. Mascot / Branding

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Varianten mascotte voor status/achievements** (small sprite set) | ❌ Ontbreekt | Eén PNG per pagina in `lib/mascots.ts`; geen status/achievement-varianten. |
| **Mascotte vectorieel/transparant (SVG/WebP)** voor dark mode | ❌ Ontbreekt | Alleen PNG (`getMascotSrcForPage` → `/mascots/{file}.png`). Geen SVG/WebP-paden. |

**Te doen:**  
- Kleine sprite-set (bijv. low energy, streak, focus) + status-logica in hero.  
- Assets omzetten naar SVG/WebP en dark-mode vriendelijk maken.

---

## 3. Stat Rings / Metrics

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Exacte numerieke labels** (percentages + absolute waarden) | ⚠️ Gedeeltelijk | `CommanderStatRing` toont alleen `{pct}%` in de ring. Geen absolute waarden (bijv. “45% · 4.5/10”) naast de ring. |
| **Low-value alerts (<20%)** met textuele next steps | ❌ Ontbreekt | Geen micro-states voor lage waarden; geen “next steps” tekst bij amber inner glow. |
| **Export/share voor stats** (CSV of screenshot) | ⚠️ Gedeeltelijk | Insights: PowerUserModeToggle met “Export CSV (graph data)”. Geen export voor hero/stat-rings zelf. |

**Te doen:**  
- Naast elke ring: percentage + absoluut (design tokens, leesbaarheid voorop).  
- Bij &lt;20%: duidelijke tekst + optionele amber glow.  
- Eventueel export/screenshot voor hero-stats (of link naar Insights-export).

---

## 4. Primaire CTA (algemeen)

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Variant testing CTA-copy** (“Start missie”, “Claim beloning”, “Volgende stap”) | ❌ Ontbreekt | Geen A/B-test of varianten; vaste “Start Mission”. |
| **Micro-copy onder CTA** (gevolg van klikken) | ❌ Ontbreekt | Geen uitleg onder de CTA. |

**Te doen:**  
- CTA-varianten (bv. in preferences of feature flag) + logging voor A/B.  
- Korte micro-copy onder CTA (“Ga naar je missies en kies de volgende taak”).

---

## 5. Missions / Mission Grid

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Filters en quick-sort** (Active, Daily, Recommended, New) | ⚠️ Gedeeltelijk | `TaskList`: filters **All / Work / Personal / Recurring**. Geen Active / Daily / Recommended / New. Wel: `SmartRecommendationHero` + `DecisionBlocksRow` (streak critical, high pressure, recovery, alignment fix). |
| **Mission detail sheet (slide-over)** met verwachtingen, tijdsduur, XP, items | ✅ Aanwezig | `TaskDetailsModal`: details, subtasks, strategic preview, complete/snooze/edit/delete. |
| **Suggested mission op basis van user state** (energy/focus) | ✅ Aanwezig | `getDecisionBlocks`, `SmartRecommendationHero`, mode-based task list (stabilize, low_energy, driven, normal), `getTodaysTasks(..., taskMode)`. |

**Te doen:**  
- Filters uitbreiden of hernoemen naar Active / Daily / Recommended / New (of tabbladen) als dat beter past bij de content.  
- In detail-sheet: expliciet XP reward, tijdsduur, “benodigde items” tonen waar van toepassing.

---

## 6. Growth / Skill Tree

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Dependencies expliciet met hover tooltips** (why locked, what to unlock) | ❌ Ontbreekt | `CommanderSkillTree`: alleen level-drempels (Focus I ≥1, Focus II ≥3, Deep Focus ≥6). Geen tooltips, geen “waarom locked / wat te doen”. |
| **Visually connect nodes** (dikkere connector bij pre-req met) | ❌ Ontbreekt | Geen expliciete dependency-edges tussen nodes. |
| **Respec/reset path voor skills** | ❌ Ontbreekt | Geen reset/respec. |
| **Micro-transactions / soft currency UI** (indien monetization) | N.v.t. | Niet geïmplementeerd; optioneel voor later. |

**Te doen:**  
- Tooltips op nodes: “Locked: level 3 nodig” / “Volgende: voltooi X”.  
- Connectors tussen nodes (dikker wanneer pre-req voldaan).  
- Respec/reset (low effort, vermindert spijt).

---

## 7. Progress / XP / Leveling

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Historische XP-grafiek** (7/30 dagen) + next-step micro-goals | ✅ / ⚠️ | XP-pagina: `HQChart` “XP laatste 14 dagen”; `WeeklyHeatmap` 30 dagen. Next-step: `identity.xp_to_next_level`, `next_unlock`, `XPForecastWidget`. |
| **Contextuele tips om sneller XP te verdienen** | ⚠️ Gedeeltelijk | Alleen korte placeholder (“Missies · Campaigns · Alignment …”); geen echte tips-block. |

**Te doen:**  
- Optioneel 7-dagen view naast 14.  
- Dedicated “Hoe meer XP verdienen”-tips (shortcuts, aanbevolen acties).

---

## 8. Streaks / Retention

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Streak-weergave** | ✅ Aanwezig | `IdentityBlock`, XP-pagina, Learning (weeks ≥ target), `TodayEngineCard` streak risk. |
| **Streak protection** (one-time grace day token) | ⚠️ Gedeeltelijk | `streakAtRisk`, “Streak Critical” block, Calendar “Streak protection” (5-min missie). Geen **earnable/purchasable grace-day token**. |
| **Re-engagement nudges** (email/push na 2–3 dagen) met concrete benefit | ❌ Ontbreekt | `RecoveryCampaignBanner` voor inactive; geen “Je mist 120 XP als je morgen niet…” in email/push. |

**Te doen:**  
- Grace-day token (earnable/purchasable) ontwerpen en in UI + logica opnemen.  
- Re-engagement (email/push) met specifieke benefit-copy koppelen aan streak/XP.

---

## 9. Notifications / Toasters / Modals

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Modals voor high-value only; toasts voor micro feedback** | ⚠️ Gedeeltelijk | Veel modals (TaskDetails, Focus, Calendar, AddMission, etc.). Eén toast-achtige bar (ServiceWorkerRegistration). Geen algemeen toast-systeem (sonner/react-hot-toast). |
| **Toasts met undo** (claim, delete) | ❌ Ontbreekt | Geen toast-undo. Wel “This cannot be undone” bij delete. |

**Te doen:**  
- Beleid: modals alleen voor high-value (purchase, big rewards); rest toasts.  
- Toast-library introduceren + undo waar relevant (claim, delete).

---

## 10. Accessibility & Dark Mode

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Contrast audit (WCAG AA)** voor dark UI | ⚠️ In docs | BACKLOG/ACTION_PLAN noemen contrast; geen `prefers-contrast` in code. |
| **Dark mode: geen pure #000, layered grays, lagere saturatie** | ✅ Theme | Commander v2 dark theme; andere themes uit. |
| **Reduced-motion toggle** (zichtbaar, aan/uit) | ⚠️ Alleen CSS | `prefers-reduced-motion` in globals/dark-commander; geen **UI-toggle** in settings. |

**Te doen:**  
- Contrast audit (WCAG AA) voor tekst + accent glows.  
- Reduced-motion als instelling in settings (niet alleen system preference).

---

## 11. Analytics, A/B, Growth

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Events: mission_started, mission_completed, skill_unlocked, CTA_clicked** | ⚠️ Server-side | `behaviour_log`, `user_analytics_daily`, task completion; geen **named client events** (trackEvent("mission_completed") etc.). |
| **Funnel dashboards** | ❌ Ontbreekt | Geen apart funnel-dashboard (onboarding, mission flow). |
| **Heatmaps/recordings op onboarding** | ❌ Ontbreekt | Niet geïmplementeerd. |

**Te doen:**  
- Event-laag: `track("mission_started", { missionId })` etc., gekoppeld aan bestaande server-logging.  
- Eenvoudig funnel-overzicht (start → complete per stap).  
- Optioneel: heatmaps/recordings voor onboarding (tooling bepalen).

---

## 12. Error & Empty States

| Spec | Status | Huidige situatie |
|------|--------|-------------------|
| **Error: direct error + next step** (niet alleen amber border) | ⚠️ Versnipperd | Veel componenten hebben `error` state; niet overal consistente “next step”-tekst. |
| **Empty states met micro-tasks** (“Geen actieve missies — probeer deze korte oefening”) | ⚠️ Gedeeltelijk | TaskList en anderen hebben empty state + CTA; BACKLOG vraagt standaardisatie en NL copy. |

**Te doen:**  
- Error-pattern: altijd korte uitleg + één concrete next step.  
- Empty states: overal eenduidige NL copy + micro-task/CTA (zoals in spec).

---

## 13. Insights-pagina (volledige spec)

| Onderdeel | Status | Notities |
|-----------|--------|----------|
| Momentum Score (0–100) + formule | ✅ | `InsightsMomentumHero`, insight engine. |
| Trend direction (↑/→/↓) + microcopy | ✅ | `insightState.trend.direction` + microcopy. |
| Multi-layer graph (XP, focus, energy, streak) | ✅ | `InsightsGraphBlock`. |
| Behavioral patterns (beste dag, heatmap, drop-off, correlatie) | ✅ | `InsightsBehaviorCard`, `InsightsHourHeatmap`, `InsightsDropOffCard`, `InsightsCorrelationCard`. |
| Risk & forecast (level projection, streak risk) | ✅ | `InsightsRiskForecastCard`, coach. |
| Skill distribution / radar | ✅ | `InsightsRadarChart`, domein-breakdown. |
| Coach recommendations (max 3, met actie) | ✅ | `InsightsCoachCard`. |
| Power mode (export CSV, raw data) | ✅ | `PowerUserModeToggle`. |
| Data model (DailyMetrics, MissionEvent, etc.) | ⚠️ | `user_analytics_daily` + migrations (xp_earned, missions_completed, energy_avg, …). `mission_events` in migration; app gebruikt ook `behaviour_log`/tasks. Geen aparte `xp_events`-tabel. |
| Insight engine (momentum, trend, risk, coach) | ✅ | Services/actions voor berekeningen. |

**Te doen (Insights):**  
- Bevestigen dat momentum/trend/risk-formules overeenkomen met je KPI-document.  
- Eventueel `xp_events` of duidelijke XP-log uit user_xp/analytics voor betere historische analyses.

---

## 14. Strategy-pagina (4 lagen)

| Onderdeel | Status | Notities |
|-----------|--------|----------|
| Thesis (core thesis, waarom, deadline, target) | ✅ | `StrategyThesisHero`, `StrategyThesisForm`. |
| Focus (primary + secondary, multipliers) | ✅ | Strategy focus, domains. |
| Weekly allocation sliders | ✅ | `StrategyAllocationSliders`. |
| Alignment (planned vs actual, score) | ✅ | `StrategyAlignmentGraph`, alignment log. |
| Drift detection | ✅ | `StrategyDriftAlertBlock`, `getDriftAlert`. |
| Pressure index | ✅ | `getPressureIndex`, in hero. |
| Opportunity cost simulator (live bij slider) | ⚠️ | Te verifiëren of bij slider-aanpassing live impact (XP shift, deadline) getoond wordt. |
| Phase cycle (Accumulation, Intensification, …) | ⚠️ | In spec; in code controleren. |
| Anti-distraction guard (“Dit verlaagt Alignment”) | ❌ | Doc ANALYSIS_TODAY_CHATS: niet geïmplementeerd bij missie-start buiten primary. |
| Weekly review CTA | ✅ | `StrategyWeeklyReviewCTA`. |
| Strategy archive | ⚠️ | Controleren of afgesloten strategieën met thesis/target/alignment bewaard worden. |

**Te doen (Strategy):**  
- Anti-distraction guard bij start missie buiten primary domein.  
- Opportunity cost live bij allocation-slider; phase indicator in UI als onderdeel van spec.

---

## 15. Missions als performance engine (UMS, modal 3.0, calendar 3.0)

| Onderdeel | Status | Notities |
|-----------|--------|----------|
| Smart Recommendation Hero (UMS-sorting) | ✅ | `SmartRecommendationHero`, decision blocks. |
| Mission detail met strategic preview | ✅ | `TaskDetailsModal`. |
| Add Mission Modal (steps: Intent, Strategic Mapping, Mission DNA, etc.) | ✅ | `AddMissionModal3`; aantal stappen verifiëren tegen spec. |
| Calendar Modal (time budget, strategic distribution, streak protection) | ✅ | `CalendarModal3`. |
| Emotional state check (voor start) | ✅ | `FocusModal` emotional options. |
| Friction alert (similar abandoned missions) | ✅ | `AddMissionModal3` frictionAlert, similarFrictionMessage. |
| Mission chains / campaigns | ⚠️ | In XP/strategy-spec; in code controleren of chains/campaigns volledig gebruikt worden. |

**Te doen:**  
- Add Mission flow naast spec leggen (Intent → Strategic Mapping → Mission DNA → Live Impact → Campaign → Completion).  
- Campaign/chain-UI en -logica consistent maken met spec.

---

## 16. XP Command Center (events, library, validation, Commander mode)

| Onderdeel | Status | Notities |
|-----------|--------|----------|
| XP op events (XPEvent) | ⚠️ | Geen `xp_events`-tabel; XP in `user_xp` (total_xp, level). Berekeningen in `lib/xp.ts`. |
| Mission library (100+ met domeinen) | ⚠️ | Taken zijn user-tasks; geen aparte “mission library” van 100+ templates in code zichtbaar. DCIC/missions in docs. |
| Validation (binary, structured, high stakes) | ⚠️ | Completion via tasks; geen expliciete validationType per missie in UI. |
| Quality multiplier (zonder AI) | ⚠️ | In spec; in xp/analytics-code verifiëren. |
| Velocity, forecast, mastery | ✅/⚠️ | `getXPForecast`, momentum; mastery tiers in spec controleren. |
| Commander mode (advanced metrics) | ✅ | Commander-UI op dashboard/XP. |
| Campaigns & compound bonuses | ⚠️ | In spec; in data/UI controleren. |

**Te doen:**  
- Beslissen: wel/niet `xp_events` voor audit trail en betere analytics.  
- Mission library (templates) en validation levels expliciet in data + UI.  
- Quality multiplier en compound bonuses in code terugvinden of toevoegen.

---

## 17. Data model (samenvatting)

| Model | Status | Opmerking |
|-------|--------|-----------|
| User, level, totalXP, streak | ✅ | users, user_xp, identity/streak in app. |
| DailyMetrics (xp, missions, energy, focus, session) | ✅ | `user_analytics_daily` (migrations 032). |
| MissionEvent (view/start/complete/abandon, durationBeforeStart) | ⚠️ | `mission_events` in migration; app gebruikt ook tasks + `behaviour_log`. |
| XPEvent (per event XP met multipliers) | ❌ | Niet als aparte tabel; alleen totaal in user_xp. |
| Strategy, AlignmentLog, StrategyReview | ✅ | Strategy tables, alignment log, weekly review. |
| Energy/Focus time series | ⚠️ | daily_state per dag; geen fijne time series in code gezien. |

---

## Prioriteiten (aanbevolen volgorde)

1. **Quick wins (dashboard)**  
   - Eén meetbaar doel + single CTA met context (“Voltooi 1 missie voor +120 XP”).  
   - CTA adaptief bij streak (copy + optionele micro-animatie).

2. **Stat rings**  
   - Numerieke labels (percentage + absoluut).  
   - Low-value (<20%) tekst + next steps.

3. **Mascot**  
   - Status-varianten (low energy → “Slaap eerst” tooltip).  
   - SVG/WebP voor dark mode.

4. **Missions**  
   - Filters: Active/Daily/Recommended/New (of equivalent).  
   - In detail-sheet: XP, tijdsduur, benodigde items expliciet.

5. **Growth**  
   - Tooltips op skill nodes (why locked, what to unlock).  
   - Respec/reset.

6. **Notifications**  
   - Toast-systeem + undo voor claim/delete.  
   - Beleid modals vs toasts.

7. **Analytics**  
   - Named events (mission_started, CTA_clicked) + eenvoudig funnel-overzicht.

8. **Accessibility**  
   - Contrast audit (WCAG AA).  
   - Reduced-motion toggle in settings.

9. **Strategy**  
   - Anti-distraction guard.  
   - Opportunity cost live bij sliders.

10. **XP/Data**  
    - Keuze xp_events; mission library + validation levels expliciet; quality/compound in code.

---

*Dit document is gegenereerd door vergelijking van de gepaste prompt-specs met de huidige codebase (routes, components, actions, types, migrations). Voor details per bestand: zie de explore-report en de genoemde component- en actie-bestanden.*
