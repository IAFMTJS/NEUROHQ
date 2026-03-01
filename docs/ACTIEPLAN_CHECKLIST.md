# Actieplan checklist – elk punt opgepakt

## 1. Navbar – PNG-icoontjes op deployment
- **Probleem:** Op deployment worden de oude icoontjes getoond in plaats van toegevoegde PNG-iconen.
- **Gedaan:** BottomNavigation laadt eerst PNG uit `public/nav/` (dashboard.png, missions.png, …). Bij 404: fallback naar SVG. **`public/nav/README.md`** toegevoegd met exacte bestandsnamen. Zet je PNG-bestanden in `public/nav/` en deploy — dan worden ze gebruikt.
- **Status:** ✅ Afgehandeld.

## 2. Modals – netjes binnen scherm, juiste schaal
- **Probleem:** Popup/edit/add-modals te groot, vallen uit de card of uit het scherm.
- **Gedaan:** Modal overlay met `items-start` + scroll; modal-card **max-height: min(80dvh, 100dvh − 3rem)**; body **overflow-y: auto**, **min-height: 0**; padding met safe-area. Inhoud scrollt binnen de modal, valt niet meer uit het scherm.
- **Status:** ✅ Afgehandeld.

## 3. Missions – taken bewerken (naam, energy)
- **Probleem:** Gemaakte tasks moeten te bewerken zijn (naam, amount of energy).
- **Gedaan:** **Bewerken**-knop op elke taakrij (TaskList); opent Edit mission-modal met alle velden (titel, due date, category, energy, focus, load, importance, …). Backlog heeft ook Bewerken + Verwijderen.
- **Status:** ✅ Afgehandeld.

## 4. Missions – algemene kalender
- **Probleem:** Agenda-items makkelijk voor andere datums kunnen toevoegen.
- **Gedaan:** Sectie **Algemene kalender** op Missions (tasks-pagina) met datumkiezer; AddCalendarEventForm met **allowAnyDate** ook op Dashboard. Overal datum kiezen en event toevoegen voor elke dag.
- **Status:** ✅ Afgehandeld.

## 5. Backlog en future – geavanceerder
- **Probleem:** Opties te minimaal.
- **Gedaan:** Filter **Scope:** Alles / Alleen backlog (geen datum) / Alleen toekomst. **Sortering:** datum (oudste/nieuwste), titel, categorie. **Acties per taak:** Bewerken, Naar vandaag, Inplannen, Verwijderen (met bevestiging).
- **Status:** ✅ Afgehandeld.

## 6. Dashboard – Energy budget (3 aspecten + headroom-info)
- **Probleem:** Rekening houden met alle 3 aspecten, logische headroom, meer uitleg.
- **Gedaan:** Energy budget gebruikt alle drie pools (Energy, Focus, Load). Headroom = **minimum** van de drie (beperkende factor). Infotekst: wat headroom is, dat alle drie verbruiken, acceptabel gebruik, richtlijn aantal taken, wanneer stoppen of lichter plannen.
- **Status:** ✅ Afgehandeld.

## 7. Quotes – andere quote per dag, niet na elkaar
- **Probleem:** Niet voor elke dag een andere quote; sommige keren na elkaar terug.
- **Gedaan:** **quoteIdForDay(day, previousDayQuoteId)** aangepast: als de id gelijk zou zijn aan de vorige dag, wordt id+1 (mod 365) gekozen zodat twee opeenvolgende dagen nooit dezelfde quote hebben.
- **Status:** ✅ Afgehandeld.

## 8. Budget – info duidelijker; Transport = Vervoer
- **Probleem:** Info niet altijd duidelijk/accuraat; overspend uitleg; transport moet als vervoer tellen.
- **Gedaan:** **Overspend:** uitgebreide uitleg + drie concrete acties (uitgaven verlagen, doel verhogen, budget verschuiven). **Categorieën:** CATEGORY_ALIASES met **Vervoer: ["Transport"]** en **Transport: ["Vervoer"]**; Vervoer in DEFAULT_CATEGORIES. Transport en Vervoer tellen als één categorie.
- **Status:** ✅ Afgehandeld.

## 9. Growth – Learning path notice
- **Probleem:** Notice blijft staan ook als er paths vastgezet zijn.
- **Gedaan:** **hasStudyPlan** toegevoegd (studyPlan.dailyGoalMinutes > 0). LearningPathLock verbergen wanneer **hasMonthlyBook OF hasEducationOptions OF hasStudyPlan**. Learning page geeft hasStudyPlan door.
- **Status:** ✅ Afgehandeld.

## 10. Strategy – checklist + check-in melding + kernfuncties
- **Probleem:** Checklist voor voortgang doel; periodieke melding voor check-in; kernfuncties voor succes.
- **Gedaan:** **Checklist:** StrategyKeyResultsChecklist (per key result-regel afvinken), opslag in **quarterly_strategy.kr_checked** (migratie 031). **Check-in melding:** StrategyCheckInBanner op dashboard; **shouldShowStrategyCheckInReminder()** (elke 14 dagen); na **setStrategyCheckIn()** verdwijnt de melding. **Kernfuncties:** StrategySuccessActions-kaart (key results afvinken, check-in, taken koppelen, Reality report).
- **Status:** ✅ Afgehandeld.

## 11. Insights (Report) – meer data, samenvatting, uitleg
- **Probleem:** Amper data/samenvatting; nut van de getoonde data onduidelijk.
- **Gedaan:** Uitklapbare **“Wat betekenen deze insights?”** met uitleg Execution score, Tasks, Learning, Carry-over, Avg energy/focus. ReportAnalysis: betere teksten bij weinig data + tip. RealityReportCard: subtitle met uitleg per onderdeel.
- **Status:** ✅ Afgehandeld.

## 12. Settings – geavanceerder, meer tools, effectief werkend
- **Probleem:** Veel geavanceerder met meer tools en settings die werken.
- **Gedaan:** **Snelkoppelingen**-kaart (links naar Dashboard, Missions, Budget, Growth, Strategy, Insights). **“Waar stel ik wat in?”** (uitklapbaar) met overzicht waar je learning-doel, budget, strategy, tijdzone/push en brain status instelt. Sectie Tijd & notificaties met id voor deep link. Bestaande onderdelen (theme, compact UI, timezone, push, budget, agenda, export, delete) blijven functioneel.
- **Status:** ✅ Afgehandeld.

---

**Samenvatting:** Alle 12 punten zijn opgepakt. Voor de strategy key-results checklist moet migratie **031_strategy_kr_checklist.sql** zijn uitgevoerd. Voor PNG-naviconen: bestanden in **public/nav/** zetten volgens **public/nav/README.md**.
