# Start-prompt vs implementatie — eindvergelijking

**Bronnen:** `NEUROHQ_ULTRA_MASTER_SPEC.md` (secties 1–19), Commander/DCIC-spec uit `SPEC_VS_IMPLEMENTATIE_MASTER.md`.  
**Doel:** Eén keer de site vergelijken met de start-prompt na de implementatieronde. Status: wat is gedaan, wat is deels gedaan, wat ontbreekt.

---

## 1. Data pipelines — status

| Onderdeel | Spec / probleem | Huidige status |
|-----------|------------------|----------------|
| **user_analytics_daily** | xp_earned, missions_completed, energy_avg, focus_avg moeten gevuld worden | ✅ `recordDailyXPAndMissions(date, xpAmount)` bij task complete; `upsertDailyAnalytics` leest bestaande xp_earned/missions_completed en vult energy_avg/focus_avg uit daily_state. |
| **Completion rate task-users** | getCompletionRateLast7 moest task_events gebruiken | ✅ Eerst task_events (start/complete); fallback behaviour_log. |
| **Strategy alignment op tasks** | getXPByDomain moest ook tasks meenemen | ✅ getXPByDomain haalt voltooide tasks (domain + impact), schat XP per task, telt per domein; behaviour_log + missions erbij. |
| **XP revalidate** | addXP/deductXP moesten report/strategy revalideren | ✅ revalidatePath("/report"), revalidatePath("/strategy") in addXP/deductXP. |

---

## 2. Dashboard / Home (start-prompt: één doel, CTA, mascotte)

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| 1 | Eén meetbaar doel (weekly/daily mission progress) | ✅ | singleGoalLabel: eerste incomplete taak of "Behoud je streak — voltooi 1 missie vandaag"; CommanderHomeHero toont dit. |
| 2 | Single CTA met context (bv. "+120 XP") | ✅ | missionLabel dynamisch: streak / "Voltooi 1 missie voor +X XP" / "Start missie" / "Volgende stap" / "Claim +X XP" (CTA-varianten). |
| 3 | Mascotte reageert op status (low energy → "Slaap eerst") | ✅ | Statusbadge onder mascot: "Slaap of rust eerst" (energy &lt;20%), "Neem een korte pauze" (focus &lt;20%), "Streak in gevaar". data-energy-low / data-focus-low / data-streak-at-risk. |
| 4 | Lightweight news/updates card (changelogs, events) | ❌ | Geen component of data. |
| 5 | CTA adaptief bij streak + micro-animation | ⚠️ | Copy adaptief bij streak; geen micro-animatie. |

---

## 3. Mascot / Stat rings / CTA

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Mascot status-varianten | Small sprite set, SVG/WebP | ⚠️ | Statusbadge (tekst) i.p.v. aparte sprites; nog PNG, geen SVG/WebP-paden. |
| Stat rings: absolute waarden + low-value next steps | Leesbaarheid boven esthetiek | ✅ | X/10 onder ring; bij &lt;20% hint (energy/focus/load). |
| Stat rings: export | CSV of screenshot | ✅ | StatRingsExport: Kopieer stats / Download CSV op dashboard. |
| CTA-varianten | "Start missie", "Claim beloning", "Volgende stap" | ✅ | ctaVariants op dashboard; CTA_clicked getrackt. |
| Micro-copy onder CTA | Gevolg van klikken | ✅ | missionSubtext ("Ga naar je missies…" / "Praat met de assistant…"). |

---

## 4. Missions / Mission Grid

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Filters (Active, Daily, Recommended, New) | Snel de juiste soort vinden | ⚠️ | Alles, Actief (incomplete), Werk, Persoonlijk, Terugkerend (NL). Geen "Recommended"/"New" als aparte filter. |
| Mission detail: verwachtingen, tijdsduur, XP, benodigde items | Minder drop-off | ✅ | TaskDetailsModal: sectie "Verwachtingen" met geschatte tijd (~X min) + verwachte XP; strategic preview apart. Geen "benodigde items" (veld ontbreekt). |
| Suggested mission op basis van state | Hogere completion | ✅ | getDecisionBlocks, UMS, topRecommendation, streak critical, recovery, alignment fix. |
| Mission library (templates) | Kiezen uit set | ⚠️ | 12 templates in AddMissionModal3 stap 1 (optioneel); geen 100+ of validationType. |
| Campaign/chain persistent | mission_chain_id op task | ✅ | createTask(mission_chain_id); AddMissionModal3: Bestaande keten / Nieuwe keten + addStepToChain. |

---

## 5. Add Mission Modal / Calendar

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Live Impact: deadline, pressure, estimated time | Duidelijkheid | ✅ | Stap 4: geschatte tijd (~X min), deadline als dueDate; template picker stap 1. |
| Calendar: strategic distribution + auto-scheduler | Weekplanner | ✅ | CalendarModal3: copy "Spreid zware dagen…", "Verspreidt taken…"; auto-scheduler met toepassen. |

---

## 6. Growth / Skill Tree

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Tooltips (why locked, what to unlock) | Geen verwarring | ✅ | CommanderSkillTree: tooltipText per skill; learning page vult tooltipText voor locked nodes. |
| Visually connect nodes (dikkere connector) | Dependency-visualisatie | ✅ | .skill-connector 4px, border-radius, glow bij unlocked. |
| Respec/reset path | Minder spijt | ✅ | SkillTreeRespec-knop op learning; resetSkillsForUser() (placeholder revalidate). |

---

## 7. XP / Progress

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| XP sitebreed | Overalzelfde beeld | ✅ | getXP() + XPBadge op tasks, strategy, report; revalidate report/strategy bij addXP/deductXP. |
| Historische XP-grafiek (7/30 dagen) | Momentum | ⚠️ | 14d view; geen aparte 7d. |
| Contextuele tips (sneller XP) | Transparantie | ⚠️ | Geen dedicated tips-block. |

---

## 8. Streaks / Retention

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Streak-weergave | Consistentie | ✅ | IdentityBlock, TodayEngineCard (streakAtRisk), getTodayEngine. |
| Grace-day token (freeze) | Minder frustratie | ✅ | StreakFreezeBanner op dashboard bij streakAtRisk + streakFreezeTokens &gt; 0; knop "Gebruik freeze token" (useFreezeToken). accountability_settings.streak_freeze_tokens. |
| Re-engagement (email/push met benefit) | Terugbrengen | ❌ | Geen "Je mist X XP…" in push/email. |

---

## 9. Notifications / Toasts / Modals

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Toasts voor micro feedback | VISUAL COMPLETION LAYER | ✅ | Sonner: Toaster in layout; complete + delete gebruiken toasts. |
| Toasts met undo (claim, delete) | Minder rage | ✅ | "Mission voltooid" + Ongedaan maken (uncompleteTask); "Mission verwijderd" + Ongedaan maken (restoreTask). Soft-delete (tasks.deleted_at) + restoreTask. |

---

## 10. A11y / Contrast

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Contrast (WCAG AA); geen pure #000 | Geen flikkeren | ✅ | --bg-primary: #050810; docs/A11Y_CONTRAST_CHECKLIST.md. |
| Reduced-motion toggle (zichtbaar) | Motion sensitivity | ✅ | user_preferences.reduced_motion; SettingsReducedMotion in Weergave; data-reduced-motion op document; CSS [data-reduced-motion="true"]. |

---

## 11. Analytics / Events

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Named events (mission_completed, CTA_clicked) | Metrics-first | ✅ | analytics_events-tabel; trackEvent(name, payload); mission_completed bij complete; CTA_clicked via ClientCTALink. |
| Funnel dashboards | Drop-off per stap | ❌ | Geen apart funnel-dashboard. |
| Heatmaps/recordings onboarding | Waar dropouts | ❌ | Niet geïmplementeerd. |

---

## 12. Error / Empty States

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Error: direct error + next step | Fouten nuttig | ✅ | ErrorWithNextStep-component; TaskList add-error gebruikt die (message + next step + link Naar assistant). |
| Empty states met micro-task, NL | Leeg = kans | ✅ | TaskList: "Geen taken vandaag" + "Probeer een korte oefening van 5 min…" + Naar assistant / voeg hieronder toe; secties NL ("Geen werk missies…"). |

---

## 13. Strategy (4 lagen)

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Thesis, allocation, alignment, drift, pressure, phase | Alle lagen | ✅ | strategy_focus, alignment_log, getXPByDomain (incl. tasks), getDriftAlert, getPressureIndex, StrategyPhaseIndicator. |
| Opportunity cost in cijfers | Mensen zien wat ze opgeven | ✅ | StrategyAlignmentGraph: "Opportunity cost: bij 100% alignment zou je ~X% meer focus…" (bij scorePct &lt; 100). |
| Archive met reden (target met?, alignment, fout/succes) | Meta-leren | ✅ | strategy_focus.archive_reason, archive_reason_note; StrategyArchiveCTA (Target gehaald, Alignment ok, Alignment verloren, Anders + notitie); StrategyArchiveHistory toont reason + note. |
| Weekly review afdwingen | Accountability | ⚠️ | StrategyWeeklyReviewCTA reminder; geen harde blokkade. |

---

## 14. Insights-pagina

| # | Spec | Status | Opmerking |
|---|------|--------|-----------|
| Momentum, trend, graph, consistency | Data-driven | ✅ | xp_earned/missions_completed/energy_avg/focus_avg nu gevuld; loadDailyMetrics leest ze; momentum/trend/graph/consistency kunnen kloppen. |
| Behavioral (beste dag, drop-off, correlatie) | Actionable | ✅ | Insights blokken bestaan; task_events + daily_state. |
| Coach (max 3, met actie) | Geen stat zonder actie | ✅ | generateCoachRecommendations; actionLabel/actionHref. |
| Power mode: export CSV | Power users | ✅ | PowerUserModeToggle, export CSV. |
| Streak als laag in graph | Correlatie | ⚠️ | Geen streak-laag in graph; rest aanwezig. |

---

## 15. Ultra Master Spec — kern (secties 1–19)

| Sectie | Spec | Status | Opmerking |
|--------|------|--------|-----------|
| 1–2 | Filosofie, pijlers | — | Geen directe "implementatiecheck"; gedragen door features. |
| 3 | Database (users, daily_state, tasks, …) | ✅ | Tabellen aanwezig; o.a. user_analytics_daily, task_events, strategy_focus, alignment_log, analytics_events, user_preferences (reduced_motion), tasks (deleted_at, mission_chain_id). |
| 4 | Task engine (impact, urgency, energy, carry_over, rollover) | ✅ | tasks.ts, rollover, getTodaysTasks met mode (low_energy, stabilize, driven). |
| 5 | Mood adaptive (energy, focus, sensory_load, LOW/HIGH SENSORY/DRIVEN/STABILIZE) | ✅ | getMode, getTodaysTasks(mode), ModeBanner, Stabilize. |
| 6 | Energy budget (capacity 100, task cost, remaining) | ✅ | getEnergyBudget, energy cap, overload. |
| 7 | Financial (savings, impulse, freeze) | ✅ | savings_goals, budget, impulse flow. |
| 8 | Learning (weekly target, streak, completion) | ✅ | getWeeklyMinutes, getLearningStreak, LearningProgress. |
| 9 | Education decision (Clarity Score) | ✅ | education_options, ClarityExplain. |
| 10 | Quarterly strategy (archive, reset) | ✅ | strategy_focus, getPastStrategyFocus, archive met reason. |
| 11 | Philosophy (quotes 1–365, push) | ✅ | getQuoteForDay, push. |
| 12 | Calendar (Google OAuth, conflict rule) | ✅ | hasGoogleCalendarToken, getUpcomingCalendarEvents. |
| 13 | Execution score (weekly) | ✅ | getRealityReport, week summary. |
| 14 | Pattern intelligence (30d) | ✅ | Insights, getMetaInsights30, rapporten. |
| 15 | Push (quote, avoidance, learning, savings, shutdown) | ✅ | Push settings, limit. |
| 16 | PWA (Service Worker, manifest, IndexedDB) | ✅ | ServiceWorkerRegistration, manifest, offline queue. |
| 17–19 | Deploy, feature flags, security | ⚠️ | Cron/feature flags/backups: zie projectconfig. |

---

## 16. Samenvatting: wat ontbreekt of is deels

**Nog open / optioneel:**

- **News/updates card** op dashboard (changelogs, events).
- **CTA micro-animatie** bij streak (alleen copy gedaan).
- **Mascotte:** echte sprite-varianten of SVG/WebP (nu statusbadge tekst).
- **Filters missions:** "Recommended"/"New" als aparte filter (nu Alles/Actief/Werk/Persoonlijk/Terugkerend).
- **Mission library:** uitbreiden naar meer templates of validationType; nu 12 templates.
- **XP:** aparte 7-dagen view, dedicated tips-block.
- **Re-engagement:** copy in push/email ("Je mist X XP…").
- **Funnel dashboard:** aparte pagina voor funnel/drop-off.
- **Heatmaps/recordings** onboarding.
- **Strategy:** weekly review hard afdwingen (nu reminder).
- **Insights:** streak als laag in multi-layer graph.
- **XPEvent per transactie** (event-level XP-log): nog alleen total_xp; geen xp_events-tabel.
- **Quality multiplier** (wordCount/fieldCompleteness/timeIntegrity): niet geïmplementeerd.
- **Validation type** (binary/structured/high_stakes) op missies: niet in UI/DB.

**Gedaan in deze ronde (relevant voor start-prompt):**

- Data: user_analytics_daily (xp_earned, missions_completed, energy_avg, focus_avg), completion rate uit task_events, strategy alignment op tasks, XP revalidate.
- UX: één meetbaar doel + CTA met context + varianten, micro-copy onder CTA, mascotte statusbadge, stat rings (absolute + low-value + export), XP sitebreed.
- Missions: TaskDetailsModal geschatte tijd, AddMissionModal3 estimated time + deadline, mission_chain_id + chain/new, template picker (12 templates), filters NL + Actief, CalendarModal3 copy.
- Growth: skill tree tooltips, dikkere connectors, respec-knop.
- Streaks: StreakFreezeBanner (grace-day token).
- Toasts: sonner, undo bij complete en delete (soft-delete + restore).
- A11y: reduced-motion toggle, contrast (#050810), A11Y_CONTRAST_CHECKLIST.
- Analytics: analytics_events, trackEvent, mission_completed + CTA_clicked.
- Strategy: opportunity cost copy, archive met reason + note, StrategyArchiveCTA.
- Error/empty: ErrorWithNextStep, empty state NL + micro-task.

---

*Eindvergelijking: start-prompt (Ultra Master Spec + Commander/DCIC-spec) vs huidige codebase. Voor details: zie genoemde bestanden en SPEC_VS_IMPLEMENTATIE_MASTER.md.*
