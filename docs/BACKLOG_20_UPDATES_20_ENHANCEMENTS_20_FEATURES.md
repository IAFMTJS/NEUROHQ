# NEUROHQ — Backlog: 20 Updates, 20 Enhancements, 10–20 Nieuwe Functies

**Doel:** Eén overzicht met minimaal 20 dingen om te **updaten** (fix/align), 20 om te **enhancen** (verbeteren), en 10–20 **nieuwe functies**. Gebaseerd op codebase, docs (ACTION_PLAN, VISION_AND_ENHANCEMENT_ROADMAP, IDEEEN_SLIM_UX, ASSISTANT-docs) en schema.

---

## Deel 1: 20 Updates (fixen, alignen, consolideren)

| # | Update | Wat | Bron |
|---|--------|-----|------|
| U1 | **Legacy kleurklassen** | Vervang alle `text-neuro-silver`, `text-neuro-muted`, `neuro-border`, `neuro-surface`, `neuro-dark`, `neuro-blue` door CSS-variabelen (`var(--text-primary)`, `var(--text-muted)`, `var(--card-border)`, etc.) in alle componenten. | grep: 26+ bestanden gebruiken nog neuro-* |
| U2 | **Auth-pagina’s** | Unify text colours naar design tokens; voeg "Wachtwoord vergeten?"-link toe op login. | VISION_AND_ENHANCEMENT_ROADMAP |
| U3 | **LOW_ENERGY-spec** | Documenteer en align: spec zegt "hide energy_required ≥ 4"; code gebruikt mogelijk andere drempel. Besluit en implementeer consistent. | VISION, ACTION_PLAN |
| U4 | **STABILIZE-drempel** | Documenteer: alleen carry_over ≥ 5, of ook sensory ≥ 8 (optioneel). Eén duidelijke regel in code + docs. | VISION |
| U5 | **Dashboard-datum** | Toon datum in user timezone; controleer of alle date-strings (daily_state, tasks, calendar) TZ-consistent zijn. | VISION |
| U6 | **Loading states** | Voeg `loading.tsx` toe waar die ontbreekt (dashboard, budget, learning, strategy, report, analytics, settings). | VISION L7 |
| U7 | **Card-stijlen** | Rest van app: vervang overgebleven `card-modern` / `card-modern-accent` door `card-simple` waar passend (taken, learning, budget, report). | UI_DESIGN_VISIE |
| U8 | **Modal-styling** | Modals (EditMission, Schedule, Confirm, Focus, QuickAdd, YesterdayTasks) gebruiken design tokens; geen hardcoded neuro-* in modals. | Consistente UI |
| U9 | **BacklogList / Agenda** | BacklogList en AgendaOnlyList: card-simple + CSS-variabelen; copy "Backlog & future" / "Agenda" in lijn met design. | Consistente UI |
| U10 | **Error-pagina’s** | `app/error.tsx` en `not-found.tsx`: zelfde tokens, duidelijke NL-tekst, link terug naar dashboard. | UX |
| U11 | **QuoteCard-prev/next** | Quote browse (dag 1–365) is in docs; als UI "vorige/volgende" heeft, zorg dat day-id correct is en geen 0/366. | ASSISTANT, VISION |
| U12 | **RecurringBudgetCard** | Check of recurring entries correct worden gegenereerd en in UI duidelijk zijn (VISION D6). | VISION |
| U13 | **Push quote time UI** | Controleer of user push_quote_time ergens kan instellen (Settings of preferences). | VISION H5 |
| U14 | **Export-knoppen** | Export (JSON, CSV, Markdown) overal dezelfde pattern: modal of download, duidelijke bevestiging. | Consistente UX |
| U15 | **RevalidatePath** | Na elke mutation (task, calendar, budget, learning, daily_state) correcte revalidatePath; geen verouderde data. | Code audit |
| U16 | **TypeScript types** | Database types (Task, DailyState, etc.) in sync met schema; geen `as` casts waar een proper type kan. | NEUROHQ_DATABASE_SCHEMA |
| U17 | **Assistant rate limit** | Rate limit is in message route; documenteer in UI ("Te veel berichten, wacht even") en eventueel in docs. | ASSISTANT |
| U18 | **FocusBlock-timer** | Als FocusBlock een timer heeft: link naar taak of calendar-block duidelijk; gedrag gedocumenteerd. | VISION A3 |
| U19 | **Budget category** | Budget entries: category veld consistent gebruiken; filter in lijst als category wordt gebruikt. | Schema, VISION D2 |
| U20 | **Learning session types** | learning_sessions: learning_type (general, reading, course, podcast, video) overal ondersteund in forms en rapporten. | learning.ts, schema |

---

## Deel 2: 20 Enhancements (verbeteren, robuuster, gebruiksvriendelijker)

| # | Enhancement | Wat | Bron |
|---|-------------|-----|------|
| E1 | **HIGH_SENSORY minimal UI** | Minder blokken op dashboard, reduced motion, gedempte accent, optioneel monochroom wanneer mode = high_sensory. | VISION B1, ACTION_PLAN |
| E2 | **Mode explanation (first time)** | Bij eerste keer STABILIZE of LOW_ENERGY: korte tooltip/modal ("We hebben je lijst ingeperkt zodat je kunt focussen"). | VISION B2, IDEEEN |
| E3 | **"Same as yesterday"** | In BrainStatusCard of daily state: één knop "Zelfde als gisteren" die sliders vult met gisteren. | VISION B3, B4 |
| E4 | **Default daily state** | Pre-fill sliders met gisteren zodat user alleen hoeft aan te passen. | VISION B4 |
| E5 | **Per-task energy cost** | Toon energy_required (of cost) naast taak in lijst of in TaskDetailsModal. | VISION C4 |
| E6 | **Calendar conflict hint** | Bij taken/agenda: "Je hebt om 14:00 een afspraak; overweeg lichtere taken rond dat tijdstip." | VISION C5 |
| E7 | **Quote browse** | In QuoteCard: vorige/volgende dag (1–365) met pijltjes; day label tonen. | VISION H3 |
| E8 | **Execution score** | Wekelijkse formule (tasks×0.5 + learning×0.2 + savings×0.2 − carryover×0.1) in report of dashboard als "Execution score". | VISION J4 |
| E9 | **30-day pattern insights** | Energy/avoidance/learning trends over 30 dagen in report of pattern card. | VISION J5, ACTION_PLAN |
| E10 | **Category presets (budget)** | Voorgedefinieerde categorieën (eten, transport, etc.) + filter in budgetlijst. | VISION D2 |
| E11 | **Book tracking (1/month)** | Monthly book: huidige boek + voortgang % of "Afgerond"; telt voor 1 boek/maand. | VISION E2, ACTION_PLAN |
| E12 | **Clarity sort (education)** | Education options sorteren op clarity; filter "Top 3" of "Alleen actief". | VISION E3 |
| E13 | **Quarter reminder** | Eerste dag van kwartaal: push of in-app: "Stel je thema en identiteit in voor QX." | VISION G3 |
| E14 | **Push per-type toggles** | Instellingen: aparte aan/uit voor quote, avoidance, freeze reminder, learning reminder. | VISION K8 |
| E15 | **HIGH_SENSORY: minder push** | Bij mode high_sensory: geen of minder niet-kritieke push. | VISION K7 |
| E16 | **Skeleton loading** | Waar loading.tsx is: skeleton in lijn met card-simple; geen generieke spinner alleen. | UX |
| E17 | **Empty states overal** | Geen taken, geen events, geen learning, geen budget entries: duidelijke copy + één CTA (assistant of add). | VISION N5, IDEEEN |
| E18 | **Toegankelijkheid** | Skip link, focus order, aria-labels op assistant, knoppen, modals; contrast check. | VISION N6, IDEEEN |
| E19 | **Foutmeldingen in gewone taal** | Geen technische codes; bv. "Deze taak kon niet worden toegevoegd. Controleer of je nog bent ingelogd." | IDEEEN |
| E20 | **Assistant bevestiging** | Na taak/uitgave/agenda/leren: korte bevestiging + waar het staat ("Staat op vandaag" / "In agenda"). | IDEEEN, al deels gedaan |

---

## Deel 3: 10–20 Nieuwe Functies

| # | Nieuwe functie | Wat | Bron |
|---|----------------|-----|------|
| F1 | **Forgot password link** | Op loginpagina link naar "Wachtwoord vergeten?" → bestaande forgot-password flow. | VISION M5 |
| F2 | **24h freeze flow (FrozenPurchaseCard)** | Lijst bevroren items; na 24h: Confirm (log expense) / Cancel; reminder na 24h. | VISION D1, D3 |
| F3 | **Task templates** | Taak opslaan als template (titel, energy, category, recurrence); quick-add uit template. | VISION A2 |
| F4 | **Focus block (25 min)** | 25-min timer; optioneel calendar block of DND; koppeling aan taak. | VISION A3, IDEEEN |
| F5 | **Bulk acties (taken)** | Selecteer meerdere taken → "Verplaats naar morgen", "Markeer als gedaan", "Verwijder". | IDEEEN, VISION A10 |
| F6 | **Recurrence UX** | Duidelijker weekly/monthly preview; "Skip volgende occurrence". | VISION A4 |
| F7 | **Mood note** | Vrij-tekst "mood note" in daily_state (optioneel veld) voor kwalitatieve context. | VISION B6, ACTION_PLAN |
| F8 | **Weekly energy summary** | "Energie gebruikt per dag deze week" (uit completed tasks of daily_state). | VISION C6 |
| F9 | **Impulse follow-up** | Na "Add to freeze": 24h reminder; bij confirm log expense; bij cancel optie "Toevoegen aan spaardoel?". | VISION D3 |
| F10 | **Savings round-up** | Optioneel: round-up van entries naar spaardoel (bijv. naar dichtstbijzijnde 5). | VISION D4 |
| F11 | **Execution score (weekly)** | Berekende score in report of dashboard (formule uit E8). | VISION J4 |
| F12 | **Monthly report** | Maandagregatie: taken, learning, savings, mood summary. | VISION J6 |
| F13 | **Export report** | Export report (of range) als PDF of CSV. | VISION J7 |
| F14 | **Password change** | In-app "Wachtwoord wijzigen" of link naar Supabase flow. | VISION M7 |
| F15 | **Rate limiting** | Auth en/of API rate limiting; documentatie. | VISION M8 |
| F16 | **Admin / feature flags** | Admin role + RLS waar nodig; feature flags voor calendar, push types, beta. | VISION M9, M10 |
| F17 | **Sneltoetsen** | N = nieuwe taak, A = assistant, Esc = sluiten; toon in UI ("N = taak"). | IDEEEN |
| F18 | **Template-dagen** | "Vandaag als focusdag" → standaard blokken of taken uit template toepassen. | IDEEEN |
| F19 | **Context uit eerdere dagen** | Assistant of rapport: "Wat heb ik gisteren uitgesteld?" / "Laat zien wat ik vorige week niet afkreeg." | IDEEEN |
| F20 | **Quiet hours (push)** | Geen push in door user gedefinieerd venster (bijv. 22:00–08:00). | VISION K9 |

---

## Samenvatting

- **20 updates:** vooral legacy kleuren → tokens, spec-alignment (LOW_ENERGY, STABILIZE), loading/empty/error, revalidate, types, export/quote/push-time UI.
- **20 enhancements:** HIGH_SENSORY UI, mode uitleg, same-as-yesterday, energy cost in lijst, calendar hint, quote browse, execution score, 30-day patterns, category presets, book tracking, clarity sort, quarter reminder, push toggles, skeletons, empty states, a11y, foutteksten, assistant bevestiging.
- **20 nieuwe functies:** forgot password link, 24h freeze flow, task templates, focus block, bulk acties, recurrence UX, mood note, weekly energy summary, impulse follow-up, savings round-up, execution score, monthly report, export report, password change, rate limiting, admin/feature flags, sneltoetsen, template-dagen, context eerdere dagen, quiet hours.

**Totaal:** 20 + 20 + 20 = 60 punten (minimum zoals gevraagd). Prioriteit kun je per sectie bepalen (bijv. P1 = U1–U5, E1–E5, F1–F5).

---

## Uitgevoerd (eerste batch)

- **U10**: error.tsx + not-found.tsx: card-simple, CSS vars, NL-tekst ("Er is iets misgegaan", "Pagina niet gevonden", "Naar dashboard").
- **U2 + F1**: Login heeft al "Forgot password?"-link; forgot-password pagina bestaat.
- **U6**: loading.tsx toegevoegd voor analytics; dashboard, tasks, budget, learning, strategy, report, settings, assistant hadden al loading.
- **U7 + U8 + U9**: card-simple + tokens in tasks-pagina, BacklogList, analytics-pagina; Modal, ScheduleModal, TaskList, BacklogList neuro-* → var().
- **E3 + E4**: BrainStatusCard heeft al "Same as yesterday"-knop.
- **E7**: QuoteCard heeft al prev/next browse (‹ ›).
- **F17**: KeyboardShortcuts-component: N = focus quick-add input, A = assistant, Esc = sluit modal of ga naar dashboard; toegevoegd aan dashboard layout; placeholder in QuickAdd vermeldt "N = focus, A = assistant".
- **U1 (deels)**: neuro-* vervangen door var() in error, not-found, TaskList, BacklogList, ScheduleModal, Modal, analytics page. Resterende componenten (ModeBanner, missions modals, settings, budget, learning, etc.) kunnen in een volgende batch.
