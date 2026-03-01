# Status: feature checklist (PWA, Missions, XP, Push)

Controle van de gevraagde punten.

---

## 1. Top of the site – white margin on PWA

**Gevraagd:** Geen witte marge in PWA; in normale browser geen probleem.

**Status: GEDAAN (in code)**

- `app/layout.tsx`: `viewportFit: "cover"`, `themeColor: "#050810"`.
- `app/globals.css` (rond 805–856):  
  - `html` en `body` hebben `background-color: var(--cinematic-navy)` en uitgebreide gradient/starfield.  
  - Comment: *"Background extends past viewport so PWA has no white margins; use 120% and fallback color"*.  
  - `background-size: 120% 120%` op de gradient-lagen.  
  - `body` heeft `padding-top: env(safe-area-inset-top)`.
- Manifest: `background_color` en `theme_color` op `#050810`.

Als er op een specifiek toestel nog wit zichtbaar is, controleer of de PWA de nieuwste build gebruikt en of de statusbalk/notch `theme-color` respecteert.

---

## 2. Missions page – alle taken tonen + popup “nog een?”

**Gevraagd:**  
- Ook als het systeem maar 2 taken suggereert, alle 8 (of meer) tonen.  
- Na het minimum een popup: “wil je er nog een doen?”  
- Altijd alle taken zichtbaar; eventueel extra sectie/modal met alle taken.

**Status: GEDAAN**

- **Alle taken zichtbaar:**  
  `getTodaysTasks` retourneert alle openstaande taken voor de dag (geen limit). De Missions/Tasks-pagina toont deze volledige lijst; alleen de *suggestie* (energy budget) beperkt het aanbevolen aantal, niet wat er getoond wordt.
- **Popup na minimum:**  
  In `TaskList.tsx`: na `completeTask` wordt geteld; als `(completedCountBefore + 1) >= suggestedTaskCount` wordt `setShowDoAnotherModal(true)` gezet. De modal toont “Nice work! You've hit your suggested minimum for today. Want to do one more?” met “Maybe later” en “Keep going”.
- **Modal met alle taken:**  
  Knop “All tasks (N)” opent een modal “All today's tasks” met een scrollbare lijst van alle taken van vandaag (incomplete + completed), met titel en o.a. energy-badge.

---

## 3. Add/Edit task – 3 “brain circles” + importance

**Gevraagd:**  
- In add/edit task modal velden voor alle 3 brain circle inputs (energie, focus, load) zodat het systeem kan variëren (bijv. 4 makkelijke vs 2 zware).  
- Importance level: urgent = moet vandaag; low = mag een dag overslaan.

**Status: GEDAAN**

- **Edit mission modal** (`EditMissionModal.tsx`):  
  - Impact (1–3), **Importance** (urgency: Low / Medium / Urgent) met title “Urgent = must do today; Low = ok to skip a day or two”.  
  - Brain-velden: Energy (1–10), Focus (1–10), Load (1–10), Social load (1–10), Priority (1–5).  
  - Tekst: “Brain circles: energy, focus and load affect how many tasks fit today.”
- **TaskList inline add-form (Routine & options):**  
  Impact, Importance (urgency), Energy, Focus, Load, Social, Priority.
- **QuickAddModal:**  
  Heeft Energy, Mental load, Social load; in “+ Impact, urgency, priority”: Impact, Urgency, Priority. **Focus (focus_required)** ontbrak in QuickAddModal en is toegevoegd zodat ook daar alle 3 brain-velden (energy, focus, load) + importance beschikbaar zijn.

---

## 4. XP wordt niet goed bijgehouden over de hele site

**Gevraagd:** XP past zich niet aan na een actie; je blijft “steken”.

**Status: DEELS GEDAAN – verbetering toegevoegd**

- **Waar XP wordt toegekend:**  
  - `completeTask` → `awardXPForTaskComplete()`.  
  - Learning session → `awardXPForLearningSession()`.  
  - Brain status (daily check-in) → `awardXPForBrainStatus()`.  
  - Finance discipline → `addXP` in `finance-xp.ts`.
- **Revalidatie:**  
  `addXP` in `app/actions/xp.ts` roept `revalidatePath("/dashboard", "/settings", "/tasks", "/learning")` aan.  
  `completeTask` roept `revalidatePath("/dashboard", "/tasks")` aan en nu ook **revalidateTag** voor de task-cache van die dag, zodat de gebufferde takenlijst (en afgeleide data) direct ververst na een taak compleet.

Als de UI nog niet ververst:  
- Zorg dat na de actie een navigatie of `router.refresh()` plaatsvindt (bij Tasks-pagina gebeurt dat al).  
- XP op dashboard/settings/learning wordt bij het openen van die pagina opnieuw opgehaald; na revalidatePath zou dat de nieuwe XP moeten tonen.

---

## 5. PWA notifications – VAPID error

**Gevraagd:**  
- Fout: “No notifications in this window”, “Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env.local”, “Run npm run generate-vapid”, “Push not configured (missing VAPID key).”

**Status: CONFIGURATIE NODIG (code en script aanwezig)**

- **Code:**  
  - `components/SettingsPush.tsx` controleert op `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en toont anders “Push not configured (missing VAPID key)” met instructies.  
  - `lib/push.ts` gebruikt dezelfde keys voor het versturen van push.  
  - Cron-routes (o.a. daily/quote) controleren op VAPID voordat ze push sturen.
- **Script:**  
  - `npm run generate-vapid` (in `package.json`: `node scripts/generate-vapid-keys.js`).  
  - Script print twee regels voor `.env.local`.
- **Documentatie:**  
  - `.env.example`: optionele regels voor `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en `VAPID_PRIVATE_KEY` met verwijzing naar `npx web-push generate-vapid-keys`.  
  - README en DEPLOY.md beschrijven de push-setup.

**Wat jij moet doen:**  
1. In projectroot: `npm run generate-vapid`.  
2. De twee uitgeprinte regels kopiëren naar `.env.local`.  
3. (Optioneel) `npm install web-push --save-dev` als het script daarom vraagt.  
4. Server/herstart dev server; daarna zou de push-sectie in Settings moeten werken (na subscriben in dezelfde browser).

---

## Samenvatting

| Onderdeel                         | Status        | Opmerking |
|----------------------------------|---------------|-----------|
| PWA witte marge top              | Gedaan        | viewport + theme-color + 120% bg in CSS. |
| Missions: alle taken tonen       | Gedaan        | Geen limit op getoonde taken. |
| Popup “nog een taak?”            | Gedaan        | Na suggested minimum. |
| Modal “alle taken”               | Gedaan        | Knop “All tasks (N)”. |
| Brain circles + importance       | Gedaan        | Edit + TaskList + QuickAdd (Focus toegevoegd). |
| XP bijhouden / UI updaten        | Verbeterd     | revalidatePath + revalidateTag na complete. |
| PWA push / VAPID                 | Config nodig  | `npm run generate-vapid` + keys in `.env.local`. |
