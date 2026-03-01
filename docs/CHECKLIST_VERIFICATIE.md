# Checklist verificatie — alles uit eindvergelijking gedaan

Na de implementatieronde (SPEC_VS_IMPLEMENTATIE_FINAL.md "Nog open") is onderstaand geïmplementeerd. Gebruik deze checklist om te controleren dat alles werkt.

---

## 1. Zelfcontrole (wat is gedaan)

| # | Item | Status | Waar te controleren |
|---|------|--------|----------------------|
| 1 | **CTA micro-animatie** bij streak at risk | ✅ | `app/globals.css`: `.cta-streak-pulse` + `@keyframes cta-streak-pulse`; uit bij `[data-reduced-motion="true"]`. Dashboard CTA krijgt class wanneer streak at risk. |
| 2 | **Filters Aanbevolen + Nieuw** (missions) | ✅ | `TaskList`: prop `recommendedTaskIds`; filterknoppen "Aanbevolen" en "Nieuw". Tasks-pagina geeft `recommendedTaskIds` uit decisionBlocks (topRecommendation + alignmentFix). "Nieuw" = created_at laatste 7 dagen. |
| 3 | **Mission library** meer templates | ✅ | `lib/mission-templates.ts`: 20 templates (was 12). |
| 4 | **validation_type** op tasks + UI | ✅ | Migratie `041_tasks_validation_type.sql`; `createTask(validation_type)`; AddMissionModal3 stap 4 dropdown (binary/structured/high_stakes); TaskDetailsModal toont validatie in Verwachtingen. |
| 5 | **XP-pagina: 7d/14d toggle + tips** | ✅ | `XPPageContent`: toggle 7d/14d voor grafiek; sectie "Tips om sneller XP te verdienen" met bullets. |
| 6 | **Re-engagement copy** (push/email) | ✅ | `lib/re-engagement-copy.ts`: `getReEngagementBody()`, `getReEngagementPushPayload()`. RecoveryCampaignBanner toont copy; daily cron stuurt re-engagement push (2–7 dagen inactive). |
| 7 | **Funnel dashboard** (view→start→complete) | ✅ | `getFunnelCountsLast7()` in `app/actions/analytics.ts`; Report-pagina: sectie "Funnel (laatste 7 dagen)" met View → Start → Complete. |
| 8 | **Insights: streak als laag** in graph | ✅ | `InsightGraphDay.streak`; getInsightEngineState berekent streak per dag; InsightsGraphBlock toggle "Streak". |
| 9 | **xp_events** tabel + log bij XP | ✅ | Migratie `042_xp_events.sql`; `addXP(points, { source_type, task_id })` schrijft naar xp_events; awardXPForTaskComplete(id, taskId); overige award* gebruiken source_type. |

---

## 2. Checklist voor jou (handmatig verifiëren)

- [ ] **Dashboard:** CTA pulseert subtiel wanneer streak at risk (en stopt bij Instellingen → Reduced motion).
- [ ] **Missions (/tasks):** Filters "Aanbevolen" en "Nieuw" zichtbaar; Aanbevolen toont alleen aanbevolen taken; Nieuw toont taken van laatste 7 dagen.
- [ ] **Add Mission:** Stap 4 toont dropdown "Validatie" (Binary / Gestructureerd / High stakes). Nieuwe missie heeft 20 templates in stap 1.
- [ ] **Task details:** Bij een taak met validatie zie je in "Verwachtingen" de regel Validatie.
- [ ] **XP-pagina:** Grafiek heeft 7d/14d-knoppen; er is een blok "Tips om sneller XP te verdienen".
- [ ] **Recovery Campaign:** Bij inactive dagen zie je de zin "Je mist 70 XP als je morgen niet minstens 1 missie voltooit." (of variant).
- [ ] **Report/Insights:** Sectie "Funnel (laatste 7 dagen)" met View → Start → Complete. In de grafiek "Verloop" is er een laag "Streak".
- [ ] **Database:** Migraties 041 en 042 uitgevoerd (validation_type op tasks, xp_events tabel). Na het voltooien van een taak staat er een rij in xp_events (source_type task_complete).

---

## 3. Wat bewust niet is gedaan

- **News/updates card:** Was al eerder gedaan (NewsUpdatesCard op dashboard); niet dubbel toegevoegd.
- **Mascot sprite-varianten:** Alleen statusbadge (tekst); geen aparte SVG/WebP-sprites.
- **Heatmaps/recordings onboarding:** Niet geïmplementeerd.
- **Weekly review hard afdwingen:** Alleen reminder (StrategyWeeklyReviewCTA).
- **Quality multiplier (wordCount/fieldCompleteness/timeIntegrity):** Niet geïmplementeerd.

---

*Laatste update: na implementatie van alle punten uit "Nog open" (SPEC_VS_IMPLEMENTATIE_FINAL.md).*
