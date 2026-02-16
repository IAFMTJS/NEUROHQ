# NEUROHQ — Backlog: 20 New, 20 Enhance, 20 Improve

**Doel:** 20 **nieuwe** dingen (features/capabilities), 20 **enhancements** (bestaande beter maken), 20 **improvements** (fixes, align, polish). Gebaseerd op codebase, schema, VISION en bestaande backlog.

---

## Deel 1: 20 New (nieuwe functies / capabilities)

| # | New | Wat | Bron |
|---|-----|-----|------|
| N1 | **Mood note** | Vrij-tekst "mood note" in daily_state (optioneel veld) voor kwalitatieve context. | VISION B6 |
| N2 | **24h freeze flow (volledig)** | Lijst bevroren items; na 24h: Confirm (log expense) / Cancel; reminder na 24h; "Toevoegen aan spaardoel?" bij cancel. | VISION D1, D3 |
| N3 | **Task templates** | Taak opslaan als template (titel, energy, category, recurrence); quick-add uit template. | VISION A2 |
| N4 | **Focus block (25 min)** | 25-min timer; optioneel calendar block of DND; koppeling aan taak. | VISION A3 |
| N5 | **Bulk acties (taken)** | Selecteer meerdere taken → "Verplaats naar morgen", "Markeer als gedaan", "Verwijder". | VISION A10 |
| N6 | **Recurrence UX** | Duidelijker weekly/monthly preview; "Skip volgende occurrence". | VISION A4 |
| N7 | **Weekly energy summary** | "Energie gebruikt per dag deze week" (uit completed tasks of daily_state). | VISION C6 |
| N8 | **Impulse follow-up** | Na "Add to freeze": 24h reminder; bij confirm log expense; bij cancel optie "Toevoegen aan spaardoel?". | VISION D3 |
| N9 | **Savings round-up** | Optioneel: round-up van entries naar spaardoel (bijv. naar dichtstbijzijnde 5). | VISION D4 |
| N10 | **Execution score (weekly)** | Berekende score in report of dashboard (formule: tasks×0.5 + learning×0.2 + savings×0.2 − carryover×0.1). | VISION J4 |
| N11 | **Monthly report** | Maandagregatie: taken, learning, savings, mood summary. | VISION J6 |
| N12 | **Export report** | Export report (of range) als PDF of CSV. | VISION J7 |
| N13 | **Password change** | In-app "Wachtwoord wijzigen" of link naar Supabase flow. | VISION M7 |
| N14 | **Rate limiting** | Auth en/of API rate limiting; documentatie. | VISION M8 |
| N15 | **Admin / feature flags** | Admin role + RLS waar nodig; feature flags voor calendar, push types, beta. | VISION M9, M10 |
| N16 | **Template-dagen** | "Vandaag als focusdag" → standaard blokken of taken uit template toepassen. | IDEEEN |
| N17 | **Context uit eerdere dagen** | Assistant of rapport: "Wat heb ik gisteren uitgesteld?" / "Laat zien wat ik vorige week niet afkreeg." | IDEEEN |
| N18 | **Quiet hours (push)** | Geen push in door user gedefinieerd venster (bijv. 22:00–08:00). | VISION K9 |
| N19 | **Category presets (budget)** | Voorgedefinieerde categorieën (eten, transport, etc.) + filter in budgetlijst. | VISION D2 |
| N20 | **Book tracking (1/month)** | Huidige boek + voortgang % of "Afgerond"; telt voor 1 boek/maand. | VISION E2 |

---

## Deel 2: 20 Enhance (bestaande beter maken)

| # | Enhance | Wat | Bron |
|---|---------|-----|------|
| E1 | **HIGH_SENSORY minimal UI** | Minder blokken op dashboard, reduced motion, gedempte accent, optioneel monochroom wanneer mode = high_sensory. | VISION B1 |
| E2 | **Mode explanation (first time)** | Bij eerste keer STABILIZE of LOW_ENERGY: korte tooltip/modal ("We hebben je lijst ingeperkt zodat je kunt focussen"). | VISION B2 — ModeExplanationModal bestaat; koppel aan first-time. |
| E3 | **Per-task energy cost** | Toon energy_required (of cost) naast taak in lijst of in TaskDetailsModal. | VISION C4 |
| E4 | **Calendar conflict hint** | Bij taken/agenda: "Je hebt om 14:00 een afspraak; overweeg lichtere taken rond dat tijdstip." | VISION C5 |
| E5 | **30-day pattern insights** | Energy/avoidance/learning trends over 30 dagen in report of pattern card. | VISION J5 |
| E6 | **Clarity sort (education)** | Education options sorteren op clarity; filter "Top 3" of "Alleen actief". | VISION E3 |
| E7 | **Quarter reminder** | Eerste dag van kwartaal: push of in-app: "Stel je thema en identiteit in voor QX." | VISION G3 |
| E8 | **Push per-type toggles** | Instellingen: aparte aan/uit voor quote, avoidance, freeze reminder, learning reminder. | VISION K8 |
| E9 | **HIGH_SENSORY: minder push** | Bij mode high_sensory: geen of minder niet-kritieke push. | VISION K7 |
| E10 | **Skeleton loading** | Waar loading.tsx is: skeleton in lijn met card-simple; geen generieke spinner alleen. | UX — budget/analytics/report/tasks/strategy/settings/learning hebben Skeleton; dashboard ook. |
| E11 | **Empty states overal** | Geen taken, geen events, geen learning, geen budget entries: duidelijke copy + één CTA (assistant of add). | VISION N5 — TaskList, budget page, CalendarEventsList, EducationOptionsList, StrategySummaryCard hebben deels; standaardiseren. |
| E12 | **Toegankelijkheid** | Skip link (bestaat); focus order, aria-labels op assistant, knoppen, modals; contrast check. | VISION N6 |
| E13 | **Foutmeldingen in gewone taal** | Geen technische codes; bv. "Deze taak kon niet worden toegevoegd. Controleer of je nog bent ingelogd." | IDEEEN |
| E14 | **Assistant bevestiging** | Na taak/uitgave/agenda/leren: korte bevestiging + waar het staat ("Staat op vandaag" / "In agenda"). | IDEEEN |
| E15 | **Quote day label** | In QuoteCard: toon dag-nummer (1–365) of "Dag X" naast vorige/volgende. | E7 uitgebreid |
| E16 | **Learning session type in UI** | Learning_type (general, reading, course, podcast, video) zichtbaar in forms en recent sessions / export. | U20 — schema + actions ondersteunen het; UI uitbreiden. |
| E17 | **Budget category filter** | Filter budget entries op category in BudgetEntryList. | VISION D2 |
| E18 | **Push quote time UI** | User kan push_quote_time instellen (Settings of preferences). | VISION H5, U13 |
| E19 | **Reality report link op dashboard** | Korte "Vorige week" summary met link naar /report. | RealityReportBlock bestaat; duidelijker CTA. |
| E20 | **Export pattern** | Export (JSON, CSV, Markdown) overal dezelfde pattern: modal of download, duidelijke bevestiging. | U14 |

---

## Deel 3: 20 Improve (fixes, align, polish)

| # | Improve | Wat | Bron |
|---|---------|-----|------|
| I1 | **daily_state revalidatePath** | Na save daily_state: revalidatePath("/dashboard") (en evt. /report) zodat dashboard niet verouderd is. | Code: daily-state.ts heeft geen revalidatePath. |
| I2 | **Calendar revalidatePath-paden** | calendar.ts revalidatePath("/dashboard/tasks") → waarschijnlijk "/tasks"; controleren en alignen. | Code: calendar.ts 93–94, 120–121. |
| I3 | **LOW_ENERGY-spec** | Documenteer en align: spec "hide energy_required ≥ 4"; code gebruikt ≥ 7. Besluit en implementeer consistent. | VISION, ACTION_PLAN |
| I4 | **STABILIZE-drempel** | Documenteer: alleen carry_over ≥ 5, of ook sensory ≥ 8 (optioneel). Eén duidelijke regel in code + docs. | VISION |
| I5 | **Dashboard-datum TZ** | Toon datum in user timezone; controleer of alle date-strings (daily_state, tasks, calendar) TZ-consistent zijn. | VISION |
| I6 | **TypeScript types** | Database types (Task, DailyState, etc.) in sync met NEUROHQ_DATABASE_SCHEMA; geen `as` casts waar een proper type kan. | NEUROHQ_DATABASE_SCHEMA |
| I7 | **Quote day-id 0/366** | Quote browse (dag 1–365): zorg dat day-id correct is en geen 0/366. | U11 |
| I8 | **RecurringBudgetCard** | Check of recurring entries correct worden gegenereerd en in UI duidelijk zijn. | VISION D6 |
| I9 | **FocusBlock-timer link** | Als FocusBlock een timer heeft: link naar taak of calendar-block duidelijk; gedrag gedocumenteerd. | VISION A3 |
| I10 | **Assistant rate limit UI** | Rate limit in message route; toon in UI ("Te veel berichten, wacht even") en eventueel in docs. | U17 |
| I11 | **learning_sessions schema doc** | NEUROHQ_DATABASE_SCHEMA: learning_sessions heeft topic; learning_type staat in migratie 017 maar niet in schema doc — sync. | Schema vs migrations |
| I12 | **Card-stijlen rest** | Rest van app: waar nog card-modern / card-modern-accent, overweeg card-simple voor consistentie. | UI_DESIGN_VISIE |
| I13 | **Modal focus trap** | Modals: focus trap en focus return bij sluiten; Esc sluit (deels gedaan). | A11y |
| I14 | **Loading consistency** | Alle loading.tsx: zelfde Skeleton-component en card-simple-achtige layout waar mogelijk. | E10 gerelateerd |
| I15 | **Empty state copy NL** | "Geen taken vandaag" vs "No entries yet": één taal (NL) en consistente tone. | TaskList vs budget page |
| I16 | **Error boundary messages** | error.tsx: foutmelding in gewone taal; reset-knop duidelijker. | E19 |
| I17 | **Backlog copy** | BacklogList en AgendaOnlyList: copy "Backlog & future" / "Agenda" in lijn met design. | U9 |
| I18 | **Budget category consistent** | Budget entries: category veld overal gebruikt; geen lege category waar preset zou kunnen. | U19 |
| I19 | **prefers-reduced-motion** | globals.css en key components: .reduce-motion waar nodig; geen sterke animaties bij preference. | A11y |
| I20 | **Tailwind neuro-palette** | Optioneel: als alle componenten var() gebruiken, overweeg neuro-palette in tailwind.config te verminderen of te documenteren als legacy. | Post-U1 cleanup |

---

## Samenvatting

- **20 New:** mood note, 24h freeze flow, task templates, focus block, bulk acties, recurrence UX, weekly energy summary, impulse follow-up, savings round-up, execution score, monthly report, export report, password change, rate limiting, admin/feature flags, template-dagen, context eerdere dagen, quiet hours, category presets, book tracking.
- **20 Enhance:** HIGH_SENSORY minimal UI, mode explanation first-time, per-task energy cost, calendar conflict hint, 30-day patterns, clarity sort, quarter reminder, push toggles, HIGH_SENSORY minder push, skeleton loading, empty states, a11y, foutteksten, assistant bevestiging, quote day label, learning type in UI, budget category filter, push quote time UI, reality report link, export pattern.
- **20 Improve:** daily_state revalidatePath, calendar revalidatePath paden, LOW_ENERGY spec, STABILIZE drempel, dashboard TZ, TypeScript types, quote day 0/366, RecurringBudgetCard, FocusBlock link, assistant rate limit UI, schema doc sync, card-stijlen, modal focus trap, loading consistency, empty state copy NL, error boundary, backlog copy, budget category consistent, prefers-reduced-motion, tailwind neuro cleanup.

**Totaal:** 20 + 20 + 20 = 60 punten. Prioriteit per sectie bepalen (bijv. P1 eerst: I1–I5, E11–E13, N2–N5).

---

## Uitgevoerd (deze sessie)

- **I1**: daily_state: revalidatePath("/dashboard") en revalidatePath("/report") na save; revalidateTag met één argument.
- **I2**: calendar.ts: revalidatePath("/dashboard/tasks") → revalidatePath("/tasks") bij add/delete event.
- **E11**: Empty states: budget (NL + CTA), TaskList (al NL + CTA), EducationOptionsList, StrategySummaryCard, CalendarEventsList (NL copy).
- **E13**: Foutmeldingen in gewone taal: daily-state (NL), createTask (NL), auth (Niet ingelogd).
- **E16**: Learning type in UI: LearningRecentSessions toont learning_type per sessie; edit-form heeft type-dropdown; LEARNING_TYPE_LABELS.
- **E18**: Push quote time: getPushQuoteTime/updatePushQuoteTime in auth; SettingsPush toont time-input; Settings-page haalt en geeft door.
- **N18**: Quiet hours: migratie 024 (push_quiet_hours_start/end); getPushQuietHours/updatePushQuietHours; SettingsPush twee time-inputs; isInQuietHours in timezone.ts; hourly + daily cron respecteren quiet hours.
- **N19**: Budget category presets: BUDGET_CATEGORY_PRESETS (NL) in BudgetEntryList + AddBudgetEntryForm; filter toont presets + bestaande categorieën; "Ongecategoriseerd" i.p.v. "Uncategorised".
