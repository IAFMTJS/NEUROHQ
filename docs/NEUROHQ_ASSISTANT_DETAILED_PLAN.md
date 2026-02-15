# NEUROHQ Assistant – Volledig gedetailleerd plan

**Doel**: Eén overzichtelijk, gedetailleerd plan voor het NEUROHQ AI-assistantonderdeel: chatbox, uiterlijk, denkwijze, flows, edge cases en technische aansluiting. Niets vaag; alles uitwerkbaar voor implementatie.

**Bron**: `AI Modal start/Info en opdracht/` + `NEUROHQ_AI_LOGIC_100_PERCENT_ANALYSIS.md`

---

## Inhoudsopgave

1. [Positionering & Toegang](#1-positionering--toegang)
2. [Chatbox: Layout & Anatomie](#2-chatbox-layout--anatomie)
3. [Visueel ontwerp](#3-visueel-ontwerp)
4. [Berichttypen & Structuur](#4-berichttypen--structuur)
5. [Denkwijze van de assistant](#5-denkwijze-van-de-assistant)
6. [UI-states (leeg, laden, fout, crisis)](#6-ui-states)
7. [Identity- en courage-UI](#7-identity--courage-ui)
8. [Copy & Microcopy](#8-copy--microcopy)
9. [Technische integratie](#9-technische-integratie)
10. [Toegankelijkheid](#10-toegankelijkheid)
11. [Flows (stap voor stap)](#11-flows)
12. [Edge cases & Grenzen](#12-edge-cases--grenzen)

---

## 1. Positionering & Toegang

### 1.1 Waar leeft de assistant?

| Optie | Beschrijving | Aanbeveling |
|-------|--------------|-------------|
| **A. Eigen route** | `/assistant` – volwaardige pagina, chat vult het scherm onder header. | **Aanbevolen** voor focus en ruimte voor lange antwoorden. |
| **B. Modal / drawer** | FAB of nav-item opent een modal/drawer met chat. | Goed als de assistant “overal” bereikbaar moet zijn. |
| **C. Sectie op dashboard** | Ingekorte chat op HQ met link “Open in volledig scherm”. | Optioneel als tweede toegang. |

**Voorkeur voor dit plan**: **A (eigen route)** als primaire ervaring, plus **één duidelijke entry point** (bijv. nav-item “Assistant” of “Chat”) zodat de gebruiker altijd weet waar de chat zit.

### 1.2 Entry points (concreet)

- **Bottom nav**: Nieuw item “Assistant” (of icoon “Chat”) → navigeert naar `/assistant`. Zelfde stijl als bestaande nav-items (HQ, Missions, Budget, Growth, Strategy, Insight, Settings). Icoon: chatballon of “assistant”-symbool; label kort (bijv. “Assistant”).
- **Geen FAB** in eerste versie, tenzij je expliciet wilt dat de assistant vanaf elke pagina open te trekken is; dan FAB rechtsonder, opent drawer/modal met dezelfde chat-UI als hieronder.

### 1.3 URL en deep linking

- **URL**: `/assistant` (geen query voor “sessie” in eerste versie; sessie = huidige gebruiker + eventueel client-side conversation buffer).
- Optioneel later: `/assistant?thread=xxx` voor gedeelde of hervatte threads (als je threads gaat persisten).

---

## 2. Chatbox: Layout & Anatomie

### 2.1 Schermopbouw (van boven naar beneden)

```
┌─────────────────────────────────────────┐
│  Assistant-header (vast)                │  ← 1. Header
├─────────────────────────────────────────┤
│                                         │
│  Berichtenlijst (scroll)                │  ← 2. Message list
│  - user bubble                           │
│  - assistant bubble                     │
│  - ...                                  │
│                                         │
├─────────────────────────────────────────┤
│  Invoerveld + Verstuur                  │  ← 3. Input area
└─────────────────────────────────────────┘
```

- **Header**: Vast bovenaan. Bevat: titel “Assistant” (of “NEUROHQ Assistant”), geen avatar van de AI (blijft systeem, geen “persoon”). Optioneel: subtitel één regel, bijv. “Gedragsarchitectuur – evidence-based”.
- **Message list**: Flex 1, overflow-y auto, scroll-naar-onder bij nieuw bericht. Padding links/rechts gelijk aan rest van app (`var(--hq-padding-x)`).
- **Input area**: Vast onderaan, boven de safe-area (boven eventuele bottom nav als de chat fullscreen is, of boven de browser chrome). Bevat: tekstveld + verstuurknop.

### 2.2 Afmetingen (in lijn met bestaande app)

- **Max-width**: Zelfde als dashboard, bijv. `max-w-[420px]` gecentreerd.
- **Headerhoogte**: Bijv. 56px (3.5rem), consistent met andere schermen.
- **Input area**: Min-height bijv. 56px; één regel tekst met mogelijkheid tot meerdere regels (max 4–5 regels), daarna scroll in het veld.
- **Message list**: `min-height: 0` in flex-container zodat scroll correct werkt.

### 2.3 Anatomie van het invoerblok

- **Tekstveld**: Placeholder (zie sectie 8). Max-length optioneel (bijv. 2000 tekens); geen harde limiet in UX-tekst, wel server-side limiet.
- **Verstuurknop**: Icoon “verstuur” (pijl of send). Altijd zichtbaar rechts van het veld (of onder het veld op zeer kleine schermen). Disabled wanneer: veld leeg of alleen witruimte, of tijdens “loading” van een antwoord.
- **Geen spraak-input** in eerste versie (later toevoegen mag).

---

## 3. Visueel ontwerp

### 3.1 Design tokens (bestaande app)

Gebruik de bestaande tokens uit `globals.css` en theme-tokens, zodat dark/light en thema’s (normal, girly, industrial) automatisch kloppen:

- **Achtergrond chat**: `--bg-primary` voor de pagina; message list kan `--bg-primary` of `--bg-surface` zijn.
- **User bubble**: `--bg-elevated` of iets lichter dan surface; rand `--card-border`; tekst `--text-primary`.
- **Assistant bubble**: Onderscheidend maar niet “robot”: bijv. `--bg-surface` met subtiele rand of `--card-inner-glow`; tekst `--text-primary`.
- **Accenten**: `--accent-focus` voor focus/actieve elementen (verstuurknop, focus ring); `--accent-energy` eventueel voor “positieve” of neutrale accenten; `--accent-warning` alleen voor waarschuwingen (niet voor Tier 2/3 als “waarschuwing” in kleur; tier wordt door inhoud en eventueel een klein label aangegeven, niet door een rode kleur).

### 3.2 Bubbles – vorm en positie

- **User**: Rechts uitgelijnd (of volle breedte met bubble zelf rechts, max-width bijv. 85%). Border-radius: groter aan de rechterkant (bijv. 16px rechts, 4px links) voor “chat”-gevoel.
- **Assistant**: Links uitgelijnd, max-width 85%. Border-radius: groter links, kleiner rechts.
- **Verticale spacing**: Min. 8px tussen opeenvolgende berichten van dezelfde partij; 12–16px tussen user en assistant.
- **Horizontale padding binnen bubble**: 12–16px; verticale padding 10–14px.

### 3.3 Typografie

- **Font**: Zelfde als rest van app (bijv. system-ui of gedefinieerde font-family in globals).
- **User/assistant body**: Zelfde font-size als body (bijv. 1rem), line-height 1.5. Geen extra grote titels in de bubble; eventueel eerste zin vet bij escalation (zie sectie 4).
- **Tijdstempel**: Optioneel, klein en gedempt (`--text-muted`, 0.75rem), onder de bubble of rechts ervan.

### 3.4 Visuele weergave per escalation tier (in de assistant-bubble)

De **inhoud** bepaalt de strengheid; de UI hoeft niet agressief te kleuren. Wel duidelijk onderscheid voor gebruikers die het verschil willen zien:

| Tier | Visuele hint (optioneel) | Doel |
|------|---------------------------|-----|
| **1** | Geen badge/label. Alleen bubble. | Neutraal, ondersteunend. |
| **2** | Klein tekstlabel onder de bubble: “Corrective” of “Patroon” (één woord). Kleur: `--text-muted` of `--accent-neutral`. | Signaal dat er correctie/patroon in zit, zonder te alarmeren. |
| **3** | Klein label: “Direct” of “Objectief”. Zelfde kleur als Tier 2; geen rode kleur. | Duidelijk dat dit de meest directe modus is. |

Geen grote waarschuwingsbanners of rode frames; blijf analytisch en rustig.

### 3.5 Loading-state van het antwoord

- **Tijdens wachten op AI**: Onder het laatste user-bericht een “assistant”-placeholder:
  - Optie A: Drie puntjes (animated) in een bubble-achtige container.
  - Optie B: Korte zin “Analyseren…” of “Een moment…” in dezelfde bubble-stijl.
- Geen “typing”-avatar; wel toegankelijk (aria-live, zie sectie 10).

---

## 4. Berichttypen & Structuur

### 4.1 User-bericht

- **Inhoud**: Alleen de door de gebruiker getypte tekst (geen automatische toevoegingen in de bubble).
- **Weergave**: Eén bubble; geen opdeling in “vragen” vs “opmerkingen”; de engine en prompt bepalen de reactie.

### 4.2 Assistant-bericht – algemeen

Elk antwoord van de assistant volgt in principe de **drielagen-analyse** (consequence → action → root cause) en bij escalation het **confrontation protocol** (statement → evidence → analysis → correction). In de UI hoeft dat niet letterlijk in vier aparte blokken; wel kan de structuur in de tekst herkenbaar zijn (bijv. korte alinea’s of lijstjes).

### 4.3 Assistant-bericht – structuur in de tekst (wat de gebruiker ziet)

- **Tier 1 (Adaptive)**  
  - Geen harde confrontatie.  
  - Antwoord: analytisch, energy-sensitive, ondersteunend.  
  - Mogelijke structuur: korte samenvatting van wat je zei → analyse (consequence/action/root cause) → suggestie of vraag. Geen verplichte kopjes in de UI; de AI schrijft vloeiende tekst die deze lagen volgt.

- **Tier 2 (Corrective)**  
  - Eén zin direct statement (geen bijvoeglijke naamwoorden), dan evidence, dan analysis, dan structured correction.  
  - In de bubble: gewoon één doorlopende tekst; eventueel eerste zin visueel benadrukt (vet) zodat de “direct statement” opvalt.

- **Tier 3 (Hard objective)**  
  - Zelfde structuur als Tier 2, maar scherper en objectiever.  
  - In de bubble:zelfde weergave; optioneel klein label “Direct” onder de bubble (zie 3.4).

### 4.4 Optionele UI-opdeling binnen één assistant-bericht

Als je de structuur expliciet wilt tonen (voor leesbaarheid en vertrouwen):

- **Secties** (alleen bij Tier 2/3):  
  - **Statement** (één zin).  
  - **Evidence** (data, feiten).  
  - **Analysis** (root cause).  
  - **Correction** (concrete stappen).  

Implementatie: backend kan optioneel `sections: { statement, evidence, analysis, correction }` in de response meesturen; frontend rendert die als kleine koppen of bold-labels boven de alinea’s. Als de backend alleen platte tekst stuurt, dan geen secties; dan is de tekst zelf al in die volgorde geschreven.

### 4.5 Lengte en scroll

- Lange antwoorden: gewoon scrollen binnen de message list; bubbles groeien verticaal. Geen “lees meer”-knop nodig; wel zorgen dat focus en scroll-naar-onder logisch zijn (zie toegankelijkheid).

---

## 5. Denkwijze van de assistant

Dit is wat de gebruiker **ervaart** als “hoe de assistant denkt”: geen implementatiedetail, maar het beloofde gedrag.

### 5.1 Drielagen-analyse (altijd)

De assistant analyseert gedrag altijd in drie lagen:

1. **Consequence** – Wat er gebeurd is (resultaat, feiten).  
2. **Action** – Wat gedaan of vermeden is (gedrag).  
3. **Root cause** – Waarom (energie, structuur, vermijding, identiteit, moed).

De gebruiker hoeft die termen niet te zien; de antwoorden zijn in gewone taal, maar volgen deze volgorde. Geen moraliseren, geen shaming.

### 5.2 Tone en stijl (altijd)

- **Analytisch, gestructureerd, precies.**  
- **Geen** emotionele opvulling, geen motivatie-clichés (“je kunt het!”), geen valse empathie.  
- **Wel** duidelijk, respectvol en system-focused: het gaat om gedrag en systeem, niet om “slecht zijn”.

### 5.3 Energie-adaptatie

- **Lage energie** (bijv. laag in state): striktheid omlaag; korter, zachter, geen zware confrontatie.  
- **Hoge energie + patroon/afwijking**: engine kan Tier 2/3 kiezen; dan volgt de assistant het confrontation protocol (statement → evidence → analysis → correction).

### 5.4 Wat de assistant nooit doet (voor de gebruiker zichtbaar)

- Geen diagnose van mentale stoornissen.  
- Geen persoonlijkheidstrekken labelen (“jij bent een uitsteller”).  
- Geen shaming.  
- Geen confrontatie zonder data (als er geen data is, zegt de assistant dat of vraagt om context).  

Als de engine in crisis-modus zit: geen escalation; de antwoorden blijven ondersteunend en niet confronterend.

### 5.5 Wat de gebruiker wél kan verwachten

- **Evidence**: cijfers, feiten, patronen (bijv. “X van de Y taken de afgelopen week overgedragen”).  
- **Reasoning**: korte uitleg waarom iets een patroon of root cause is.  
- **Structured correction**: concrete, uitvoerbare stappen of keuzes.  

Dit alles in gewone taal, geen jargon verplicht.

---

## 6. UI-states

### 6.1 Lege staat (geen berichten nog)

- **Titel**: “Assistant” (of “NEUROHQ Assistant”).  
- **Eerste blok tekst** (boven het invoerveld of in het midden van de message list):  
  - Korte welkomstzin, bijv. “Stel een vraag of beschrijf wat je bezighoudt. De assistant analyseert op basis van je gegevens en geeft evidence-based feedback.”  
- **Geen** lange uitleg; één tot twee zinnen.  
- **Placeholder** in het invoerveld: zie sectie 8.

### 6.2 Laden (wachten op antwoord)

- **Trigger**: User heeft op Verstuur geklikt; request is onderweg.  
- **Gedrag**:  
  - User-bericht staat direct in de lijst.  
  - Daaronder: loading-indicator (drie puntjes of “Analyseren…”).  
  - Verstuurknop en/of invoerveld disabled (voorkom dubbele requests).  
- **Timeout**: Na bijv. 30 s: toon foutmelding (zie 6.4) en re-enable invoer.

### 6.3 Succes (antwoord ontvangen)

- Loading verdwijnt; assistant-bericht wordt getoond met de ontvangen `response`-tekst.  
- Metadata (`escalationTier`, `identityAlert`, `courageFlag`) wordt opgeslagen bij het bericht (lokaal of in state) voor eventuele labels of identity/courage-UI (sectie 7).  
- Scroll naar onderen naar het nieuwe assistant-bericht.  
- Invoer weer enabled.

### 6.4 Fout (netwerk of server)

- **Bericht**: Eén regel, niet technisch, bijv. “Het antwoord kon niet worden geladen. Probeer het opnieuw.”  
- **Plaats**: Onder de loading-placeholder, of in plaats daarvan; of kleine banner boven het invoerveld.  
- **Actie**: Geen automatische retry; gebruiker kan opnieuw versturen.  
- **Logging**: Client of server logt de fout voor debugging; geen gevoelige data in UI.

### 6.5 Rate limit (te veel requests)

- **Bericht**: “Je hebt te veel berichten verstuurd. Wacht even en probeer het opnieuw.”  
- **Gedrag**: Invoer tijdelijk disabled (bijv. 30–60 s) of tot volgende succesvolle response, afhankelijk van backend-response (bijv. `429` met Retry-After).  
- **Tone**: Neutraal, geen shaming.

### 6.6 Crisis-modus (engine onderdrukt escalation)

- **Voor de gebruiker**: Geen aparte “crisis”-badge in de chat; de assistant antwoordt gewoon zachter en zonder confrontatie.  
- **Geen** mededeling zoals “Je bent in crisis”; dat is een intern signaal. De ervaring is: normale, ondersteunende antwoorden.

### 6.7 Eerste bericht (nog geen of weinig state)

- Als de engine nog weinig data heeft (nieuwe user, weinig check-ins): antwoorden blijven algemener; de assistant kan zeggen dat er nog weinig data is en om meer context vragen (check-in, taken). Geen valse precisie.

---

## 7. Identity- en courage-UI

### 7.1 Alleen indicatie, geen verplichte actie in chat

- **identityAlert** en **courageFlag** zijn backend-flags; ze bepalen mede de prompt (o.a. of identity/courage in het antwoord wordt meegenomen).  
- In de chat hoeft de gebruiker **niet** per se een aparte “Identity alert”- of “Courage”-badge te zien; het effect zit in de **tekst** van het antwoord.  
- Optioneel: klein, gedempt label onder de assistant-bubble, bijv. “Identiteit” of “Blootstelling” alleen als de feature flags aan staan en het antwoord daarover gaat. Geen grote banners.

### 7.2 Forced identity intervention (reconfirm / redefine / 7-day override)

Als de **backend** een forced intervention teruggeeft (bijv. via `identityIntervention: true` en een specifiek type), dan moet de gebruiker een **keuze** maken. Dat kan op twee manieren:

- **A. In de chat**: Onder het betreffende assistant-bericht drie knoppen (of links):  
  - “Bevestig identiteit” (reconfirm).  
  - “Herschrijf identiteit” (redefine).  
  - “7 dagen override”.  
  - Bij klik: actie naar backend (en eventueel navigatie naar identity-scherm bij redefine), en override wordt gelogd.  

- **B. Modal**: Zelfde drie keuzes in een modal die opent na het bericht; na keuze modal sluiten en eventueel naar identity-pagina.  

**Aanbeveling**: Optie A (in de chat) houdt de flow in één scherm; modal alleen als je de keuze heel prominent wilt maken.  
**Copy**: Korte, duidelijke knoppen; geen lange uitleg in de buttontekst. Eventueel één zin boven de knoppen: “Kies hoe je verder wilt.”

### 7.3 Defensive identity (“Your current identity appears defensive”)

- Dit is **tekst** in het assistant-bericht (als feature flag aan en probability > 0.7).  
- In de UI: gewoon deel van de bubble; geen aparte card.  
- De assistant moet daarbij **data comparison**, **risk delta** en **structured choice** geven (zie 100% analyse); dat is inhoud van dezelfde bubble.

### 7.4 Courage

- **Courage attribution** alleen als energy ≥ 6, capacity, geen overload, pattern avoidance.  
- In de chat: eventueel klein label “Blootstelling” onder de bubble als `courageFlag` true is; verder geen aparte courage-UI behalve de inhoud van het antwoord.

---

## 8. Copy & Microcopy

### 8.1 Vaste teksten (Nederlands; Engels kan parallel)

| Element | Tekst (NL) | Opmerking |
|--------|------------|-----------|
| **Pagina-/header-titel** | Assistant | Of: NEUROHQ Assistant |
| **Subtitel (optioneel)** | Evidence-based gedragsarchitectuur | Eén regel |
| **Lege staat** | Stel een vraag of beschrijf wat je bezighoudt. De assistant analyseert op basis van je gegevens en geeft evidence-based feedback. | Max twee zinnen |
| **Placeholder input** | Bericht aan assistant… | Of: Vraag of beschrijf je situatie… |
| **Verstuurknop (aria)** | Verstuur bericht | Tooltip optioneel |
| **Loading** | Analyseren… | Of: Een moment… |
| **Fout netwerk/server** | Het antwoord kon niet worden geladen. Probeer het opnieuw. | |
| **Rate limit** | Je hebt te veel berichten verstuurd. Wacht even en probeer het opnieuw. | |
| **Tier 2 label (optioneel)** | Patroon | Of: Corrective |
| **Tier 3 label (optioneel)** | Direct | Of: Objectief |
| **Identity-keuze (boven knoppen)** | Kies hoe je verder wilt. | |
| **Knop reconfirm** | Bevestig identiteit | |
| **Knop redefine** | Herschrijf identiteit | |
| **Knop override** | 7 dagen override | |

### 8.2 Geen teksten

- Geen “Typ een bericht” als enige placeholder (te vaag).  
- Geen “AI denkt na” (we willen “assistant”/systeem, niet “AI” in de voorgrond).  
- Geen grapjes of emoji’s in systeemcopy; blijf neutraal en professioneel.

---

## 9. Technische integratie

### 9.1 Waar in de app

- **Route**: `app/(dashboard)/assistant/page.tsx` (of gelijkwaardig). Layout: zelfde dashboard-layout (bottom nav, max-width, theming).  
- **State**: Client-side: lijst van berichten (user + assistant) met bij elk assistant-bericht: `{ text, escalationTier, identityAlert, courageFlag, timestamp }`. Optioneel: conversationId als je later threads per user wilt opslaan.

### 9.2 API

- **Endpoint**: `POST /api/assistant/message` (Next.js Route Handler of Server Action die intern de engine + AI aanroept).  
- **Request**: `{ message: string }` (+ userId uit sessie).  
- **Response**:  
  `{ response: string, escalationTier: number, identityAlert: boolean, courageFlag: boolean }`  
  Optioneel: `sections: { statement?, evidence?, analysis?, correction? }` als je gestructureerde weergave wilt.  
- **Flow**: Request → server haalt state op → crisis guard → escalation engine → decision object → prompt builder → AI-call → log indien tier > 1 of override → return response + metadata.

### 9.3 State- en data-oplevering

- Server haalt voor de engine op: user state (energy, focus, sensoryLoad, avoidanceTrend, identityAlignmentScore, stabilityIndex, courageGapScore, …), eventueel recente check-ins, taken, identity quarter.  
- Geen state in de frontend voor “escalation berekenen”; dat gebeurt 100% server-side. Frontend toont alleen wat de API teruggeeft.

### 9.4 Persistentie van gesprekken

- **Versie 1**: Geen persistentie; berichten alleen in client state (bijv. React state of een context). Bij refresh is de lijst leeg.  
- **Versie 2**: Berichten per user opslaan (bijv. `assistant_messages` of `conversation_turns` in Supabase): `user_id`, `role` (user/assistant), `content`, `escalation_tier`, `identity_alert`, `courage_flag`, `created_at`. Bij laden van `/assistant` laatste N berichten ophalen en tonen.  
- **Threads**: Later optioneel `thread_id` voor meerdere gesprekken; voor nu één lopende thread per user is voldoende.

### 9.5 Beveiliging

- Geen API-key in de frontend; alle AI- en engine-calls server-side.  
- Auth: alleen ingelogde users kunnen `POST /api/assistant/message` aanroepen (middleware of check in de route).  
- Rate limiting op de message-endpoint (bijv. X requests per minuut per user).

---

## 10. Toegankelijkheid

### 10.1 Focus

- Bij openen van de pagina: focus naar het invoerveld (of naar “Skip to main” als je skip-link hebt).  
- Na verzenden van een bericht: focus kan in het invoerveld blijven (voor snel opnieuw typen).  
- Na ontvangen antwoord: optioneel focus naar het nieuwe assistant-bericht (voor screen readers); of expliciet “Antwoord ontvangen” melden via aria-live.

### 10.2 Live regions

- **Loading**: `aria-live="polite"` op de container van “Analyseren…”, zodat screen readers melden dat er een antwoord komt.  
- **Nieuw antwoord**: `aria-live="polite"` op de message list of op het laatste assistant-bericht, zodat het nieuwe antwoord wordt voorgelezen (of een korte melding “Nieuw antwoord ontvangen”).

### 10.3 Toetsenbord

- Tab: header → message list (of skip) → invoerveld → verstuurknop → eventueel knoppen bij identity-keuze.  
- Enter in invoerveld: verstuur (zelfde gedrag als knop). Shift+Enter: nieuwe regel (geen versturen).  
- Geen verplichte toetscombinaties; standaard browser- en form-gedrag.

### 10.4 Semantiek

- **Header**: `<header>` met titel.  
- **Message list**: `<ul>` of `<div role="log" aria-label="Gesprek">` zodat het als log wordt gezien.  
- **Berichten**: Elk bericht een `<li>` of `<article>` met `aria-label="Bericht van gebruiker"` / “Bericht van assistant”.  
- **Invoer**: `<form>` met `<label>` voor het veld (visueel verborgen indien nodig), `<textarea>` of `<input type="text">`, en submit-knop.

### 10.5 Contrast en thema

- Bestaande design tokens voldoen aan contrast-eisen; geen extra kleuren voor de chat.  
- Alle teksten via `--text-primary` / `--text-secondary` / `--text-muted`; focus rings via `--accent-focus`.

---

## 11. Flows

### 11.1 Normale flow (bericht versturen en antwoord krijgen)

1. User opent `/assistant` (via nav).  
2. Ziet lege staat of eerdere berichten (als je persistentie hebt).  
3. Typt in het invoerveld.  
4. Klikt Verstuur (of Enter).  
5. User-bericht verschijnt direct; loading “Analyseren…” verschijnt; invoer disabled.  
6. Server: state ophalen → crisis check → escalation engine → decision → prompt → AI → log indien nodig → response.  
7. Client ontvangt `{ response, escalationTier, identityAlert, courageFlag }`.  
8. Loading verdwijnt; assistant-bericht wordt getoond (eventueel met tier-label).  
9. Scroll naar onderen; invoer weer enabled.  
10. User kan opnieuw typen en versturen.

### 11.2 Flow bij forced identity-keuze

1. Assistant-bericht bevat een vraag om te kiezen (reconfirm / redefine / override).  
2. Onder het bericht verschijnen drie knoppen.  
3. User kiest een optie.  
4. Client stuurt keuze naar backend (bijv. `POST /api/assistant/identity-choice` met `{ choice: "reconfirm" | "redefine" | "override" }`).  
5. Backend logt de keuze (identity_events) en past state/feature flags aan.  
6. UI: knoppen verdwijnen of worden disabled; eventueel korte bevestiging (“Gekozen: 7 dagen override”) in de chat of als toast.  
7. Bij “Herschrijf identiteit”: redirect naar identity-/settings-pagina indien van toepassing.

### 11.3 Flow bij fout

1. User verstuurt bericht.  
2. Request faalt (netwerk of 5xx).  
3. Loading blijft kort of wordt vervangen door foutmelding: “Het antwoord kon niet worden geladen. Probeer het opnieuw.”  
4. Invoer weer enabled; user kan opnieuw proberen.

### 11.4 Flow bij rate limit

1. User heeft te veel berichten in korte tijd verstuurd.  
2. Backend retourneert 429.  
3. Client toont: “Je hebt te veel berichten verstuurd. Wacht even en probeer het opnieuw.” en disabled invoer tijdelijk (of tot Retry-After).  
4. Na wachttijd: invoer weer enabled.

---

## 12. Edge cases & Grenzen

### 12.1 Lege of zeer korte user-berichten

- **Client**: Verstuurknop disabled als alleen witruimte. Optioneel: trim en blokkeer lege string.  
- **Server**: Als toch een lege of alleen-spatie bericht binnenkomt: return 400 of een korte message “Stel een vraag of beschrijf je situatie.”; geen AI-call.

### 12.2 Zeer lange user-berichten

- **Client**: Optioneel max length (bijv. 2000 tekens) met teller “X/2000”.  
- **Server**: Harde limiet (bijv. 2000 of 4000 tekens); overschot afkappen of 400 retourneren met duidelijke fout.

### 12.3 Zeer lange assistant-antwoorden

- Geen afkapping; volledige tekst tonen met scroll. Geen “Lees meer” tenzij je bewust wilt samenvatten (niet aanbevolen voor transparantie).

### 12.4 Geen state (nieuwe user)

- Engine retourneert tier 1; prompt bevat weinig of geen user-specifieke data. Assistant antwoordt algemeen en kan vragen om check-in of taken in te vullen. Geen valse precisie of confrontatie.

### 12.5 Crisis of overload

- Crisis guard op server zorgt dat escalation wordt onderdrukt. Chat toont geen “crisis”-modus; gebruiker krijgt gewoon zachte, ondersteunende antwoorden.

### 12.6 Duplicate submit

- Invoer en knop disabled tijdens loading; na response weer enabled. Geen dubbele request voor hetzelfde bericht.

### 12.7 Sessie verloopt tijdens typen

- Bij 401 op message-endpoint: redirect naar login of toon “Sessie verlopen. Log opnieuw in.” en link naar login. Bericht in het veld kan lokaal blijven (niet per se opslaan tot na login).

### 12.8 Offline

- Geen specifieke offline-modus in v1; bij netwerkfout zie 6.4. Later: optioneel “Je bent offline” als `navigator.onLine === false` en disable invoer.

---

## Samenvatting: wat je nu hebt

- **Positionering**: Eigen route `/assistant` + entry via nav.  
- **Chatbox**: Header, scrollbare berichtenlijst, vast invoerblok; bubbles voor user en assistant; optionele tier-labels.  
- **Visueel**: Tokens van de app; geen rode escalation-kleuren; loading en foutstates gedefinieerd.  
- **Denkwijze**: Drielagen (consequence, action, root cause); confrontation protocol bij Tier 2/3; tone en grenzen (nooit shamen/diagnosticeren). **Gesprek**: check-in (hoe gaat het, hoe voel je je qua energie), suggesties (wat te doen), boeken voorstellen, reflectieve vragen (uitgaven, uitstel); zie ASSISTANT_BRAIN_BEHAVIOR_MAP.md sectie 12.  
- **Identity/courage**: Optionele labels; forced choice met drie knoppen; defensive identity in de tekst van de bubble.  
- **Copy**: Nederlandse teksten voor alle vaste UI-elementen.  
- **Technisch**: Route, API-contract, state, optionele persistentie, auth en rate limiting.  
- **Toegankelijkheid**: Focus, aria-live, toetsenbord, semantiek.  
- **Flows**: Normaal, identity-keuze, fout, rate limit.  
- **Edge cases**: Lege/te lange berichten, geen state, crisis, duplicate submit, sessie, offline.

Met dit document kun je de chatbox, het uiterlijk, de denkwijze en alle randgevallen concreet implementeren zonder vage aannames.

---

## Appendix A – Prompt builder input (voor implementatie)

Dit is wat de server **minimaal** aan de AI moet meegeven, zodat de antwoorden aansluiten bij de denkwijze en de UI.

### A.1 System prompt (vast, altijd mee)

```
You are a behavioral architecture assistant operating under the NEUROHQ framework.

CORE RULES:
- Always analyze consequence, action, and root cause. Never moralize. Never shame.
- When escalation is triggered (tier 2 or 3): confront first in one sentence (no adjectives), then evidence, then analysis, then structured correction.
- Adapt strictness to energy level: lower energy = softer, shorter, no heavy confrontation.
- Validate energy claims against activity data when relevant.
- Identity alignment and courage attribution only when supported by evidence and criteria.

TONE: Analytical, structured, precise. No emotional fluff, no motivational clichés.

COMMUNICATION QUALITY (deftig communiceren):
- Communicate clearly, respectfully, and substantively. Use full sentences and coherent text; avoid telegram style and bare bullet lists unless deliberately chosen.
- Tier 1: Responses may be extensive and nuanced; each of the three layers (consequence, action, root cause) can span multiple sentences. Ask a concrete follow-up question where relevant.
- Tier 2 and 3: Follow the fixed structure (statement → evidence → analysis → correction), but formulate each part fully – not minimal one-liners. The user must understand why something is said and what the next step is.
- Stay within the rules (no shaming, no moralizing, always evidence-based), but be substantive: the answer must genuinely help the user move forward, not just tick a box.

CONVERSATION, SUGGESTIONS, BOOKS, REFLECTIVE QUESTIONS:
- Have a real conversation: ask how things are going, how the user feels (energy/focus), and follow up on what they say. Goal: context and trust, not small talk.
- Give suggestions for what to do (today, this week) based on energy, tasks, calendar, and primary focus. Concrete and feasible; options, not commands.
- Suggest books that align with primary focus or learning goals; briefly explain why they fit.
- Ask reflective questions about spending, postponing, or prioritization when data supports it: ask what the user thinks causes it or if they want to explore the pattern. No accusation; use data + open question.
- Stay within the framework: evidence-based, no shaming, system-focused. Conversation and suggestions support analysis; they do not replace it.

NEVER: Diagnose mental disorders, label personality traits, shame the user, escalate during crisis, confront without data.
ALWAYS: Provide evidence, explain reasoning, offer structured correction, stay system-focused.
```

(Zie ook **ASSISTANT_BRAIN_BEHAVIOR_MAP.md** sectie 11 – Communicatiekwaliteit / Deftig communiceren.)

### A.2 Context per request (injecteren in system of user prompt)

- **Decision object**: `escalationTier` (1 | 2 | 3), `identityAlert` (boolean), `courageFlag` (boolean).  
  - Bij tier 2/3: instructie om het confrontation protocol te volgen (statement → evidence → analysis → correction).  
  - Bij identityAlert en flag aan: mag identity-alignment meenemen in antwoord.  
  - Bij courageFlag en flag aan: mag exposure/courage meenemen, alleen als energy ≥ 6 en geen overload.  
- **State (samenvatting)**: energy, focus, sensoryLoad, sleepHours, avoidanceTrend, identityAlignmentScore, stabilityIndex (geen ruwe IDs). Korte zin zoals: “User state: energy X, focus Y, avoidance trend Z, …”.  
- **Feature flags**: confrontationLevel, identityIntervention, defensiveIdentityDetection, courageAttribution, energyFactCheck – bepalen wat de AI mag doen (bijv. defensive identity-zin alleen als defensiveIdentityDetection true).  
- **Crisis**: Als crisis guard actief is, expliciet in context: “Crisis/overload state: do not escalate; respond supportively only.”

### A.3 User prompt (per bericht)

- De letterlijke `message` van de gebruiker.  
- Optioneel: “Current context: [korte samenvatting van state].” zodat de AI energie/patroon kan meewegen.

### A.4 Response-verwachting

- Eén doorlopende tekst (of secties als je `statement`/`evidence`/`analysis`/`correction` apart teruggeeft).  
- Geen markdown-headers verplicht; wel mag de AI korte alinea’s of lijstjes gebruiken voor leesbaarheid.  
- Geen handtekening (“— NEUROHQ”); gewoon eindigen met de inhoud.
