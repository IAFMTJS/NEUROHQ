# Assistant: response engine – content, koppeling, adaptiviteit

**Vragen**: Hebben we een hele database aan vragen en antwoorden nodig? Hoe linken we die aan elkaar? Hoe maken we het adaptief en intuïtief met slimme antwoorden?

---

## 1. Hebben we een hele DB nodig?

**Nee, niet per se.** Het kan op twee manieren:

### Optie A: Pools in code (huidige aanpak)

- **Waar**: Arrays in `lib/assistant/response-assembly.ts` (DIAGNOSTIC, STRATEGIC, UNCERTAINTY_FOLLOW_UP, CONCRETE_ACTION_FOLLOW_UP, etc.).
- **Voordelen**: Geen extra tabellen, geen migraties, makkelijk in git, snelle wijzigingen door developers.
- **Nadeel**: Content wijzigen = code deployen. Niet handig als niet-developers teksten willen beheren.

### Optie B: Content in DB (optioneel later)

- **Waar**: Tabel `assistant_interventions` met o.a. `id`, `mode` (strategic|diagnostic|reflective|…), `context` (default|uncertainty|concrete_action|deflection), `text_nl`, `sort_order`.
- **Voordelen**: Teksten bewerken via admin/UI of SQL zonder deploy. Makkelijker om de 200-intervention library gestructureerd in te laden.
- **Nadeel**: Extra schema, seed/migratie, engine moet uit DB lezen (of bij start cachen).

**Aanbeveling**: Start met **pools in code**. Als je later teksten door anderen wilt laten beheren of de volledige 200-intervention set wilt gebruiken, kun je een `assistant_interventions`-tabel toevoegen en de engine daaruit laten vullen (met fallback op code-pools).

---

## 2. Hoe laten we vragen/antwoorden aan elkaar linken?

Niet door elk antwoord aan één “volgende vraag” te koppelen, maar door **context + regels**:

### 2.1 Koppeling via context (per bericht)

| Laatste user-input type | Volgende response-type | Voorbeeld |
|-------------------------|------------------------|----------|
| **concrete_action**     | Doorbouwen op dat antwoord | "Eten maken" → "Eten maken. Wanneer ga je dat doen?" |
| **uncertainty**          | Concreet, kleine stap | "geen idee" → "Kies één ding dat binnen 30 min kan. Wat zou dat zijn?" |
| **deflection**           | Rustig omleiden       | "je moeder" → "Geen probleem. Wat staat er concreet op je lijst vandaag?" |
| **status_update**       | Mode bepaalt pool     | "Ging wel oké" → strategic/diagnostic pool |

De **link** is dus: *classificatie van het huidige bericht* → *keuze van pool en type reactie*. Geen aparte “volgende vraag”-ID in de content.

### 2.2 Koppeling via mode (state)

- **conversationMode** (strategic, diagnostic, reflective, pressure, stabilisation) kiest de **hoofdpool** (STRATEGIC, DIAGNOSTIC, REFLECTIVE, …).
- Binnen die pool: **seed** (state + bericht) kiest welke zin. Zo wisselen antwoorden zonder dat je elke vraag handmatig aan een volgende koppelt.

### 2.3 Optioneel: gespreksgeheugen (1–2 beurten)

Om nog meer “aan elkaar linken” te doen:

- **Opslaan**: Bij elke assistant-response optioneel `last_response_type` (bijv. `concrete_action_follow_up`) en `last_user_message` (bijv. "Eten maken") in sessie of in een `assistant_conversation_turn`-tabel.
- **Gebruiken**: Volgende request leest dat; als user dan "vanavond" zegt, kun je reageren met "Eten maken vanavond. Zet het in je agenda?" in plaats van een generieke vraag.

Dat is **niet** hetzelfde als een grote vraag–antwoord-DB: het is “laatste beurt onthouden” om de volgende zin logisch te laten aansluiten.

---

## 3. Hoe maken we het adaptief en intuïtief met slimme antwoorden?

### 3.1 Adaptief

- **State**: energy, avoidance, IAS, tier bepalen **mode** en daarmee toon (zachter bij lage energie, meer pressure bij tier 3). Dat gebeurt al.
- **Bericht**: intent + concrete_action / uncertainty / deflection bepalen **welke pool** en **welk type** zin (doorbouwen vs. nieuwe vraag vs. redirect). Ook dat doen we al.
- **Variatie**: seed = f(state, userMessage) zorgt dat verschillende berichten andere zinnen uit dezelfde pool geven, zodat het niet steeds dezelfde vraag is.

Optioneel extra:

- **Tone-varianten per pool**: per intervention een “zachte” en “directe” variant; kiezen op basis van energy of tier (bijv. energy &lt; 5 → zachte variant).
- **Laatste beurt** (zie 2.3): volgende zin expliciet laten aansluiten op “Eten maken” of “vanavond”.

### 3.2 Intuïtief

- **Voorspelbare logica**: altijd eerst kijken naar “heeft hij een concrete stap gegeven?” → daarop doorvragen. Anders “weet hij het niet?” → kleine-stap-vragen. Anders mode → passende pool. Gebruiker merkt: het systeem reageert op wat ik zeg.
- **Korte, duidelijke zinnen**: 1–2 zinnen, geen lange lappen tekst. Dat houdt de engine nu al aan.

### 3.3 Slimme antwoorden

- **Content**: Pools vullen met teksten uit de 200-intervention library en ASSISTANT_BRAIN_BEHAVIOR_MAP: evidence-based, geen labeling, geen shame, wel concrete vragen.
- **Selectie**: Niet willekeurig, maar door **regels**: concrete antwoord → doorbouwen; geen idee → kleinste stap; deflectie → één keer rustig omleiden; verder mode + state. Zo voelt het “slim” zonder AI.
- **Optioneel**: Bij tier 2/3 korte “statement → cijfers → vraag” (nu al bij pressure): dat voelt analytisch en onderbouwd.

---

## 4. Samenvatting

| Vraag | Antwoord |
|-------|----------|
| Hele DB aan vragen/antwoorden? | **Nee.** Pools in code zijn genoeg; later optioneel `assistant_interventions` in DB voor beheer/200-intervention set. |
| Hoe linken? | Via **context** (concrete_action / uncertainty / deflection) + **mode** (strategic / diagnostic / …). Optioneel: laatste beurt opslaan voor “volgende zin sluit aan op X”. |
| Adaptief & intuïtief? | **State** kiest mode en toon; **bericht-classificatie** kiest type reactie en pool; **seed** voor variatie. Geen vraag–antwoord-koppeling per rij; wel duidelijke regels. |
| Slimme antwoorden? | **Goede content** (curated pools) + **slimme selectie** (regels: doorbouwen op concreet, kleine stap bij onzekerheid, evidence bij pressure). |

De “link” zit dus in de **engine-logica** (welke pool, welk type reactie bij welk bericht en welke state), niet in een aparte vraag–antwoord-graaf in de database.

---

## 5. Uitbreiding: herkennen, leren, geheugen, toon (geïmplementeerd)

Zie **docs/ASSISTANT_ADVANCED_DESIGN.md** voor het volledige ontwerp. In het kort:

- **Entity-herkenning**: `lib/assistant/entity-extraction.ts` – "X leren" → goal/skill, korte actie → task. Opgeslagen in `assistant_user_context`.
- **Leren uit antwoorden**: Wat je noemt (taak/doel) wordt opgeslagen en in volgende antwoorden hergebruikt (templates met recent_goal, bv. "Hoe ga je vandaag met Japans verder?").
- **Gespreksgeheugen**: `assistant_conversation_turn` – laatste beurt; bij "vanavond" / "straks" → "Eten maken vanavond. Zet het in je agenda."
- **Tone**: Zachte varianten per pool (energy < 5) in response-assembly (STABILISATION_SOFT, STRATEGIC_SOFT, DIAGNOSTIC_SOFT).
