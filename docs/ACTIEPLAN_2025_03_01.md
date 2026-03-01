# Actieplan NEUROHQ – 1 maart 2025

Actieplan op basis van 10 punten. Per punt: doel, relevante code, en concrete stappen.

---

## 1. Zelfde automissions 3–4 dagen achter elkaar

**Probleem:** Het systeem toont 2 dezelfde missies meerdere dagen achter elkaar ondanks veel automissions.

**Relevante code:**
- `app/actions/missions-performance.ts`: `getDecisionBlocks` → `tasksSortedByUMS` (sortering op UMS)
- Geen expliciete “diversity”-logica; volgorde is puur op score

**Acties:**
1. **Recently-shown tracking:** In `getDecisionBlocks` (of in de laag die de “aanbevolen”/top missies kiest) recent getoonde/gecomplete missies meenemen (bijv. laatste 2–3 dagen uit `task_events` of completion history).
2. **Diversity penalty:** Voor tasks die in die recente set zitten: UMS-penalty toepassen (bijv. -0.2) of tijdelijk uitsluiten van top-aanbeveling.
3. **Rotatie:** Optioneel: expliciet roteren op domein/category zodat niet twee dagen achter elkaar dezelfde “type” missie als #1 staat.

**Prioriteit:** Hoog (directe UX-impact).

---

## 2. Mascottes te dof / grain-overlay gevoel – zo scherp als budgetpagina

**Probleem:** Mascottes op andere pagina’s zien er dof uit (grain-achtig); budgetpagina-mascot wel scherp.

**Relevante code:**
- Budget: `HeroMascotImage` in `mascot-hero-inner` (alleen drop-shadow, geen overlay) – `app/(dashboard)/budget/page.tsx` (rond regel 443).
- Overige pagina’s: `MascotImg` in `mascot-hero mascot-hero-top` – `app/globals.css` (o.a. 842–918): `.mascot-hero::before` (radial gradient), `.mascot-hero::after` (blur gradient).

**Acties:**
1. **Scherpe variant:** Op alle pagina’s met mascot dezelfde aanpak als budget gebruiken:
   - `HeroMascotImage` + wrapper `mascot-hero-inner` (of een nieuwe class zoals `mascot-hero-sharp` zonder `::before`/`::after`).
2. **Of:** Bestaande `.mascot-hero` aanpassen: `::before` en `::after` verwijderen of sterk afzwakken, en overal waar nu `MascotImg` staat overschakelen naar `HeroMascotImage` met dezelfde `page`-prop (zie `lib/mascots.ts` voor page → file mapping).
3. **Consistentie:** Eén component (bijv. altijd `HeroMascotImage` met `page`) voor alle paginamascottes, zodat styling één keer in CSS staat.

**Prioriteit:** Medium (visueel).

---

## 3. Budget: Daily Control Missions – worden ze geteld en krijgt men XP? (geen leugens)

**Probleem:** Gebruiker kan de checkbox gewoon aanvinken; systeem geeft dan XP zonder te controleren of de missie echt volbracht is.

**Relevante code:**
- `components/budget/DailyControlMissionsCard.tsx`: roept `recordBudgetDisciplineMission({ mission: key })` bij toggle.
- `app/actions/missions-performance.ts`: `recordBudgetDisciplineMission` geeft direct XP + streak-update, zonder validatie.

**Acties:**
1. **Server-side validatie vóór XP:**
   - **safe_spend:** Alleen XP geven als vandaag onder “safe daily spend” is gebleven (gebruik `getRemainingBalance`, `calculateSafeDailySpend`, uitgaven vandaag uit budget/finance state).
   - **log_all:** Alleen XP als “alle uitgaven vandaag gelogd” (definieer criterium: bijv. geen openstaande bedragen of check tegen verwachte logs).
   - **no_impulse:** Alleen XP als geen impulse-aangeduide uitgaven vandaag (gebruik bestaande impulse-logica/tags).
2. **UI:** Checkbox blijft “ik heb dit gedaan”, maar na klik: server valideert; bij falen: toast “Niet voldaan: [reden]” en geen XP. Bij slagen: zoals nu toast + XP.
3. **Optioneel:** Per missie tonen of vandaag al voldaan is (bijv. “Safe spend: voldaan” op basis van data), zodat de gebruiker niet voor niets aanvinkt.

**Prioriteit:** Hoog (integriteit gamification).

---

## 4. Budget: Weekly Tactical Plan – “week safely spend” / getallen kloppen

**Probleem:** Week safely spend / remaining this week voelt vreemd; getallen moeten kloppen.

**Relevante code:**
- `lib/dcic/finance-engine.ts`: `calculateWeeklyAllowance`, `getWeeklySpending`.
- `getWeeklySpending`: week = zondag–vandaag (calendar week); `remainingWeeks = ceil(daysLeft/7)` met `daysLeft` = dagen tot volgende loondag.
- Mix van payday-horizon en kalenderweek kan verwarrend zijn.

**Acties:**
1. **Definieer “week”:** Kiezen:
   - **A:** Kalenderweek (ma–zo of zo–za) consistent gebruiken voor “this week” en “remaining this week”.
   - **B:** Week gelijk aan resterende periode tot loondag (bijv. “deze periode” in weken uitdrukken).
2. **Audit formules:**
   - `weekAllowance = remainingBalance / remainingWeeks`: klopt alleen als “remaining weeks” dezelfde definitie heeft als de week waarin `spentThisWeek` wordt berekend.
   - `daysInWeek`: nu `7 - dayOfWeek` (0=zondag). Controleren of dit “dagen resterend in deze week” correct weergeeft voor de gekozen weekdefinitie.
3. **Documentatie:** In code (of in UI-tooltip) kort uitleggen: “This week = …” en “Safe spend this week = …”.
4. **Edge cases:** 0 resterende weken, negatieve balance, eerste dag na loondag – expliciet afhandelen en testen.

**Prioriteit:** Hoog (budgetvertrouwen).

---

## 5. Budget: Insights – “overspend by €X” – Wanneer? Hoe?

**Probleem:** Melding “If current pace continues, overspend by €4183.36. Actie vereist.” – ontbreekt: wanneer en hoe (welke aannames).

**Relevante code:**
- `lib/dcic/finance-engine.ts`: `forecastEndOfCycle` (burn rate × days left → projected balance, overspend = max(0, -projectedBalance)); `generateInsights` voegt de overspend-message toe.
- `components/dcic/FinancialInsightsCard.tsx`: toont alleen `insight.message`.

**Acties:**
1. **Uitbreiden insight-message (of aparte regels):**
   - **Wanneer:** “Tegen [einddatum huidige periode / volgende loondag].”
   - **Hoe:** “Gebaseerd op je huidige uitgavenpatroon (€X/dag) en X dagen tot volgende loon.”
2. **Optioneel:** Drie korte bullets: (1) verwacht overspend bedrag, (2) datum, (3) aanbevolen actie (bijv. “Verlaag dagelijkse uitgaven met €Y om binnen budget te blijven”).
3. **API/type:** In `Insight` type eventueel velden `detailWhen?: string`, `detailHow?: string` en die in `FinancialInsightsCard` tonen.

**Prioriteit:** Hoog (begrip en actie).

---

## 6. Uitgaven vorige maand – nieuwe maand = na loon, niet kalendermaand

**Probleem:** “Uitgaven vorige maand” moet gaan over de vorige **budgetperiode** (vanaf vorige loondag tot voor deze), niet over de vorige kalendermaand. Nu wordt bij nieuw kalendermaand al “vorige maand” getoond terwijl de periode nog loopt tot loondag.

**Relevante code:**
- `app/(dashboard)/budget/page.tsx`: `prevMonthEntries = getBudgetEntries(prevMonthStart, prevMonthEnd)` met `getBudgetAdjacentMonths()` (kalender).
- `lib/utils/budget-date.ts`: `getPreviousPeriodBounds(periodStart, paydayDayOfMonth)` geeft vorige periode (prevStart, prevEnd).

**Acties:**
1. **Payday-cycle:** Als `isPaydayCycle`: gebruik `getPreviousPeriodBounds(periodStart, paydayDayOfMonth)` en haal entries op met `getBudgetEntries(prevStart, prevEnd)`. Die entries gebruiken voor de sectie “Uitgaven vorige maand” (of label “Uitgaven vorige periode” wanneer payday).
2. **Kalender-mode:** Als geen payday-cycle, blijf bij `prevMonthStart` / `prevMonthEnd` (vorige kalendermaand).
3. **Label:** Dynamisch: bij payday “Uitgaven vorige periode”, anders “Uitgaven vorige maand”.

**Prioriteit:** Hoog (consistentie met jullie regels).

---

## 7. Settings: “How you feel” (mascottes/emoties) – niet meer nodig

**Probleem:** Sectie “How you feel” met verschillende mascottes in de settings mag weg.

**Relevante code:**
- `app/(dashboard)/settings/page.tsx`: `<EmotionPicker />` in sectie Weergave (rond regel 76).
- `components/settings/EmotionPicker.tsx`: component.

**Acties:**
1. **Verwijderen:** `<EmotionPicker />` uit de settings-pagina.
2. **Optioneel:** Als emotie elders nog gebruikt wordt (theme/mascot), die plek aanpassen of een vaste default kiezen. Anders `EmotionPicker.tsx` kunnen behouden voor later of verwijderen.

**Prioriteit:** Laag (opruimen).

---

## 8. Settings: Brain & gedrag (beta) – slaat niet alles op / blijft niet opgeslagen

**Probleem:** Behavior profile (Brain & gedrag) wordt niet goed opgeslagen of lijkt niet bewaard te blijven.

**Relevante code:**
- `components/settings/BehaviorProfileSettings.tsx`: `updateBehaviorProfile(profile)` bij save; `useEffect` zet state uit `initial`.
- `app/actions/behavior-profile.ts`: `updateBehaviorProfile` doet upsert op `behavior_profile` met o.a. `identity_targets`, `avoidance_patterns`, `week_theme`, etc.

**Acties:**
1. **Revalidate na save:** Na succesvolle `updateBehaviorProfile`: `revalidatePath("/settings")` (of de route die de settings laadt) zodat de server opnieuw rendert met verse data.
2. **Initial na save:** Ervoor zorgen dat de parent (settings page) na save opnieuw data fetcht; dan krijgt `BehaviorProfileSettings` een nieuw `initial` en de `useEffect` toont de opgeslagen waarden.
3. **Payload en RLS:** Controleren of alle velden (o.a. `week_theme`, `avoidance_patterns` als JSONB) correct in de upsert zitten en of RLS op `behavior_profile` updates toestaat voor de ingelogde user.
4. **Foutfeedback:** Bij error van `updateBehaviorProfile` duidelijke foutmelding tonen (bijv. “Opslaan mislukt: …”) en niet lokaal state overschrijven met oude waarden tot de server bevestigt.

**Prioriteit:** Hoog (functie werkt nu niet goed).

---

## 9. Current missions – rank (S, A, B, …) voor moeilijkheid

**Probleem:** Huidige missies moeten een moeilijkheidsrank krijgen (S, A, B, etc.).

**Relevante code:**
- Taken/missies: `app/actions/missions-performance.ts` (UMS, task meta), task list / mission cards in o.a. `components/TaskList.tsx`, `components/hq/ActiveMissionCard.tsx`.
- Er is al o.a. `lib/performance-rank.ts`, `lib/progression-rank.ts` – eventueel hergebruiken of uitbreiden.

**Acties:**
1. **Mapping:** Bepaal hoe “rank” wordt afgeleid: bijv. van `difficulty_level` (missions), of van `impact`/`energy_required`/`urgency` (tasks), of van UMS-band (bijv. top 10% = S, volgende 20% = A, …).
2. **Lib/helper:** Functie `getMissionDifficultyRank(taskOrMission): "S" | "A" | "B" | "C" | "D"` (of vergelijkbaar) en die overal gebruiken waar “current missions” worden getoond.
3. **UI:** Badge/label bij elke mission card en in de task list (bijv. “S”, “A”) met consistente styling (kleur/icoon optioneel).
4. **Legenda:** Korte uitleg (bijv. in tooltip of onder de lijst): wat S/A/B/C/D betekent.

**Prioriteit:** Medium (UX/duidelijkheid).

---

## 10. Kleine toast/melding bij verdiende XP (incl. automatische XP bij volgende login)

**Probleem:** Er is geen duidelijke melding wanneer XP is verdiend. Bij automatisch toegekende XP (eind van dag: alle missies gedaan, binnen budget, etc.) moet bij de eerstvolgende login een eenmalige samenvatting getoond worden.

**Relevante code:**
- XP toekennen: o.a. `app/actions/xp.ts` (`addXP`), cron/end-of-day flows (bijv. `app/api/cron/daily/route.ts`), budget discipline (zie punt 3).
- Geen bestaande “pending XP summary” of “show on next login” flow gevonden.

**Acties:**
1. **Opslag pending summary:** Bij automatische XP-toekenning (eind dag, budget-bonus, etc.): samenvatting opslaan (bijv. in `user_preferences` of kleine tabel `pending_xp_notifications`): `{ date, sources: [{ source_type, xp }], totalXp }`.
2. **Bij login/dashboard load:** Als er een pending summary is: toon eenmalig een toast of kleine modal: “Gisteren verdiend: +X XP (alle missies voltooid, binnen budget, …)” en markeer als getoond (verwijderen of flag zetten).
3. **Directe XP (task complete):** Bij directe XP (bijv. task afvinken): zoals nu of korte toast “+X XP” (eventueel al deels aanwezig, dan consistent maken).
4. **Design:** Kleine, niet-opdringerige toast (bijv. Sonner) of compacte modal; één keer per pending summary.

**Prioriteit:** Hoog (feedback op gedrag).

---

## Volgorde en samenvatting

| # | Onderwerp | Prioriteit | Geschatte inspanning |
|---|-----------|------------|----------------------|
| 6 | Uitgaven vorige maand (payday) | Hoog | Klein |
| 3 | Daily Control Missions validatie | Hoog | Medium |
| 5 | Insights overspend When/How | Hoog | Klein |
| 8 | Brain & gedrag opslaan | Hoog | Klein–medium |
| 10 | XP-toast / eenmalige melding | Hoog | Medium |
| 4 | Weekly Tactical getallen | Hoog | Medium |
| 1 | Mission diversity (geen dubbele dagen) | Hoog | Medium |
| 2 | Mascottes scherp | Medium | Klein |
| 9 | Mission rank S/A/B | Medium | Klein |
| 7 | Verwijder EmotionPicker | Laag | Klein |

Aanbevolen start: **6, 8, 5** (snel te doen en veel impact), daarna **3, 10, 4, 1**, en tot slot **2, 9, 7**.

Dit document staat in `docs/ACTIEPLAN_2025_03_01.md` en kan daar worden bijgewerkt na afronding van acties.
