# NEUROHQ — Geïntegreerd Actieplan (vanaf 23/02)

**Doel:** Alle punten, info en prompts uit de analyse van 23/02 omzetten in één coherent actieplan. Alles netjes gebruikt: bugs, UX, Brainstatus-herontwerp, Adaptive Personal Mission Engine v3, Master Mission Pool v1 en Confrontation Layer.

**Principe:** Brainstatus = dictator, niet commentator. Engine moet gedrag sturen en grenzen afdwingen, niet alleen meten.

---

## Principes & uitgangspunten (uit de prompt)

- **Limiterend, niet adviserend:** "Nu is het adviserend. Het moet limiterend zijn." Een performance-systeem dat altijd zegt "Je kan nog 6 dingen doen" is geen performance-systeem — dat is een optimistische planner. Maak brainstatus de dictator, niet de commentator.
- **Ongemakkelijk persoonlijk:** Niet motivational, niet fluffy. Echt afgestemd op hoe iemand leeft, uitstelt en zichzelf saboteert. "Mooi. Dan maken we het ongemakkelijk persoonlijk."
- **Gedragskompas, geen gamified todo:** Wat je bouwt is geen todo-lijst maar een gedragskompas. Hoe persoonlijker, hoe minder mensen zich kunnen verstoppen achter excuses. "Dit wordt geen random app meer. Dit wordt karaktertraining."
- **365+ dagen vullen:** De mission library moet het systeem in staat stellen 365+ dagen te vullen — geen fluffy onzin, alles uitvoerbaar en schaalbaar.
- **Confrontatie vs shame:** Confrontatie ≠ vernedering. Je confronteert **gedrag**, niet de **persoon**. Dat verschil bepaalt of dit een groeisysteem wordt of een systeem dat mensen doet afhaken. Hard, maar respectvol. "Dat is eerlijk. Geen motivational quotes. Data."
- **Keuze systeem:** "Wil je dit systeem mild houden, of mag het gebruikers soms ook licht confronteren met hun uitstelgedrag?" En: "Durf je gebruikers te confronteren met hun eigen patroon? De echte vraag is niet technisch."

---

## Overzicht fases

| Fase | Naam | Prioriteit | Kort |
|------|------|------------|------|
| **0** | Directe fixes (bugs & blockers) | P0 | Meldingen, breedte, Strategy-error, level/momentum/XP/settings, naming |
| **1** | Brainstatus — Clean architecture | P1 | Slots, tiers, energy multiplier, load risk, Brain Mode display |
| **2** | Adaptive Personal Mission Engine v3 | P2 | Behavior DNA, identity/pet/procrastination, weekthema's, anti-escape |
| **3** | Master Mission Pool v1 | P2 | 10 categorieën, 200+ basismissies, parameter scaling |
| **4** | Confrontation Layer | P3 | 3 niveaus confrontatie, avoidanceTracker, geen shame |

---

# Fase 0: Directe fixes (bugs & blockers)

*Bron: Neurohq vanaf 23/02 — alle concrete issues.*

## 0.1 Notificaties & popups

| # | Punt | Actie | Done |
|---|------|--------|------|
| 0.1.1 | **Geen melding van level up** | Level-up event detecteren (XP/level threshold) → toast of kleine modal: "Level up! Je bent nu level X." | ✅ |
| 0.1.2 | **Geen popup bij te veel energie verbruikt** | Bij overschrijden energy budget (of headroom) → waarschuwingspopup: bv. "Je hebt je energiebudget overschreden. Overweeg lichtere taken." | ✅ |
| 0.1.3 | **Geen popup wanneer het 20u is en nog geen enkele taak gedaan** | Dagelijkse check: als tijd ≥ 20:00 en completed_today = 0 → popup/banner: "Je hebt vandaag nog geen taak voltooid. Kleine actie?" (optioneel link naar 1 micro-missie). | ✅ |

## 0.2 Layout & breedte

| # | Punt | Actie | Done |
|---|------|--------|------|
| 0.2.1 | **Overal site moet breedte van het scherm gebruiken** | Layouts (dashboard, missions, XP, settings, etc.) niet te veel beperken: `max-w-*` loslaten of verhogen; container breedte = device breedte waar logisch; safe padding behouden. | ✅ |

## 0.3 Strategy — "Er is iets misgegaan"

| # | Punt | Actie | Done |
|---|------|--------|------|
| 0.3.1 | **Strategie toevoegen lukt niet — Server Components error (digest 2081980888@E7)** | Foutmelding (prod): "An error occurred in the Server Components render..." **Oorzaken:** (1) Vercel env vars. (2) Migraties; zie DEPLOY.md. (3) Null/undefined in Strategy: **Gedaan:** try/catch op strategy page, fallback UI met uitleg; defensieve defaults voor pressure/alignment/review. | ✅ |

## 0.4 Level modal & momentum

| # | Punt | Actie | Done |
|---|------|--------|------|
| 0.4.1 | **Level modal met 3 balkjes (discipline, consistentie, impact) wordt nooit geüpdatet** | Data voor deze 3 stats koppelen aan echte bron (daily_state, completed tasks, strategy KR, etc.); modal leest actuele waarden en toont progressiebalken die updaten. | ✅ |
| 0.4.2 | **Momentum dashboard en momentum insights komen niet overeen** | Eén definitie van "momentum" (zelfde bron +zelfde berekening); zowel dashboard-widget als Insights/Report gebruiken diezelfde logica en dataset. | ✅ |

## 0.5 XP-pagina

| # | Punt | Actie | Done |
|---|------|--------|------|
| 0.5.1 | **Mascotte — eerst afbeelding croppen** | Mascotte-asset croppen zodat weergave op XP-pagina correct is (geen rare randen/ratio). | ✅ |
| 0.5.2 | **Extra missies ook aan een andere dag kunnen toevoegen** | Bij "extra missie toevoegen" datumkiezer: niet alleen "vandaag", maar ook andere datum kiezen; missie dan voor die dag inplannen. | ✅ |

## 0.6 Instellingen

| # | Punt | Actie | Done |
|---|------|--------|------|
| 0.6.1 | **In instellingen veel meer kunnen aanpassen** | Uitbreiden: timezone, notificaties, brainstatus-voorkeuren, mission-voorkeuren, confrontatieniveau (mild/medium/streng), wekelijkse thema's, identity targets, avoidance tags, hobby-commitments, pet type/attachment — waar mogelijk in bestaande Settings-pagina integreren (secties/toggles). **Gedaan:** subtitle uitgebreid; "Waar stel ik wat in" + XP/dashboard/brain; rest (confrontatie, weekthema's, identity) volgt Fase 2. | 🔄 |

## 0.7 Brainstatus — naming

| # | Punt | Actie | Done |
|---|------|--------|------|
| 0.7.1 | **"Load" anders noemen — verwarrend** | Hernoem in UI (en in copy): bv. "Mentale belasting" / "Cognitive load" / "Drukte" — overal waar "Load" aan gebruiker getoond wordt consistent vervangen. Interne variabele kan `load` blijven. | ✅ |

---

# Fase 1: Brainstatus — Clean architecture

*Bron: "Nieuwe architectuur — clean en consistent". "Je hebt drie pools + headroom + suggested tasks + ROI + alignment — dat is slim maar te veel abstractie tegelijk. We maken het strak." Engine = dictator: slots, tiers, consequenties.*

## 1.1 Focus → Slots (concurrency limiter)

| # | Punt | Actie | Done |
|---|------|--------|------|
| 1.1.1 | **Focus bepaalt hoeveel actieve missies je mág dragen** | Implementeer `getFocusSlots()`: `Math.max(1, Math.floor(focus / 30))`. Focus 60 → 2 slots, 85 → 2, 95 → 3. Slots = hoeveel actieve missies tegelijk — niet hoeveel taken je *kunt*, maar hoeveel je *mág* dragen. Matcht met "one focus at a time". | ☐ |
| 1.1.2 | **Verwijder "~6 tasks suggested"** | Geen vage taaksuggestie meer; alleen slots als harde limiet. | ☐ |

## 1.2 Headroom → Intensity tier

| # | Punt | Actie | Done |
|---|------|--------|------|
| 1.2.1 | **Headroom vertalen naar tier** | `getHeadroomTier(headroom)`: ≥30 → "High", ≥15 → "Medium", else "Low". Tier bepaalt max intensiteit per slot (zie tabel). | ☐ |
| 1.2.2 | **Abstracte headroom-uitleg verminderen** | In UI: toon tier + concreet "Max intensity: Medium tasks" i.p.v. alleen getal. | ☐ |

**Tier → wat mag je doen (exact uit prompt):**

| Tier | Wat mag je doen |
|------|------------------|
| High | 1 heavy per slot |
| Medium | max medium |
| Low | enkel light |

**Concreet voorbeeld (uit prompt):** Energy 80, Focus 60, Load 40 → **Mode:** Stable | **Focus Slots:** 2 | **Capacity Tier:** Medium | **Max intensity:** Medium tasks | **XP bonus:** +10%. Dat is duidelijk; geen spreadsheet.

## 1.3 Energy match → echte consequenties

| # | Punt | Actie | Done |
|---|------|--------|------|
| 1.3.1 | **Energy multiplier** | `getEnergyMultiplier()`: energy > 75 → 1.15; < 30 → 0.75; else 1. | ☐ |
| 1.3.2 | **Bij energy match < 30%** | XP -25%; completion probability -15%; toon waarschuwing "Low synergy state" / "Niet slim om dit nu te doen." | ☐ |
| 1.3.3 | **Engine durft blokkeren/afraden** | Bij lage synergy: tonen dat actie mogelijk maar suboptimaal; optioneel zware missies verbergen of markeren. | ☐ |

## 1.4 Load → gevaarlijk (overcommit bescherming)

"Load is nu een passieve bar. Maak dit: [limieten]. Nu wordt load echt."

| # | Punt | Actie | Done |
|---|------|--------|------|
| 1.4.1 | **Load > 70** | `maxSlots = 1` (onafhankelijk van focus). | ☐ |
| 1.4.2 | **Load > 80** | Geen nieuwe missies mogelijk (blokkeer "Add mission" of toon duidelijke melding). | ☐ |

## 1.5 Brain Mode — bovenaan tonen

| # | Punt | Actie | Done |
|---|------|--------|------|
| 1.5.1 | **Display: Mode, Slots, Tier, Risk** | In plaats van alleen "19/48 headroom" tonen: **Mode:** STABLE | **Focus Slots:** 2 | **Capacity Tier:** MEDIUM | **Risk:** LOW. Optioneel: "Max intensity: Medium tasks", "XP bonus: +10%". | ☐ |
| 1.5.2 | **Mode-afleiding** | Mode (bv. STABLE / CAUTIOUS / DRIVEN) afleiden uit energy/focus/load combinatie; documenteer in code. | ☐ |

## 1.6 Wat verdwijnt / wat blijft

- **Verdwijnt:** "~6 tasks suggested", abstract headroom-getal als enige uitleg, dubbele interpretatie tussen missions en energy budget.
- **Blijft:** Slots (concurrency), Intensity tier (zwaarte), Synergy multiplier (timing), Load risk (overcommit).
- **ROI + alignment:** In de oude beschrijving stonden ook "suggested tasks + ROI + alignment". Besluit: ROI/alignment expliciet definiëren — of meenemen in Brain Mode/risk, of als aparte display; geen dubbele interpretatie met energy budget.
- **Waarom dit beter is (uit prompt):** Omdat je systeem dan: gedrag *stuurt* (niet alleen meet), *grenzen afdwingt*, en *strategisch denken beloont*. Nu is het adviserend; het moet limiterend zijn.

---

# Fase 2: Adaptive Personal Mission Engine v3

*Bron: "Adaptive Personal Mission Engine v3" — Behavior DNA, identiteit, pet, uitstel, energiepatroon.*

## 2.1 Behavior DNA (persoonlijkheidsprofiel)

| # | Punt | Actie | Done |
|---|------|--------|------|
| 2.1.1 | **behaviorProfile in state/DB** | Velden: `identityTargets[]`, `avoidancePatterns[]` (tag + emotion), `energyPattern` (morning_low | stable | evening_crash), `disciplineLevel` (low | medium | high), `petAttachmentLevel`, `hobbyCommitment{}` (bv. fitness, guitar). Migratie + UI in instellingen. | ☐ |
| 2.1.2 | **Identity-based missions** | Template: "Act like a [identity] for 20 minutes" + "Choose one action that proves this identity today." Generatie koppelen aan `identityTargets`. Voor "good dog owner": bv. Extra training sessie, 10 min bewuste aandacht zonder gsm, Gezondheid check. | ☐ |

**Identity mission template (uit prompt):** `id: "identity_proof"`, `category: "structure"`, `tags: ["identity"]`, `generate(params)` → `name: "Act like a ${params.identity} for 20 minutes"`, `description: "Choose one action that proves this identity today."`

## 2.2 Pet missions

| # | Punt | Actie | Done |
|---|------|--------|------|
| 2.2.1 | **Emotioneel vs praktisch** | Bij hoge `petAttachmentLevel` → zwaardere emotionele pet-missies; bij laag → praktische (wandelen, voerbak, etc.). | ☐ |
| 2.2.2 | **Pet type** | Ondersteuning voor Dog, Cat, Other; missies per type (zie Master Mission Pool sectie Pet). | ☐ |

**Pet missions — emotioneel intens (exact uit prompt):** Niet "ga wandelen", maar: 10 minuten volledige aanwezigheid zonder telefoon | Observeer gedrag en noteer 1 teken van vertrouwen | Leer je hond 1 nieuwe cue | Verbeter 1 aspect van verzorging | Maak zijn leefomgeving comfortabeler. Als petAttachmentLevel hoog → zwaardere emotionele missie; laag → praktische missie.

## 2.3 Procrastination — psychologisch

| # | Punt | Actie | Done |
|---|------|--------|------|
| 2.3.1 | **AvoidancePatterns + emotie** | Bij bv. household + overwhelm: geen 30-min cleaning, wel "5-minute friction break": zet timer 5 min → stop zodra timer stopt → reflecteer of weerstand echt zo erg was. Na 3 successen → schaal naar 10 min. "Je app leert weerstand afbouwen." | ☐ |
| 2.3.2 | **Emotie-gekoppelde progressieve exposure** | Voor anxiety bij administratie (exact): Dag 1 — Open 1 brief en lees hem. Dag 2 — Noteer wat je exact vreest. Dag 3 — Betaal 1 kleine factuur. Dag 4 — Plan 1 telefoontje. Progressieve exposure = gedragstherapie-light. | ☐ |

## 2.4 Energy pattern integratie

| # | Punt | Actie | Done |
|---|------|--------|------|
| 2.4.1 | **evening_crash** | Missies na 18u automatisch: reflectie, planning, micro-acties; zware taken alleen vóór 16u. "Je engine houdt rekening met biologische realiteit. Niet met idealistische disciplinefantasie." | ☐ |
| 2.4.2 | **Andere patronen** | morning_low / stable in zelfde logica (tijdvensters + intensiteit). | ☐ |

## 2.5 Hobby missions — commitment score

| # | Punt | Actie | Done |
|---|------|--------|------|
| 2.5.1 | **Commitment in mission selectie** | bv. fitness 0.6 → 60% kans op fitness growth-missie in growth category. | ☐ |
| 2.5.2 | **Commitment daalt bij inactiviteit** | Bij X dagen niet gedaan → commitment daalt. "Je identiteit wordt gemeten in gedrag. Hard. Maar eerlijk." | ☐ |

## 2.6 Weekthema's

| # | Punt | Actie | Done |
|---|------|--------|------|
| 2.6.1 | **Weken toewijzen** | bv. Week 1: "Environment Reset", Week 2: "Self-Discipline", Week 3: "Health & Body", Week 4: "Courage". In settings of strategy. | ☐ |
| 2.6.2 | **Thema stuur missies** | Bij social avoidance + Courage-week: missies zoals "Start klein gesprek", "Stuur 1 bericht", "Spreek mening uit". | ☐ |

## 2.7 Anti-escape protocol

| # | Punt | Actie | Done |
|---|------|--------|------|
| 2.7.1 | **Na 3 dagen skip** | Dag 4: **"Minimal Integrity Action"** — 2 minuten, onmogelijk te falen, streak reset voorkomen. "Want streak systeem is krachtig. Je wil geen alles-of-niets crash." | ☐ |

## 2.8 Dagelijkse generatie-flow

| # | Punt | Actie | Done |
|---|------|--------|------|
| 2.8.1 | **10 stappen (exact uit prompt)** | 1) Check brainstatus 2) Check avoidance frequency 3) Check hobby commitment 4) Check identity targets 5) Check weekly theme 6) Filter mission pool 7) Parameter scaling 8) XP berekenen 9) Mission activeren 10) Bij completion → **reward loop uitvoeren**. Geen shortcuts. | ☐ |

## 2.9 Optioneel: 30-dagen confrontatie

| # | Punt | Actie | Done |
|---|------|--------|------|
| 2.9.1 | **Data-spiegel** | Na 30 dagen: "Je zegt dat fitness belangrijk is, maar je deed 3/12 fitness missies. Wil je dit doel aanpassen of eerlijker worden?" (zie ook Fase 4). | ☐ |
| 2.9.2 | **30-dagen data (uit prompt)** | "Je voltooit 80% van focus missies. Je vermijdt administratie 70% van de tijd. Wil je dat administratie belangrijk blijft in je profiel?" — Dat is eerlijk. Geen motivational quotes. Data. | ☐ |

---

# Fase 3: Master Mission Pool v1

*Bron: "Master Mission Pool v1" — 10 categorieën, 200+ basismissies, schaalbaar.*

Doel: geen fluffy onzin; alles uitvoerbaar en schaalbaar. Met parameter scaling → 500+ unieke combinaties. De pool moet **365+ dagen** kunnen vullen.

**Totaal aantal (uit prompt):** Structure ~40 | Energy ~30 | Focus ~25 | Growth ~25 | Pets ~25 | Procrastination ~20 | Identity ~10 | Courage ~10 | Hobby dynamic ~20+ | Reflection ~10 → **200+ basismissies**, **500+ combinaties**.

## 3.1 Structure (Levensorde / Omgeving) — ~40

| Sub | Voorbeelden | Actie |
|-----|-------------|--------|
| Micro Cleaning (5–10 min) | Clean 1 surface, 1 drawer, desk to zero, 10-item removal, 5-min timer sprint, fold laundry, empty trash, clear 1 shelf, car interior, fridge shelf | In mission library als templates; duur/scope als params. |
| Deep Cleaning (15–30 min) | Bathroom reset, kitchen reset, wardrobe audit, laundry full cycle, deep clean desk, mop one room, windows 1 room, storage box, pet area | Idem. |
| Administration | Pay 1 bill, open 1 letter, inbox <10, 1 appointment, 1 call, 15-min paperwork, unsubscribe 5, bank check, budget 10 min, cancel subscription | Idem. |
| Control & Planning | Plan tomorrow 5 min, top 3 priorities, weekly planning, monthly review, clear backlog item, 1 avoided decision, schedule task, reminders, review projects | Idem. |

**Taak:** Alle items als mission-definities in code/DB; koppelen aan categorie "Structure" + subcategorie.

## 3.2 Energy (Fysiek & Biologisch) — ~30

| Sub | Voorbeelden |
|-----|-------------|
| Movement | Walk 10/20/30 min, extra 5 min, 100 reps, 20 pushups, 50 squats, core 10 min, mobility 10, stretch, stairs, HIIT 8 min |
| Recovery | 1L water before 16u, no sugar until 14u, protein meal, sleep 7+, bed 30 min earlier, cold shower 30s, breathing 5 min, no caffeine after 14u, eat without phone |
| Nervous System | 5 min silence, 10 min no-stimulation, 3 slow breaths, nature 10 min, no scrolling 1h, digital sunset 21u |

**Taak:** Idem — mission library, Energy-categorie.

## 3.3 Focus — ~25

| Sub | Voorbeelden |
|-----|-------------|
| Attention Control | 15 min deep work, 25 min Pomodoro, no notifications block, phone outside 30 min, single-task 1, finish 1 small task, write 1 page, 20 min reading, 10 min thinking |
| Reflection | Journal 5 min, 3 wins, 1 mistake, 1 improvement, clarify 1 decision, review goal, rewrite learning goal, 3 distractions, 1 fear avoided |

**Taak:** Idem — Focus-categorie.

## 3.4 Growth (Learning & Skill) — ~25

| Sub | Voorbeelden |
|-----|-------------|
| Learning | Study 15 min, 10 new words, 1 video no multitask, read 10 pages, notes, review notes, practice 1 concept, teach 1 idea, 20 min skill block |
| Cognitive Expansion | 5 hard problems, brain training 10 min, short essay, micro experiment, improve 1 system, analyze 1 failure, workflow, research 1 topic |

**Taak:** Idem — Growth-categorie.

## 3.5 Pet — ~25

| Sub | Voorbeelden |
|-----|-------------|
| Dog | Extra 5 min walk, 10 min training, grooming, clean feeding area, deep play, health check paws, water & bowl, 1 command, observe & note |
| Cat | Active play 10 min, clean litter, groom, scratching post, fresh water, bonding, observe mood |
| Other | Habitat clean, 10 min interaction, feeding check, health observation, improve enclosure |

**Taak:** Idem — Pet-categorie; koppelen aan pet type in profiel.

## 3.6 Procrastination Attack — ~20

| Sub | Voorbeelden |
|-----|-------------|
| Household | 5-min friction break, 15-min cleaning sprint, finish laundry, clear 1 zone, remove 10 items, 1 corner, reset bathroom |
| Administration | Open 1 feared email, pay smallest bill, 1 call, review insurance, sort stack, inbox -50% |
| Social | Send 1 message, 1 short conversation, express opinion, plan 1 meetup, resolve 1 tension, thank someone |

**Taak:** Idem — Procrastination-categorie; koppelen aan avoidancePatterns.

## 3.7 Identity — ~10

Act like disciplined 20 min, prove fit person today, responsible pet owner, act like future-you, 1 courageous action, 1 thing you'd respect yourself for, improve environment like leader, act financially responsible.

**Taak:** Idem — Identity-categorie; koppelen aan identityTargets.

## 3.8 Courage — ~10

Do 1 uncomfortable task, speak up once, say no, ask feedback, admit mistake, set boundary, do task before ready, take initiative small.

**Taak:** Idem — Courage-categorie.

## 3.9 Hobby (dynamic) — ~20+

Fitness (20 min workout, core, mobility, new movement, track). Music (10 min technique, hard section, record, new chord, improv). Language (1 episode no subs, shadowing, write, speak 5 min, 15 words). Creative (sketch 10 min, 300 words, edit, publish, 1 detail).

**Taak:** Idem — Hobby-categorie; koppelen aan hobbyCommitment.

## 3.10 Weekly Reflection — ~10

Weekly review, review streak, adjust learning goal, evaluate energy pattern, identify biggest avoidance, plan next week, reset environment.

**Taak:** Idem — Reflection-categorie.

## 3.11 Implementatievolgorde pool

| # | Actie | Done |
|---|--------|------|
| 3.11.1 | Schema mission library (id, name, category, subcategory, duration_min, intensity, params). | ☐ |
| 3.11.2 | Seeden of importeren van alle basismissies (minimaal naam + categorie + sub + intensity). | ☐ |
| 3.11.3 | Parameter scaling (duur, reps, zone) voor 500+ combinaties. | ☐ |

---

# Fase 4: Confrontation Layer

*Bron: "Confrontation Layer" — niet sadistisch, niet shamen, maar wél confronterend op basis van gedrag. "Wat je bouwt is een systeem dat incongruentie zichtbaar maakt. En dat mag confronteren."*

## 4.1 Drie niveaus van confrontatie

| Niveau | Naam | Voorbeeld |
|--------|------|-----------|
| 1 | Zachte Spiegel | "Je hebt administratie 3 dagen uitgesteld." → Missie: Open 1 brief en lees hem volledig. Geen oordeel. Wel gericht. |
| 2 | Patroon Benoemen | Na 5 vermijdingen: "Je vermijdt administratie consistent. Vandaag: 15 minuten volledige administratie focus." Kort. Direct. |
| 3 | Identiteit Confrontatie | Na 7: "Je zegt dat financiële controle belangrijk is. Bewijs het vandaag." → Betaal 1 factuur of budget overzicht. "Dit is niet gemeen. Dit is congruentie afdwingen." |

**Taak:** Escalatie-logica koppelen aan `avoidanceTracker`; max 1 forced confrontation mission per week. "Je wil geen mentale shutdown."

## 4.2 Pattern tracking

| # | Punt | Actie | Done |
|---|------|--------|------|
| 4.2.1 | **avoidanceTracker in state** | Structuur (uit prompt): per tag bv. `household: { skipped: 3, completed: 1 }`, `administration: { skipped: 5, completed: 0 }`, `fitness: { skipped: 4, completed: 2 }`. | ☐ |
| 4.2.2 | **Na elke missie** | completed → reset skip counter; skipped → +1. Skip > threshold → weight verhogen; skip > 5 → forced selection mogelijk (max 1/week). | ☐ |

## 4.3 Confrontation missions (specifiek, exact uit prompt)

- **Household:** Finish the laundry fully. No partial. | Clean the zone you avoid most. | Remove 20 useless items. | 20-minute non-stop cleaning. | Reset your environment properly.
- **Administration:** Call the number you avoid. | Pay the smallest open bill. | 20-minute paperwork sprint. | Email zero challenge. | Open all unread letters.
- **Fitness:** Train even if motivation = 0. | 15 min minimum movement. | No excuses workout. | Track and log performance.
- **Social:** Start 1 conversation. | Express 1 opinion. | Ask 1 question you normally avoid. | Send 1 honest message.

**Taak:** Toevoegen aan mission pool met tag "confrontation"; selectie alleen wanneer escalation niveau bereikt.

## 4.4 Identity shadow missions

Exacte copy (uit prompt): Als identityTarget = "disciplined" en discipline-missies genegeerd → **"Act like a disciplined person for 20 minutes. No distractions. No excuses."** Als identityTarget = "fit person" → **"Move your body today. Even if it's the last thing you want."** Kort, direct. Geen therapie-tekst. Gebruik spaarzaam.

**Taak:** Template + selectie bij identity-incongruentie.

## 4.5 Emotionele confrontatie (exact uit prompt)

- **Anxiety bij administratie:** Write down exactly what you fear. What is the worst realistic outcome? Act for 5 minutes anyway.
- **Overwhelm bij huishouden:** Pick the smallest visible mess. 5 minutes only. Stop after timer.
- **Social avoidance:** Send message without overthinking. No rewriting more than once.

Helpt gedrag herprogrammeren. **Taak:** Koppelen aan avoidancePatterns.emotion.

## 4.6 Weekelijkse spiegel (zondag)

"You avoided: Administration (4x). You completed: Fitness (3x)." → Missie: kies 1 avoided category, act 15 min. Autonomie + confrontatie.

**Taak:** Sunday job of dag-check; toon + 1 mission.

## 4.7 Geen shame (BELANGRIJK: GEEN SHAME — uit prompt)

**Belangrijk:** Confrontatie ≠ vernedering. Je confronteert **gedrag**, niet de **persoon**. Dat verschil bepaalt of dit een groeisysteem wordt of een systeem dat mensen doet afhaken.

**Verboden:** "Je faalt.", "Je bent lui.", "Dit is slecht."  
**Toegestaan:** "Je vermijdt dit.", "Je zei dat dit belangrijk is.", "Bewijs het vandaag."  
**Taak:** Copy review; alle confrontatie-teksten checken.

## 4.8 Failsafe

Bij energy < 25: confrontatie **downgrade** naar **"Minimal integrity action"** — 3 minuten, micro versie. "Je wil druk. Niet breken."

**Taak:** In selectie-logica energy check.

## 4.9 Persoonlijkheid-schaling

Low disciplineLevel → meer micro confrontaties, minder zware forced. High → sneller escaleren, langere focusblokken.

**Taak:** Koppelen aan `disciplineLevel` in behaviorProfile.

---

# Prioritering & volgorde

1. **Eerst Fase 0** — anders blijft Strategy kapot en UX/notifications storen.
2. **Dan Fase 1** — Brainstatus is de basis voor "wat mag ik vandaag"; daarna mission selectie zinvol.
3. **Fase 2 + 3 samen** — Engine v3 heeft mission pool nodig; pool kan parallel opgezet worden (schema + seed), daarna engine-logica (filter, scaling, daily flow).
4. **Fase 4 daarna** — Confrontation bouwt op avoidanceTracker en mission pool; na Fase 2/3.

---

# Checklist per fase (quick scan)

- [ ] **Fase 0:** Level-up melding, energie/20u popups, breedte, Strategy env+migraties, level modal update, momentum align, XP mascotte+datum, settings uitbreiden, Load hernoemen.
- [ ] **Fase 1:** getFocusSlots, getHeadroomTier, getEnergyMultiplier, Load >70/80 limiet, Brain Mode display, verwijder abstracties.
- [ ] **Fase 2:** behaviorProfile, identity/pet/procrastination/energy/hobby/weekthema/anti-escape, daily 10-stappen flow.
- [ ] **Fase 3:** Mission library schema, 10 categorieën, 200+ basismissies, parameter scaling.
- [ ] **Fase 4:** 3 niveaus confrontatie, avoidanceTracker, confrontation missions, no shame, failsafe, personality scaling.

---

---

# Appendix A: Volledige Master Mission Pool (alle bullets uit prompt)

*Elke bullet uit je prompt staat hier; niets weglaten.*

## 🔵 1. STRUCTURE MISSIONS (~40)

**Micro Cleaning (5–10 min):** Clean 1 surface volledig • Clean 1 drawer volledig • Clear desk to zero • 10-item removal challenge • 5-minute timer clean sprint • Fold laundry immediately • Empty trash & reset bags • Clear 1 shelf • Clear car interior • Clean fridge shelf

**Deep Cleaning (15–30 min):** Bathroom full reset • Kitchen surface reset • Wardrobe audit (remove 5 items) • Laundry full cycle start-to-finish • Deep clean work desk • Mop one room • Clean windows in 1 room • Organize storage box • Clean pet area fully

**Administration:** Pay 1 open bill • Open & process 1 letter • Reduce inbox below 10 • Schedule 1 overdue appointment • Call 1 postponed contact • 15-minute paperwork sprint • Unsubscribe from 5 emails • Check bank transactions • Budget review 10 minutes • Cancel 1 useless subscription

**Control & Planning:** Plan tomorrow in 5 minutes • Define top 3 priorities • Weekly planning session • Monthly review • Clear backlog item • Make 1 avoided decision • Schedule important task • Set calendar reminders • Review ongoing projects

## 🔴 2. ENERGY MISSIONS (~30)

**Movement:** Walk 10/20/30 minutes • Extra 5 minutes above usual • 100 total reps challenge • 20 pushups • 50 squats • Core session 10 minutes • Mobility routine 10 min • Stretch full body • Stairs instead of elevator • Short HIIT 8 minutes

**Recovery:** Drink 1L water before 16u • No sugar until 14u • Protein-focused meal • Sleep 7+ hours • Go to bed 30 min earlier • Cold shower 30 sec • 5-minute breathing session • No caffeine after 14u • Eat without phone

**Nervous System:** 5 min silence • 10 min no-stimulation block • Slow breathing 3 cycles • Nature exposure 10 min • No scrolling for 1 hour • Digital sunset (no screens after 21u)

## 🟣 3. FOCUS MISSIONS (~25)

**Attention Control:** 15 min deep work • 25 min Pomodoro • No notifications block • Phone outside room 30 min • Single-task 1 activity • Finish 1 small task fully • Write 1 page without interruption • 20 min reading • 10 min structured thinking

**Reflection:** Journal 5 min • Write 3 wins today • Identify 1 mistake • Define 1 improvement • Clarify 1 decision • Review personal goal • Rewrite learning goal • Write 3 distractions today • Define 1 fear you avoided

## 🟢 4. GROWTH MISSIONS (~25)

**Learning:** Study 15 min • 10 new words (language) • 1 educational video no multitask • Read 10 pages • Take notes from learning session • Review previous notes • Practice 1 concept actively • Teach 1 idea to someone • 20 min skill block

**Cognitive Expansion:** Solve 5 hard problems • Brain training 10 min • Write short essay • Plan micro experiment • Improve 1 system in your life • Analyze 1 failure • Improve workflow • Research 1 topic deeply

## 🐶 5. PET MISSIONS (~25)

**Dog:** Extra 5 min walk • 10 min training session • Grooming session • Clean feeding area • Deep play session • Health check paws • Refresh water & bowl clean • Practice 1 command • Observe behavior & note 1 insight

**Cat:** Active play 10 min • Clean litter box fully • Groom thoroughly • Clean scratching post area • Replace water fresh • Quiet bonding session • Observe mood & note insight

**Other Pets:** Habitat clean • 10 min interaction • Feeding system check • Health observation • Improve enclosure environment

## 🟡 6. PROCRASTINATION ATTACK (~20)

**Household Avoiders:** 5-min friction break • 15-min cleaning sprint • Finish laundry cycle fully • Clear 1 chaotic zone • Remove 10 useless items • Clean 1 room corner • Reset bathroom

**Administration Avoiders:** Open 1 email you fear • Pay smallest bill first • Call 1 official number • Review insurance • Sort paperwork stack • Reduce inbox by 50%

**Social Avoiders:** Send 1 message • Start 1 short conversation • Express opinion once • Plan 1 meetup • Resolve 1 tension • Thank someone sincerely

## 🔥 7. IDENTITY MISSIONS (~10)

Act like a disciplined person for 20 min • Prove you are a fit person today • Be a responsible pet owner • Act like future-you • Take 1 courageous action • Do 1 thing you'd respect yourself for • Improve environment like a leader • Act financially responsible

## 🧨 8. COURAGE MISSIONS (~10)

Do 1 uncomfortable task • Speak up once • Say no to something • Ask for feedback • Admit a mistake • Set a boundary • Do task before you feel ready • Take initiative in something small

## ⚙ 9. HOBBY MISSIONS — dynamic (~20+)

**Fitness:** 20 min workout • Core only session • Mobility block • Try new movement • Track performance  
**Music:** 10 min technique • Practice hard section • Record yourself • Learn new chord • Improvisation block  
**Language:** 1 episode no subtitles • Shadowing 10 min • Write short text • Speak out loud 5 min • 15 new words  
**Creative:** Sketch 10 min • Write 300 words • Edit 1 project • Publish something • Improve 1 detail

## 🟤 10. WEEKLY REFLECTION (~10)

Weekly review • Review streak • Adjust learning goal • Evaluate energy pattern • Identify biggest avoidance • Plan next week • Reset environment

---

# Appendix B: Vergelijkingscheck — prompt vs actieplan

*Systematische controle: elk onderdeel uit de oorspronkelijke prompt afgevinkt.*

## Fase 0 — Bugs & UX
| Uit prompt | In actieplan |
|------------|--------------|
| Geen melding level up | 0.1.1 ✓ |
| Geen popup te veel energie / 20u geen taak | 0.1.2, 0.1.3 ✓ |
| Site breedte scherm gebruiken | 0.2.1 ✓ |
| Strategy error + digest 2081980888@E7 + Supabase env + DEPLOY.md + Server Components message | 0.3.1 ✓ |
| Level modal 3 balkjes (discipline, consistentie, impact) nooit geüpdatet | 0.4.1 ✓ |
| Momentum dashboard vs insights niet overeen | 0.4.2 ✓ |
| XP mascotte eerst croppen | 0.5.1 ✓ |
| Extra missies ook andere dag (nu enkel vandaag) | 0.5.2 ✓ |
| Instellingen veel meer aanpassen | 0.6.1 ✓ |
| Brainstatus "load" anders noemen, verwarrend | 0.7.1 ✓ |

## Fase 1 — Brainstatus
| Uit prompt | In actieplan |
|------------|--------------|
| Drie pools + headroom + suggested + ROI + alignment; te veel abstractie → strak | Intro 1 + 1.6 ✓ |
| getFocusSlots() = max(1, floor(focus/30)); 60→2, 85→2, 95→3 | 1.1.1 ✓ |
| Slots = hoeveel mág dragen, niet kunt; one focus at a time | 1.1.1 ✓ |
| getHeadroomTier(≥30 High, ≥15 Medium, else Low) | 1.2.1 + tabel ✓ |
| Tier: High 1 heavy/slot, Medium max medium, Low enkel light | 1.2 tabel ✓ |
| getEnergyMultiplier(>75→1.15, <30→0.75); energy match <30%: XP -25%, completion -15%, "Low synergy" | 1.3.1, 1.3.2 ✓ |
| "Niet slim om dit nu te doen" / engine durft blokkeren | 1.3.2, 1.3.3 ✓ |
| Load >70 maxSlots=1; Load >80 geen nieuwe missies; load was passief → nu echt | 1.4 ✓ |
| Display: Mode, Focus Slots, Capacity Tier, Risk (niet alleen 19/48 headroom) | 1.5.1 ✓ |
| Voorbeeld Energy 80 Focus 60 Load 40 → Stable, 2 slots, Medium, +10% | 1.2 ✓ |
| Verdwijnt: ~6 tasks, abstract headroom, dubbele interpretatie | 1.6 ✓ |
| Blijft: Slots, tier, synergy, load risk; ROI/alignment besluit | 1.6 ✓ |
| Waarom beter: gedrag stuurt, grenzen afdwingt, strategisch denken beloont | 1.6 ✓ |

## Fase 2 — Engine v3
| Uit prompt | In actieplan |
|------------|--------------|
| behaviorProfile: identityTargets, avoidancePatterns (tag+emotion), energyPattern, disciplineLevel, petAttachmentLevel, hobbyCommitment | 2.1.1 ✓ |
| Identity mission template (id, category, tags, generate → name, description) | 2.1.2 + template ✓ |
| Good dog owner: training, 10 min aandacht, gezondheid check | 2.1.2 ✓ |
| Pet emotioneel: 10 min aanwezigheid, teken vertrouwen, 1 cue, verzorging, leefomgeving | 2.2 ✓ |
| 5-min friction break: timer → stop → reflectie; 3 successen → 10 min; weerstand afbouwen | 2.3.1 ✓ |
| Admin exposure dag 1–4 (brief, vreest, factuur, telefoon); gedragstherapie-light | 2.3.2 ✓ |
| evening_crash: na 18u reflectie/planning/micro; zwaar vóór 16u; biologische realiteit | 2.4.1 ✓ |
| Hobby commitment 0.6 → 60% kans; 5 dagen niet → commitment daalt; identiteit in gedrag, hard maar eerlijk | 2.5 ✓ |
| Weekthema's 1–4 (Environment Reset, Self-Discipline, Health & Body, Courage); social avoidance + Courage-week | 2.6 ✓ |
| Anti-escape: 3 dagen skip → Minimal Integrity Action 2 min, streak, geen alles-of-niets | 2.7.1 ✓ |
| 10 stappen daily flow incl. reward loop; geen shortcuts | 2.8.1 ✓ |
| 30 dagen: 3/12 fitness / 80% focus 70% admin; "Wil je doel aanpassen of eerlijker worden?" | 2.9 ✓ |

## Fase 3 — Mission Pool
| Uit prompt | In actieplan |
|------------|--------------|
| Per categorie + subcategorie + schaalbaarheid; 365+ dagen; geen fluffy onzin | Intro 3 + Appendix A ✓ |
| Structure ~40, Energy ~30, Focus ~25, Growth ~25, Pet ~25, Procrastination ~20, Identity ~10, Courage ~10, Hobby ~20+, Reflection ~10 | Totaal + Appendix A ✓ |
| 200+ basismissies, 500+ combinaties | 3 + Appendix A ✓ |
| Alle bullets per categorie (micro/deep cleaning, admin, movement, recovery, etc.) | Appendix A ✓ |

## Fase 4 — Confrontation
| Uit prompt | In actieplan |
|------------|--------------|
| Niet sadistisch, niet shamen, wél confronterend; incongruentie zichtbaar maken | Intro 4 ✓ |
| Niveau 1 Zachte Spiegel (3 dagen uitgesteld → 1 brief; geen oordeel, wel gericht) | 4.1 ✓ |
| Niveau 2 Patroon Benoemen (5 vermijdingen; 15 min; kort, direct) | 4.1 ✓ |
| Niveau 3 Identiteit (7; "Bewijs het vandaag"; congruentie afdwingen) | 4.1 ✓ |
| avoidanceTracker { tag: { skipped, completed } }; completed→reset, skipped→+1; >5 forced, max 1/week; geen mentale shutdown | 4.2 ✓ |
| Confrontation missions household/admin/fitness/social (exacte bullets) | 4.3 ✓ |
| Identity shadow: "No distractions. No excuses." / "Even if it's the last thing you want." | 4.4 ✓ |
| Emotionele confrontatie (fear, worst outcome, 5 min; smallest mess 5 min; no rewriting) | 4.5 ✓ |
| Weekelijkse spiegel zondag (avoided 4x, completed 3x → kies 1, act 15 min) | 4.6 ✓ |
| BELANGRIJK GEEN SHAME; verboden vs toegestaan; gedrag niet persoon; groeisysteem vs afhaken | 4.7 ✓ |
| Failsafe energy <25 → Minimal integrity 3 min; druk niet breken | 4.8 ✓ |
| disciplineLevel: low→meer micro, high→sneller escaleren | 4.9 ✓ |

## Principes & one-liners
| Uit prompt | In actieplan |
|------------|--------------|
| Limiterend niet adviserend; optimistische planner vs performance engine; dictator niet commentator | Principes ✓ |
| Ongemakkelijk persoonlijk; gedragskompas; karaktertraining; 365+; confronteer gedrag niet persoon; data | Principes ✓ |
| Mild vs confronteren; durf je gebruikers te confronteren | Principes ✓ |

**Conclusie:** Alle gecontroleerde punten en details uit de oorspronkelijke prompt staan in het actieplan of in Appendix A/B. Gebruik deze appendix om bij wijzigingen opnieuw te controleren.

---

*Document gegenereerd uit analyse 23/02. Laatste update: 24/02.*
