# Master: Start-prompt vs implementatie — alles

**Doel:** Volledige, grondige vergelijking van je start-prompt met de codebase: letterlijk, tussen de lijntjes (intent), en implementatie. Zodat je **alles** hebt om op verder te bouwen.

---

## Inhoudsopgave

| Deel | Inhoud |
|------|--------|
| **Deel 1** | Data pipelines — wie schrijft/leest wat; waar het kapot is |
| **Deel 2** | Spec-inventaris per onderdeel (Dashboard, Mascot, Stat Rings, CTA, Missions, Growth, XP, Streaks, Notifications, A11y, Analytics, Error/Empty, Insights, Strategy, Missions engine, XP Command Center, Data model) |
| **Deel 3** | Prioriteiten om op verder te bouwen (P0–P3) |
| **Tussen de lijntjes** | Intent en principes uit je prompt die niet letterlijk in een bullet staan |

---

## Tussen de lijntjes — intent en principes

Deze punten staan niet als losse bullets in je prompt maar volgen uit de toon en structuur; ze zijn belangrijk voor “alles hebben”.

1. **“Wat moet ik nu doen?”** — De hele flow moet naar één duidelijke actie leiden, niet naar een muur van stats. Nu: veel blokken (IdentityBlock, MomentumScore, TodayEngineCard, ActiveMissionCard, …) maar geen **één** antwoord op die vraag. Intent: één startpunt, rest secundair.

2. **Gamification moet voelen als optioneel** — Spec: “keep progression non-obligatory — gamification must feel optional.” In code: geen harde blokkades (geen “zonder review geen nieuwe week”), wel reminders. Intent: druk mag, verplichting niet.

3. **Geen stat zonder actie** — Elke insight moet eindigen met een actie (Optimaliseer, Kies aanbevolen missie, Herstel streak). Coach cards hebben actionLabel/actionHref. Intent: inzichten moeten tot gedrag leiden.

4. **Leesbaarheid boven esthetiek** — Spec voor stat rings: “conform design tokens maar leesbaarheid boven esthetiek.” Nu: alleen percentage in ring. Intent: cijfers en next steps belangrijker dan mooie ring alleen.

5. **Minder verrassingen → meer vertrouwen** — Micro-copy onder CTA die uitlegt wat er gebeurt bij klikken. Nu: geen uitleg onder CTA. Intent: gebruiker weet wat hij krijgt.

6. **Data beats gut feelings** — Spec: “Metrics-first design = betere feature decisions”; “Data beats gut feelings.” Nu: geen funnel-dashboard, geen named events, completion rate uit verkeerde bron. Intent: beslissingen op data, niet op gevoel.

7. **Fouten nuttig maken** — Spec: “Error states: geef direct error + next step (niet alleen amber border).” Intent: elke fout moet zeggen wat er mis is en wat de volgende stap is.

8. **Leeg = kans** — Spec: “Empty states: voeg micro-tasks to encourage action.” Nu: empty state met CTA naar assistant; geen voorgestelde korte oefening. Intent: lege staat is een moment om te sturen, niet om te straffen.

9. **Strategie = 4 lagen (Direction, Allocation, Accountability, Pressure)** — Als één laag ontbreekt, wordt het “een mooi maar leeg scherm.” Nu: thesis, allocation, alignment, drift, pressure, phase, review bestaan; accountability (weekly review afdwingen) is alleen reminder. Intent: alle lagen moeten voelbaar zijn, niet alleen visueel.

10. **Twee systemen (tasks vs DCIC missions)** — De prompt gaat uit van “missies” als één concept; de code heeft **taken** (tasks table, Missions-pagina) en **DCIC missions** (missions table, assistant). Insights en strategy alignment leunen op behaviour_log/missions; task completion schrijft alleen naar task_events/user_xp. Intent: ofwel één geïntegreerd pad (tasks = missions voor XP/alignment/insights), ofwel expliciet twee paden met duidelijke rol.

---

## Deel 1 — Data pipelines (kritiek om eerst te begrijpen)

### 1.1 Wie schrijft waar?

| Bron | Schrijft naar | Wanneer |
|------|----------------|--------|
| **Task completion** (`tasks.ts` → `completeTask`) | `tasks` (completed=true, completed_at), `user_xp` (via `awardXPForTaskComplete` → `addXP`), `task_events` (event_type=complete), `user_analytics_daily` via `upsertDailyAnalytics` | User voltooit taak op Missions-pagina |
| **upsertDailyAnalytics** (`analytics.ts`) | `user_analytics_daily`: **alleen** active_seconds, tasks_completed, tasks_planned, learning_minutes, brain_status_logged, carry_over_count | Na task complete, daily-state save, learning session |
| **DCIC confirmStartMission / confirmCompleteMission** (`dcic/missions.ts`) | `behaviour_log` (mission_id, xp_gained, mission_started_at, mission_completed_at, …), `user_xp` (via saveGameState), `missions` (active/completed) | User start/voltooit via DCIC/assistant pad |
| **logTaskEvent** (`tasks.ts`) | `task_events` (task_id, event_type: view/start/complete/abandon, occurred_at, duration_before_start_seconds, duration_to_complete_seconds) | Task view (TaskDetailsModal), start (FocusModal), complete (completeTask), abandon (close/edit) |

### 1.2 Wie leest waar?

| Consumer | Leest van | Probleem? |
|----------|-----------|-----------|
| **Insight engine** (`dcic/insight-engine.ts`) | `user_analytics_daily` (xp_earned, missions_completed, energy_avg, focus_avg), `behaviour_log` (completion rate), `user_xp`, `user_streak`, `daily_state`, `task_events` (drop-off, correlation, radar, friction, heatmap) | **xp_earned/missions_completed/energy_avg/focus_avg worden nooit geschreven** → grafiek/momentum op 0. Completion rate uit behaviour_log → 0 voor task-only users. |
| **getCompletionRateLast7** (insight-engine) | Alleen `behaviour_log` (mission_started_at, mission_completed_at) | Task completion schrijft niet naar behaviour_log → rate altijd 0 voor task-only users. |
| **Strategy alignment** (`strategyFocus.ts` → getXPByDomain) | **Alleen** `behaviour_log` + `missions` (mission_id → domain) voor XP per domein | **Tasks hebben wel `domain` maar worden niet gebruikt.** Voor task-only users: getXPByDomain = 0 overal → actual = 0.25 per domein (fallback) → alignment niet gebaseerd op echte task-XP. |
| **getBestHourHeatmap, getDropOffPattern, getCorrelationInsights, getStrengthWeaknessRadar, getFriction40Insight** | `task_events` (+ tasks voor domain/cognitive_load) | Deze gebruiken wél task_events → werken voor task completion. |
| **getConsistencyMap** | `user_analytics_daily` (date, xp_earned, missions_completed) — score uit xp + missions | xp_earned/missions_completed = 0 → consistency score zwak. |

### 1.3 Samenvatting datapipeline-gaps

1. **user_analytics_daily:** Kolommen xp_earned, missions_completed, energy_avg, focus_avg bestaan (migratie 032) maar **worden nergens gezet**. Insights (momentum, trend, graph, consistency) leunen daarop → data altijd 0.
2. **Completion rate (Insights):** Gebruikt behaviour_log; task completion schrijft alleen naar task_events → completion rate 0 voor task-only users.
3. **Strategy alignment (planned vs actual):** getXPByDomain gebruikt alleen behaviour_log + missions.domain. **Tasks.domain wordt niet meegenomen.** Dus alignment en drift zijn niet gebaseerd op wat gebruikers op de Missions-pagina doen.

---

## Deel 2 — Spec-inventaris per onderdeel

### 2.1 Dashboard / Home

| # | Spec (letterlijk) | Intent (tussen de lijntjes) | Implementatie | Gap |
|---|-------------------|-----------------------------|---------------|-----|
| 1 | Toon direct één meetbaar doel (weekly/daily mission progress) | Eén duidelijke “wat moet ik nu doen?” met voortgang | Geen single-goal hero. Wel: ActiveMissionCard (vandaag), TodayEngineCard (critical/high impact/growth), IdentityBlock (level, streak, xp to next). CommanderHomeHero: stat rings + CTA “Start Mission”. | Geen **één** meetbaar doel met weekly/daily progress; meerdere blokken naast elkaar. |
| 2 | Single CTA met context (bv. “Voltooi 1 missie voor +120 XP”) | CTA moet concreet maken wat je wint | CTA is vast “Start Mission” (dashboard/page.tsx ~242). Geen XP of context in de copy. | Geen dynamische copy met XP/context. |
| 3 | Personaliseer hero: mascotte reageert op status (low energy → “Slaap eerst”) | Mascotte als feedback op staat, niet alleen decoratie | Mascotte: één PNG per pagina (lib/mascots.ts). Geen status (energy/focus/streak) in beeld of tooltip. | Geen status-afhankelijke mascotte of tooltip. |
| 4 | Lightweight news/updates card (changelogs, events) | Tijdgevoelige info voor gamified verwachting | Geen component of data voor news/changelog/events. | Helemaal ontbreekt. |
| 5 | Primaire CTA adaptief bij streak (copy + micro-animation) | Bij streak: nadruk op behoud; anders op start | CTA niet afhankelijk van streak; geen micro-animatie. | Ontbreekt. |

**Bestanden:** `app/(dashboard)/dashboard/page.tsx`, `components/commander/CommanderHomeHero.tsx`, `components/dashboard/ActiveMissionCard.tsx`, `components/dashboard/TodayEngineCard.tsx`, `components/dashboard/IdentityBlock.tsx`, `lib/mascots.ts`.

---

### 2.2 Mascot / Branding

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Varianten mascotte voor status/achievements (small sprite set) | Herkenning + delight bij andere staat | Eén bestand per pagina in MASCOT_FILE_BY_PAGE; geen status/achievement-varianten. | Geen sprite set voor status/achievements. |
| 2 | Mascotte vectorieel/transparant (SVG/WebP) voor dark mode | Geen harde randen/achtergrond in dark UI | Alleen PNG (getMascotSrcForPage → .png). | Geen SVG/WebP-paden. |

---

### 2.3 Stat Rings / Metrics

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Exacte numerieke labels (percentages + absolute waarden) | Leesbaarheid boven esthetiek | CommanderStatRing: alleen percentage in ring (components/commander/CommanderStatRing.tsx). Geen absolute waarden (bv. 4.5/10). | Geen absolute waarden naast ring. |
| 2 | Low-value alerts (<20%): micro-states + textuele next steps | Bij lage waarde: wat te doen | Geen speciale state of copy voor <20%. | Ontbreekt. |
| 3 | Export/share voor stats (CSV of screenshot) | Power users / coaches | PowerUserModeToggle op Report: export CSV (graph data). Geen export voor hero/stat-rings. | Geen export voor stat-rings. |

---

### 2.4 Primaire CTA (algemeen)

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Variant testing CTA (“Start missie”, “Claim beloning”, “Volgende stap”) | A/B-test wording | Vaste “Start Mission”. Geen varianten of logging. | Geen A/B of varianten. |
| 2 | Micro-copy onder CTA (gevolg van klikken) | Minder verrassing, meer vertrouwen | Geen uitleg onder CTA. | Ontbreekt. |

---

### 2.5 Missions / Mission Grid

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Filters en quick-sort (Active, Daily, Recommended, New) | Snel de juiste soort missie vinden | TaskList: filter all/work/personal/recurring. Geen Active/Daily/Recommended/New. Wel: SmartRecommendationHero + DecisionBlocksRow (streak critical, high pressure, recovery, alignment fix). | Filters anders dan spec; geen Recommended/New als filter. |
| 2 | Mission detail sheet (slide-over): verwachtingen, tijdsduur, XP, benodigde items | Minder drop-off door duidelijke verwachtingen | TaskDetailsModal: strategic preview (XP, alignment, discipline, ROI, pressure, psychology), category, domain, due, energy, mental/social load, notes, subtasks. | Geen geschatte tijdsduur, geen “benodigde items”, geen validation type. |
| 3 | Suggested mission op basis van user state (energy/focus) | Hogere completion | getDecisionBlocks (missions-performance.ts): UMS, streak at risk, pressure, alignment, energy; topRecommendation + tasksSortedByUMS. getTodayEngine: bucketed (critical/high impact/growth). Mode (stabilize/low_energy/driven) stuur getTodaysTasks. | Aanwezig; kan nog verfijnd (expliciet “lage energie → korte missie” in copy). |

**Bestanden:** `app/actions/missions-performance.ts` (getDecisionBlocks, computeUMS), `components/missions/SmartRecommendationHero.tsx`, `components/missions/DecisionBlocksRow.tsx`, `components/missions/TaskDetailsModal.tsx`, `components/TaskList.tsx`.

---

### 2.6 Growth / Skill Tree

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Dependencies expliciet met hover tooltips (why locked, what to unlock) | Geen verwarring over locked nodes | CommanderSkillTree (learning page): 3 nodes (Focus I/II, Deep Focus), unlock op level 1/3/6. Geen tooltips, geen “waarom locked” of “wat te doen”. | Geen tooltips of dependency-uitleg. |
| 2 | Visually connect nodes (dikkere connector bij pre-req met) | Duidelijke dependency-visualisatie | Geen edges tussen nodes; alleen level-drempels. | Geen connector-lijnen. |
| 3 | Respec/reset path voor skills | Minder spijt bij verkeerde keuze | Geen respec of reset. | Ontbreekt. |
| 4 | Micro-transactions/soft currency UI (indien monetization) | Optioneel; cost/benefit + niet verplicht | Niet geïmplementeerd. | N.v.t. tenzij je monetization toevoegt. |

**Bestanden:** `components/commander/CommanderSkillTree.tsx`, `app/(dashboard)/learning/page.tsx`.

---

### 2.7 Progress / XP / Leveling

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Historische XP-grafiek (7/30 dagen) + next-step micro-goals | Momentum zien + heldere volgende stap | XP-pagina: HQChart “XP laatste 14 dagen” (insight engine graphData). WeeklyHeatmap 30d. identity.xp_to_next_level, next_unlock, XPForecastWidget. | Geen aparte 7-dagen view; 14d wel. |
| 2 | Contextuele tips om sneller XP te verdienen | Transparantie over grind | Alleen korte placeholder-tekst; geen echte tips-block. | Geen dedicated tips-component. |
| 3 | XP sitebreed | Overalzelfde beeld van level/voortgang | getXP/getXPIdentity op dashboard, xp, learning, settings. **Niet** op tasks, strategy, report. addXP revalidatePath: geen /report, /strategy. | XP niet op alle pagina’s; report/strategy niet gerevalidate. |

**Bestanden:** `app/(dashboard)/xp/page.tsx`, `components/xp/XPPageContent.tsx`, `app/actions/xp.ts`.

---

### 2.8 Streaks / Retention

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Streak-weergave | Zichtbaar maken van consistentie | IdentityBlock, XP-pagina, Learning (weeks), TodayEngineCard (streak risk), getTodayEngine (streakAtRisk). | Aanwezig. |
| 2 | Streak protection (grace day token, earnable/purchasable) | Minder frustratie, hogere CLTV | streakAtRisk, “Streak Critical” block, Calendar “Add 5-min mission” voor lege dag. Geen **earnable/purchasable** grace-day token. | Geen grace-day token. |
| 3 | Re-engagement (email/push na 2–3 dagen) met concrete benefit | Terugbrengen met duidelijke waarde | RecoveryCampaignBanner (inactive days). Geen “Je mist 120 XP als je morgen niet…” in email/push. | Geen nudge met concrete benefit in push/email. |

---

### 2.9 Notifications / Toasters / Modals

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Modals voor high-value only; toasts voor micro feedback | VISUAL COMPLETION LAYER volgen | Veel modals (TaskDetails, Focus, Calendar, AddMission, QuickAdd, Edit, BrainStatus, …). Eén toast-achtige bar (ServiceWorkerRegistration). Geen algemeen toast-systeem (sonner/react-hot-toast). | Geen beleid modals vs toasts; geen toast-library. |
| 2 | Toasts met undo (claim, delete) | Minder “rage” bij per ongeluk actie | Geen toast-undo. Alleen “This cannot be undone” bij delete. | Ontbreekt. |

---

### 2.10 Accessibility & Dark Mode

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Contrast audit (WCAG AA); geen pure #000; layered grays; lagere saturatie | Geen flikkeren/onleesbaarheid in dark | Commander v2 dark theme. Geen `prefers-contrast` in code; contrast in docs. | Geen systematische contrast-audit in code. |
| 2 | Reduced-motion toggle (zichtbaar, aan/uit) | Respect voor motion sensitivity | `@media (prefers-reduced-motion: reduce)` in globals.css, dark-commander.css, visual-system.css. **Geen UI-toggle** in settings. | Alleen system preference; geen user toggle. |

---

### 2.11 Analytics / Events / Growth

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Events: mission_started, mission_completed, skill_unlocked, CTA_clicked | Metrics-first design | task_events (view/start/complete/abandon). Geen **named** client events (track("mission_completed")). behaviour_log alleen via DCIC. | Geen event-laag met vaste namen voor funnel. |
| 2 | Funnel dashboards | Inzicht in drop-off per stap | Geen apart funnel-dashboard. | Ontbreekt. |
| 3 | Heatmaps/recordings onboarding | Waar dropouts gebeuren | Niet geïmplementeerd. | Ontbreekt. |

---

### 2.12 Error & Empty States

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Error: direct error + next step (niet alleen amber border) | Fouten nuttig maken | Veel componenten hebben error state; niet overal consistente “next step”-tekst. | Geen standaard error + next-step pattern. |
| 2 | Empty states met micro-tasks (“Geen actieve missies — probeer deze korte oefening”) | Leeg = kans | TaskList: “Geen taken vandaag. Zeg tegen de assistant: voeg taak X toe” + link naar assistant. Secties: “No {section} missions today. Add one or move from backlog.” Mix NL/EN. | Empty state copy deels goed; geen micro-task (bv. voorgestelde korte oefening); taal inconsistent. |

**Bestanden:** `components/TaskList.tsx` (404–413, 419–421).

---

### 2.13 Insights-pagina (volledige spec)

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Momentum Score (0–100) + formule | Eén score ipv 5 losse metrics | lib/insight-engine.ts: calculateMomentum (growth 40 + completion 30 + streak 30). dcic/insight-engine: getInsightEngineState → momentum; loadDailyMetrics leest xp_earned (altijd 0). | Formule klopt; **input xp_earned = 0** → momentum verkeerd. |
| 2 | Trend (↑/→/↓) + microcopy | Duidelijk, geen zachte taal | detectTrend; microcopy “Je momentum stijgt met X%” / “Je zakt X% onder je gemiddelde”. | Aanwezig; weer met xp_earned=0. |
| 3 | Multi-layer graph (XP, focus, energy, streak) | Correlatie zien | InsightsGraphBlock: toggle xp/energy/focus. graphData uit loadDailyMetrics (energy/focus uit daily_state merge). Geen streak-laag. | Streak als laag ontbreekt; data xp=0. |
| 4 | Behavioral: beste dag, beste tijdstip, drop-off, correlatie | Actionable insights | InsightsBehaviorCard (bestDayOfWeek), InsightsHourHeatmap (task_events complete per uur), InsightsDropOffCard (task_events), InsightsCorrelationCard (daily_state + task_events), InsightsFriction40Card (view→start), InsightsComparativeCard, InsightsRadarChart. | Logica aanwezig; momentum/trend/graph zwak door xp_earned=0. |
| 5 | Risk & forecast: level projection, streak risk | Voorspelbaarheid | projectLevelDays, calculateStreakRisk; InsightsRiskForecastCard. | Aanwezig; level projection hangt af van xpPerDay (weer xp_earned). |
| 6 | Coach (max 3, met actie) | Geen stat zonder actie | generateCoachRecommendations; InsightsCoachCard met actionLabel/actionHref. | Aanwezig. |
| 7 | Power mode: export CSV, raw data | Power users | PowerUserModeToggle: raw summary + export CSV (graph data). | Aanwezig. |

**Kernprobleem:** Bijna alle Insights-blokken bestaan, maar **xp_earned (en missions_completed, energy_avg, focus_avg) worden nooit gezet** → momentum, trend, graph, consistency en level projection zijn op lege/verkeerde data.

---

### 2.14 Strategy (4 lagen)

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | Thesis (core thesis, waarom, deadline, target) | Geen thesis = geen actieve strategie | strategy_focus (thesis, thesis_why, deadline, target_metric). StrategyThesisHero, StrategyThesisForm. | Aanwezig. |
| 2 | Focus: 1 primary, 2 secondary; multipliers +30%/+10%/-20% | Bewustzijn bij keuzes buiten focus | weekly_allocation, primary_domain, secondary_domains. UMS strategyAlignment (1 / 0.6 / 0.2). | Aanwezig. |
| 3 | Weekly allocation sliders (100 Focus Points) | Geplande distributie | StrategyAllocationSliders; updateWeeklyAllocation → strategy_focus.weekly_allocation. | Aanwezig. |
| 4 | Alignment (planned vs actual); alignment_log | Confronterend maar clean | computeAndUpsertAlignment; getXPByDomain **alleen behaviour_log + missions**. actual = 0.25 per domein als totalXP=0. Alignment graph, getAlignmentThisWeek, getAlignmentLog. | **Actual komt niet van tasks** → alignment voor task-only users niet gebaseerd op echte XP. |
| 5 | Drift (3 dagen actual ≠ planned) | Waarschuwing zonder drama | getDriftAlert (strategyFocus.ts); StrategyDriftAlertBlock. Gebruikt getXPByDomain → zelfde probleem als alignment. | Logica ok; data voor tasks ontbreekt. |
| 6 | Pressure index (target/days × momentum) | Gezond vs risk zone | getPressureIndex; zones comfort/healthy/risk; StrategyThesisHero. | Aanwezig. |
| 7 | Opportunity cost (live bij slider: XP shift, deadline impact) | Mensen zien wat ze opgeven | StrategyAllocationSliders: bij wijziging “Meer focus op X (+n%), ten koste van Y (−n%)”. Geen **XP-shift of deadline-impact** in cijfers. | Alleen kwalitatief; geen XP/deadline-simulator. |
| 8 | Phase cycle (Accumulation, Intensification, Optimization, Stabilization) | Periodiek systeem | strategy_focus.phase; StrategyPhaseIndicator. Geen automatische overgang. | Aanwezig; fase niet automatisch. |
| 9 | Anti-distraction guard (“Dit verlaagt Alignment”) | Geen verbod, wel bewustzijn | FocusModal: “Dit verlaagt je Alignment Score (missie buiten je focus)” wanneer task domain buiten primary/secondary. | Aanwezig. |
| 10 | Weekly review CTA | Strategie vereist onderhoud | StrategyWeeklyReviewCTA; upsertStrategyReview. Geen **blokkade** van nieuwe week bij geen review. | Alleen reminder; niet afdwingend. |
| 11 | Strategy archive (thesis, target gehaald?, alignment, fout/succes) | Meta-leren | getPastStrategyFocus; StrategyArchiveHistory toont thesis, end_date, target_metric. **Niet:** target gehaald?, gemiddelde alignment, grootste fout/succes. | Archive toont niet “target met?” of alignment/fout/succes. |

**Bestanden:** `app/actions/strategyFocus.ts`, `components/strategy/*`, `app/(dashboard)/strategy/page.tsx`.

---

### 2.15 Missions als performance engine (UMS, modals, calendar)

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | UMS-sorting + decision blocks (streak critical, high pressure, recovery, alignment fix) | Pagina reageert op staat | getDecisionBlocks: UMS = 0.3*strategyAlignment + 0.2*completionProbability + 0.2*roi + 0.15*energyMatch + 0.15*pressureImpact. tasksSortedByUMS, topRecommendation, streakCritical, highPressure, recovery, alignmentFix. completionProbability uit **task_events**. | Aanwezig. |
| 2 | Add Mission Modal: Intent, Strategic Mapping, DNA, Live Impact, Campaign, Completion | Missies als investeringen | AddMissionModal3: 6 stappen. Live Impact: XP, discipline, alignment, energy. **Geen** deadline shift, pressure impact. Campaign: standalone/chain/new **niet** opgeslagen (createTask kent geen campaign_id). Geen estimated time, geen required items. | Deadline/pressure in Live Impact ontbreekt; campaign niet persistent; geen estimated time/items. |
| 3 | Friction alert (similar abandoned) | Bewustzijn, niet blokkeren | getSimilarTasksCompletionRate (task_events); similarFrictionMessage in step 6. | Aanwezig. |
| 4 | Calendar 3.0: time budget, strategic distribution, pressure overlay, streak protection, auto-scheduler | Strategische weekplanner | CalendarModal3: time budget per dag, overload, pressure overlay, “Add 5-min mission” lege dag, distribution warning. getAutoScheduleSuggestions. | Deels; strategic distribution (% per domein per week) en auto-scheduler UX kunnen strakker. |
| 5 | Emotional state check (voor start) | Correlaties later | FocusModal: emotional options (Gefocust, Moe, …). | Aanwezig. |

**Bestanden:** `app/actions/missions-performance.ts`, `components/missions/AddMissionModal3.tsx`, `components/missions/CalendarModal3.tsx`, `components/missions/FocusModal.tsx`.

---

### 2.16 XP Command Center / Mission library

| # | Spec | Intent | Implementatie | Gap |
|---|------|--------|---------------|-----|
| 1 | XPEvent per transactie (sourceType, multipliers, finalXP) | Audit trail + analytics | Geen xp_events-tabel. Alleen user_xp.total_xp; XP bij complete via awardXPForTaskComplete → addXP (vast bedrag + alignment/anti-grind). | Geen event-level XP-log. |
| 2 | Mission library (100+): Discipline 25, Learning 20, Health 20, etc. | Kiezen uit vaste set | Geen library. Tasks: user-created via AddMissionModal3 (vrije titel). DCIC missions: per-user rijen (limit 20), geen gedeelde template-set. | **Mission library ontbreekt.** |
| 3 | Validation (binary, structured, high_stakes) | Risico-niveau per missie | Geen validationType op tasks of in UI. | Ontbreekt. |
| 4 | Quality multiplier (zonder AI) | Kwaliteit van completion | XP is vast (awardXPForTaskComplete) + alignment/anti-grind. Geen wordCount/fieldCompleteness/timeIntegrity. | Niet geïmplementeerd. |
| 5 | Velocity, forecast, mastery | Voorspelbaarheid + niveau | getXPForecast (dcic/xp-forecast); levelFromTotalXP, xpToNextLevel. Geen expliciete “mastery tiers” per domein in UI. | Forecast/velocity wel; mastery tiers niet in UI. |
| 6 | Commander mode (advanced metrics) | Progressive disclosure | Commander-UI op dashboard/XP; Power User op Report. | Aanwezig. |
| 7 | Campaigns & compound bonuses | Exponentiële motivatie | mission-chains: checkChainCompletionOnTaskComplete; createTask kent geen campaign_id. Campaign in AddMissionModal alleen UI. | Chains deels; campaign niet persistent. |

---

### 2.17 Data model (wat de spec noemt vs wat er is)

| Spec model | In codebase | Opmerking |
|------------|-------------|-----------|
| User (id, level, totalXP, streak, …) | users + user_xp + user_streak | level uit totalXP berekend. |
| DailyMetrics (date, xpEarned, missionsCompleted, energyAverage, focusAverage, sessionCount, totalSessionTime) | user_analytics_daily (kolommen na 032) | **xp_earned, missions_completed, energy_avg, focus_avg, session_count, total_session_time** niet gevuld door upsertDailyAnalytics. |
| MissionEvent (view/start/complete/abandon, durationBeforeStart, …) | task_events (task_id, event_type, occurred_at, duration_before_start_seconds, duration_to_complete_seconds) | mission_id in spec = task_id in DB voor tasks. behaviour_log heeft mission_id (DCIC). |
| XPEvent (per event met multipliers) | Geen tabel | Alleen total_xp. |
| Strategy, AlignmentLog, StrategyReview | strategy_focus, alignment_log, strategy_review | Aanwezig. actual_distribution uit getXPByDomain (alleen behaviour_log+missions). |
| Energy/Focus time series | daily_state (per dag); geen fijne time series | Optioneel voor correlatie. |

---

## Deel 3 — Prioriteiten om op verder te bouwen

### P0 — Data en integriteit (zonder dit klopt de rest niet)

1. **user_analytics_daily vullen**  
   In `upsertDailyAnalytics()` (analytics.ts):  
   - `missions_completed` = aantal voltooide tasks die dag.  
   - `xp_earned` = afgeleid (bijv. per task completion XP loggen in een tabel of via bestaande regel: completed count × gemiddelde XP, of XP per completion ergens opslaan).  
   - `energy_avg` / `focus_avg` = uit daily_state voor die dag (indien aanwezig).  
   Optioneel: session_count / total_session_time als je die wilt gebruiken.

2. **Completion rate voor task-users**  
   `getCompletionRateLast7` (insight-engine): gebruik **task_events** (start/complete) voor task-based completion rate, naast of in plaats van behaviour_log voor DCIC.

3. **Strategy alignment op tasks**  
   `getXPByDomain` uitbreiden (of alternatief): XP per domein ook uit **tasks** halen (tasks.domain, completed_at op datum, gekoppeld aan XP-toekenning). Zodat alignment en drift voor task-only users op echte data zijn gebaseerd.

### P1 — UX en zichtbaarheid

4. **XP sitebreed**  
   getXP() of XP-badge op Tasks-, Strategy-, Report-pagina; revalidatePath("/report", "/strategy") in addXP (en evt. andere XP-mutaties).

5. **Eén meetbaar doel + CTA met context**  
   Dashboard: één duidelijke “wat nu”-doel (bijv. eerste incomplete + weekly/daily progress) + CTA met context (“Voltooi 1 missie voor +X XP”) en optioneel adaptief bij streak.

6. **Insights leesbaar maken**  
   Zodra xp_earned/missions_completed (en evt. energy_avg/focus_avg) worden gevuld, kloppen momentum, trend, graph en consistency; geen extra UI-change nodig behalve eventueel copy bij 0-data.

### P2 — Missions en modals

7. **Mission library**  
   Keuze: óf 100+ templates (seed + template-picker in Add Mission) met baseXP/estimatedTime/validationType, óf spec bijwerken naar “alleen vrije taken”.

8. **AddMissionModal3**  
   Live Impact: deadline shift + pressure impact. Campaign/chain: persistent maken (campaign_id op task) of uit UI halen. Optioneel: estimated time, required items.

9. **TaskDetailsModal**  
   Geschatte tijdsduur, benodigde items (indien velden bestaan), evt. validation type tonen.

### P3 — Rest van de spec

10. Stat rings: absolute waarden, low-value next steps, export.  
11. Mascotte: status-varianten, SVG/WebP.  
12. CTA: varianten, A/B, micro-copy.  
13. Filters missions: Active/Daily/Recommended/New (of duidelijke mapping).  
14. Skill tree: tooltips, connectors, respec.  
15. Streaks: grace-day token, re-engagement copy in push/email.  
16. Toasts + undo; beleid modals vs toasts.  
17. A11y: contrast-audit, reduced-motion toggle.  
18. Analytics: named events, funnel-dashboard.  
19. Strategy: opportunity cost in cijfers, archive (target met?, alignment, fout/succes), evt. weekly review afdwingen.  
20. Error/empty: standaard error+next-step, empty state met micro-task, consistente NL.

---

*Dit document dekt de start-prompt tegen de huidige codebase: data pipelines, per-onderdeel spec vs implementatie vs intent, en een prioriteitenlijst om op verder te bouwen. Voor exacte regels: zie de genoemde bestanden.*
