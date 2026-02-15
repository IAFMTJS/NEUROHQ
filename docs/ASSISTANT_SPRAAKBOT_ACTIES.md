# Assistant: spraakbot – taken, uitgaven, agenda, suggesties

**Doel**: De assistant kan op basis van chatinput en eigen voorstellen:
- **Taken toevoegen** (createTask)
- **Uitgaven toevoegen** (addBudgetEntry)
- **Kalenderitems toevoegen** (addManualEvent)
- **Suggesties doen** (bv. "Zal ik 'Eten maken' als taak voor vanavond toevoegen?" → suggestedActions)

---

## 1. Bronnen in de app

- **Tasks**: `app/actions/tasks.ts` – `createTask({ title, due_date, ... })`
- **Calendar**: `app/actions/calendar.ts` – `addManualEvent({ title, start_at, end_at, is_social?, sync_to_google? })`
- **Budget/expenses**: `app/actions/budget.ts` – `addBudgetEntry({ amount_cents, date, category?, note?, is_planned? })` (negatief voor uitgave)

---

## 2. Intent uit chat

**Expliciet** (user vraagt om toe te voegen):
- Taak: "voeg taak X toe", "taak: X", "taak X voor morgen", "ik moet X doen", "zet X op de lijst", "todo: X", "herinner me aan X", "niet vergeten: X", "plan X voor vandaag/morgen", "X als taak", "voeg toe: X", "doe X"
- Uitgave: "ik heb X euro uitgegeven aan Y", "X euro aan Y", "X euro boodschappen", "uitgave/uitgaven/kosten X euro", "betaald X euro"
- Agenda: "afspraak X", "plan X om 15:00", "agenda: X vanavond", "voeg afspraak toe: X", "zet X in agenda", "blok X vanavond", "meeting X morgen 10:00", "event X", "inplannen: X", "kalender: X". Met "google" of "sync" → sync_to_google.

**Suggestie** (bot stelt voor):
- Na "Eten maken" + "vanavond" → suggestie: add_calendar("Eten maken", vanavond) + add_task("Eten maken", vandaag)
- Na "Eten maken" / "japans leren" → suggestie: add_task("X", vandaag)
- Na doel/skill (bv. "japans leren") → ook suggestie: wekelijkse agenda-blok "Japans oefenen" (volgende week, zelfde weekdag 19:00–20:00)

---

## 3. Flow

1. **Parse message** → `extractRequestedActions(message)` → { add_task?, add_expense?, add_calendar? } met payloads.
2. **Expliciet**: als user duidelijk "voeg X toe" zegt → in de route uitvoeren (createTask/addBudgetEntry/addManualEvent) en response aanpassen ("Taak 'X' toegevoegd.").
3. **Suggestie**: uit context (lastTurn + userMessage) of uit extractedItem → `suggestedActions` array; API retourneert `suggestedActions: [{ type, label, payload }]`.
4. **Frontend**: toont knoppen voor elke suggestedAction; bij klik → aanroep createTask/addManualEvent/addBudgetEntry met payload.

---

## 4. Datum/tijd

- "vandaag", "morgen" → YYYY-MM-DD (vandaag/morgen).
- "vanavond" → vandaag 18:00–19:00 (of 19:00–20:00).
- "morgen 10:00" → morgen 10:00–11:00.
- Default taak due_date: vandaag; default expense date: vandaag.
