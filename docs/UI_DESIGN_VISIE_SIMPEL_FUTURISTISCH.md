# UI-designvisie: ingewikkeld in een simpel, futuristisch jasje

**Gevoel**: Het past niet meer bij de app; het wordt te chaotisch. Het hoort **iets heel ingewikkelds in een zo simpel mogelijk, futuristisch jasje** te zijn.

---

## 1. Principe

- **Binnenkant**: complex (gedragsengine, state, taken, agenda, budget, assistant, analytics, strategy, learning, …).
- **Buitenkant**: simpel, rustig, futuristisch – één duidelijke hiërarchie, weinig visuele ruis, geen “alles tegelijk”.

Dus: **complexiteit verbergen achter een eenvoudige, toekomstgerichte interface**, niet alles op één scherm proppen.

---

## 2. Waarom het chaotisch voelt

- **Te veel blokken op één pagina**: HQ-header, brain status, energy bar, quote, mode banner, avoidance notice, active mission, calendar, quarter, adaptive banner, analytics widget, learning streak, reality report, pattern insight, … Veel kaarten en secties concurreren om aandacht.
- **Veel kaartstijlen**: `card-modern`, `card-modern-accent`, borders, glows, verschillende radii. Geen duidelijke “één soort oppervlak”.
- **Veel accenten**: focus, energy, warning, neutral, glows. Visueel druk.
- **Geen duidelijke “eerste actie”**: niet helder wat de *éne* belangrijkste volgende stap is.
- **Informatie overal**: cijfers, teksten, knoppen, links door elkaar. Moeilijk om te scannen.

---

## 3. Richting: simpel + futuristisch

### Simpel

- **Minder zichtbaar tegelijk**: niet alles op het dashboard; “lagen” of “één hoofdlijn” + de rest op aanvraag (tap, scroll, sectie).
- **Eén duidelijke hiërarchie**: 1) wat nu (één zin of één kaart), 2) wat vandaag, 3) de rest pas als je verder kijkt.
- **Minder kaarttypes**: één basisstijl (subtiel, rustig), accent alleen voor de *enige* primaire actie of status.
- **Meer witruimte / lucht**: minder vol, meer adem.
- **Progressive disclosure**: details (energy breakdown, analytics, quarter) niet standaard groot; uitklappen of aparte view.

### Futuristisch

- **Strak, donker-first**: diepe achtergrond, weinig “decoratie”, geen rommel.
- **Minimale accenten**: één sterke accentkleur (bv. cyan/teal) voor focus en actie; de rest grijs/neutraal.
- **Duidelijke typografie**: één titel-niveau, één body-niveau; geen zes varianten.
- **Subtiele beweging**: alleen waar het betekenis heeft (bv. bevestiging, loading), niet overal animatie.
- **Geen “speels” of druk**: geen emoji’s of iconen tenzij functioneel; geen opgeleukte kaartranden.

---

## 4. Concreet: wat kan er gebeuren

### A. Dashboard versimpelen

- **Eén “vandaag”-blok**: één kaart of één regel: “Vandaag: [energie] · [één volgende stap]” of “Wat nu: [taak of assistant]”. De rest (brain status, energy bar, quote, mode) kan:
  - in die ene kaart zitten (compact), of
  - een laag dieper (bij tap/klik), of
  - naar een apart “Status” / “HQ”-scherm.
- **Minder blokken boven de vouw**: max. 2–3 duidelijke elementen (bijv. “Wat nu” + “Vandaag” + “Agenda/quote” als één regel of één kaart).
- **Quote, calendar, analytics, learning streak**: niet allemaal als grote kaarten; opties:
  - in één “Meer vandaag”-sectie met korte regels,
  - of achter “Bekijk meer” / tab of tweede scherm.

### B. Visuele taal vereenvoudigen

- **Eén kaartstijl**: bv. `card-simple`: subtiele border of schaduw,zelfde radius overal, geen glows tenzij voor focus-state.
- **Accentkleur spaarzaam**: alleen voor primaire actie (bv. “Ga naar taken” / “Praat met assistant”) en voor “nu actief”-status.
- **Tekst**: primair + muted; geen derde kleur tenzij noodzakelijk.
- **Iconen**: consistent (één set), alleen waar ze snelheid geven; niet overal.

### C. Navigatie en “wat nu”

- **Eén startpunt**: bij openen van de app: één vraag of één zin (“Wat nu?” of “Volgende stap”) + één duidelijke actie (taak, assistant, of “Bekijk vandaag”). De rest is secundair.
- **Bottom nav**: zo min mogelijk items (bijv. HQ, Assistant, Taken, Meer) zodat het niet druk voelt.
- **Quick-add**: past bij “simpel”: één veld, geen extra uitleg tenzij nodig.

### D. Themas (normal, girly, industrial)

- **Zelfde structuur**, andere tokens: kleur en radius kunnen per thema, maar aantal blokken en hiërarchie blijven hetzelfde. Zo blijft “simpel futuristisch” overeind.

---

## 5. Volgorde (als je gaat bouwen)

1. **Visie vastleggen**: dit doc + beslissing: “één hoofdlijn + rest verborgen/uitklapbaar” vs. “meerdere lagen (tabs)” vs. “alles blijft, maar visueel rustiger”.
2. **Tokens en kaartstijl**: één `card-simple`, accentgebruik beperken, typografie terugbrengen tot 2–3 niveaus.
3. **Dashboard herinrichten**: “Wat nu” + max. 2–3 blokken; quote/calendar/analytics/streak samenvatten of verplaatsen.
4. **Andere pagina’s**: taken, assistant, instellingen in dezelfde visuele taal (zelfde kaart,zelfde accentregel).
5. **Details**: spacing, focus states, loading; geen grote nieuwe features, wel consistentie.

---

## 6. Korte samenvatting

| Nu | Richting |
|----|----------|
| Veel blokken, veel kaartstijlen | Eén duidelijke hiërarchie, één kaartstijl |
| Alles zichtbaar | “Wat nu” + rest op aanvraag / samengevat |
| Meerdere accenten en glows | Eén accent, spaarzaam; rest neutraal |
| Druk, vol | Meer witruimte, minder elementen |
| Onduidelijk wat eerst | Eén startpunt: “Wat nu?” of “Volgende stap” |

**Kern**: De app *is* complex; de UI hoeft dat niet te tonen. Eén simpel, futuristisch jasje: rustig, strak, één focus per scherm.
