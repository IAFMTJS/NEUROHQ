# Assistant: geavanceerd – herkennen, leren, geheugen, toon

**Doel**: De bot moet kunnen herkennen *wat* je noemt (taak vs. doel/skill), dat opslaan en later hergebruiken ("leren uit antwoorden"), plus gespreksgeheugen en tone-varianten.

---

## 1. Probleem: de bot "weet" niet wat iets is

- Je zegt **"eten maken"** of **"japans leren"**. De bot echo’t nu alleen de zin en vraagt "Wanneer ga je dat doen?" – maar hij herkent niet dat "eten maken" een **taak** is en "japans leren" een **doel/skill**.
- Om **verder te kunnen helpen** hoeft de bot niet encyclopedisch te "weten" wat Japans of koken is. Hij moet:
  1. **Herkennen** dat je iets noemt (taak of doel/skill).
  2. **Opslaan** wat je zei (per user).
  3. **Later hergebruiken** in zinnen ("Hoe ga je vandaag met Japans verder?", "Eten maken vanavond. Zet het in je agenda?").

Dat is **leren uit antwoorden**: wat je noemt wordt opgeslagen en in volgende antwoorden gebruikt.

---

## 2. Entity-herkenning (taak vs. doel/skill)

**Geen grote NLP-database.** Wel simpele, rule-based herkenning:

| Patroon (NL) | Type | Voorbeeld |
|--------------|------|-----------|
| "X leren", "leren X", "X willen leren" | **goal** / **skill** | "japans leren", "gitaar leren" |
| "X maken", "X doen", "X schrijven", korte actie-zin | **task** | "eten maken", "mail beantwoorden" |

- **Extractie**: uit het bericht halen we één item: `{ type: 'task' | 'goal' | 'skill', content: string }`.
- **Opslag**: in `assistant_user_context`: user_id, content, type, created_at. Bijv. de laatste 10–20 per user (of laatste 30 dagen) behouden.
- **Gebruik**:
  - **Task**: "Eten maken. Wanneer ga je dat doen?" of later "Eten maken vanavond. Zet het in je agenda?" (als user "vanavond" zegt).
  - **Goal/skill**: andere follow-up: "Japans leren. Wat is de kleinste stap om vandaag te beginnen?" of "Hoe ga je vandaag met Japans verder?" (waar "Japans" uit opgeslagen context komt).

De bot hoeft het begrip "Japans" of "eten maken" niet te kennen; hij slaat de **tekst** op en gebruikt die in templates.

---

## 3. Leren uit antwoorden (opslaan + hergebruiken)

- **Bij elk bericht** waar we een taak of doel herkennen: insert in `assistant_user_context` (user_id, content, type).
- **Bij het samenstellen van een antwoord**: recente context ophalen (laatste taken, laatste doelen). Templates kunnen dan:
  - `{recent_goal}` gebruiken: "Hoe ga je vandaag met {recent_goal} verder?"
  - `{recent_task}` voor tijd: "{recent_task} vanavond. Zet het in je agenda?"

Zo "leert" de bot door **te onthouden wat jij noemt** en dat in volgende zinnen te gebruiken. Geen externe kennisbank nodig.

---

## 4. Gespreksgeheugen (laatste beurt)

- **Opslaan**: Na elke assistant-response: laatste user-bericht, type response (concrete_action_follow_up, uncertainty, …), laatst geëxtraheerd item (content + type). Bijv. in `assistant_conversation_turn` (één rij per user, steeds overschrijven).
- **Gebruik**: Volgende bericht kan een **vervolg** zijn op die beurt:
  - User zei "eten maken" → bot: "Wanneer ga je dat doen?"  
  - User zegt nu "vanavond" → bot: "Eten maken vanavond. Zet het in je agenda?"
  - Herkenning: kort bericht ("vanavond", "straks", "morgen") + er staat een task in last turn → interpretatie: user geeft tijd voor die task.

Zo blijft het gesprek **aan elkaar gelinkt** zonder dat elke vraag/antwoord in een DB staat.

---

## 5. Tone-varianten (zacht vs. direct)

- Per pool (of per zin) **twee varianten**: zachter (lage energie / moeilijke dag) en directer (hogere energie / strategic).
- **Regel**: bijv. `energy < 5` of `energy <= 4` → zachte variant; anders directe.
- Voorbeeld:
  - Direct: "Wat is de kleinste uitvoerbare stap?"
  - Zacht: "Wat zou vandaag één kleine stap kunnen zijn?"

Geen aparte DB: gewoon twee arrays of objecten per pool in code.

---

## 6. Technische stappen (implementatie)

| Stap | Wat |
|------|-----|
| DB | `assistant_user_context` (user_id, content, type, created_at); `assistant_conversation_turn` (user_id, last_*, updated_at) |
| Extractie | `lib/assistant/entity-extraction.ts`: extractMentionedItem(message) → { type, content } \| null. Patronen: "X leren" → goal; anders concrete actie → task. |
| Opslaan | Na response: als er een item geëxtraheerd is → insert user_context; altijd last turn updaten. |
| Ophalen | Bij request: getAssistantUserContext(userId), getLastTurn(userId). Doorgeven aan assembleResponse. |
| Response | assembleResponse krijgt userContext + lastTurn. Templates gebruiken recent_goal, recent_task; bij "vanavond"/"straks" + last_task → "X vanavond. Zet het in je agenda?" |
| Tone | Per pool soft/direct; kiezen op basis van state.energy. |

---

## 7. Samenvatting

- **Herkennen**: taak vs. doel/skill via simpele patronen ("X leren" → goal; korte actie → task).
- **Leren**: wat je noemt wordt opgeslagen in `assistant_user_context` en in volgende antwoorden hergebruikt (templates met {recent_goal}, {recent_task}).
- **Geheugen**: laatste beurt in `assistant_conversation_turn`; korte tijdwoorden ("vanavond") koppelen we aan de laatste task.
- **Toon**: zachte vs. directe variant per pool; keuze op basis van energy.
- De bot hoeft **niet** te "weten" wat Japans of eten maken is; hij moet het alleen **onthouden** en in zinnen gebruiken.
