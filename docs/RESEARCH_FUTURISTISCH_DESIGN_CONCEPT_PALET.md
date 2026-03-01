# Research: Futuristisch design binnen NEUROHQ-concept en kleurenpalet

Onderzoek gedaan om een futuristisch design te onderbouwen dat **past bij het NEUROHQ-concept** en **binnen jullie bestaande thema’s en palet** blijft.

---

## 1. Jullie concept en palet (samenvatting)

### Concept
- **NEUROHQ** = “HQ” voor je brein/mentale staat: energie, focus, taken, agenda, assistant, modi, missies, learning, analytics.
- Complexiteit: gedragsengine, state, crisis-signalen, escalation, modi, taken, agenda, budget, XP, etc.
- Doel: dat complexe systeem in een **simpel, futuristisch jasje** – niet alles tegelijk tonen.

### Kleurenpalet (default: Normal, Dark)
| Token | Waarde | Gebruik |
|-------|--------|---------|
| `--bg-primary` | #0B1220 | Achtergrond |
| `--bg-surface` | #121A2A | Kaarten, panels |
| `--bg-elevated` | #162033 | Verhoogde lagen |
| `--accent-focus` | #00E5FF | Focus, primaire actie |
| `--accent-energy` | #00FFC6 | Energie, positief |
| `--accent-warning` | #FF7A1A | Waarschuwing |
| `--accent-neutral` | #2A3A52 | Borders, secundair |
| `--text-primary` | #E6F1FF | Hoofdtekst |
| `--text-secondary` | #8FA3BF | Secundaire tekst |
| `--text-muted` | #5F6C80 | Muted |

Glows: focus, energy, warning (cyan/mint/oranje).  
Thema’s: **Normal** (cyan/teal), **Girly** (roze/mauve), **Industrial** (blauw/grijs, scherpe radii).

---

## 2. Onderzoeksbevindingen

### 2.1 Futuristische minimal UI (donker + cyan/teal)
- **Donker-first** met **één sterke accentkleur** (cyan/teal) voor focus en actie; rest neutraal/grijs.
- Glows **spaarzaam**: alleen voor key metrics of primaire actie, niet overal.
- **Mission-focused widgets**: data in duidelijke “pods”, glanceable.
- **Clean typography**, subtiele grid/lijnen; geen decoratieve rommel.
- Referenties: command-center-achtige dashboards, “spaceship cabin” met diep donker (#0B0312–#170954) + cyan (#6BD0E2).

### 2.2 Sci-fi UI-principes (The Expanse, 2001, etc.)
- **Simplicity through intentionality**: complexiteit mag, maar interface moet intuïtief en bruikbaar zijn.
- **Abstraction**: informatie abstracteren zodat je snel begrijpt wat er aan de hand is; geen real-world-kopie.
- **Hidden complexity**: trade-off tussen schermruimte, aantal pagina’s, abstractieniveau en interactie; niet alles op één scherm.

### 2.3 Linear / Raycast-achtige producten
- Donker, minimal, “designed to the last pixel”.
- **Eén duidelijke actie** per context; keyboard-first; weinig visuele ruis.
- Hiërarchie via **typography en spacing**, niet via veel kleuren.

### 2.4 Single-accent strategie (2024)
- **Eén accent** met 3 ondersteunende variabelen (base, foreground, content) i.p.v. meerdere concurrerende accenten.
- Donkere UI: accent kan “terugvallen”; lichtere grijzen of minder saturatie voor hiërarchie.
- **Neutrale grijzen dominant**; accent alleen voor emphasis. Hiërarchie vooral via **gewicht en spacing**.

### 2.5 Progressive disclosure
- **Eerst alleen het essentiële**; advanced/extra op aanvraag (expand, tab, aparte view).
- **Eén primaire actie** blijft focus; geen drastische contextwisseling.
- Wat je eerst toont = signaal van wat belangrijk is.

### 2.6 Cyan/teal op donkerblauw
- Combinaties donkerblauw + cyan/teal worden veel gebruikt voor **tech/futuristisch**.
- Contrast: voor tekst op accent (of accent op donker) AA/AAA checken; jullie #00E5FF op #0B1220 is sterk; bodytekst op accent moet donker (jullie `color: var(--bg-primary)` op buttons klopt).

---

## 3. Vertaling naar NEUROHQ

### Wat behouden (past bij onderzoek)
- **Donker + cyan/teal** als basis (Normal theme): sluit aan bij futuristic minimal.
- **Diepe blauwen** (#0B1220, #121A2A): goed voor “command center”-gevoel.
- **Bestaande tokens** (bg, surface, text-primary/secondary/muted): geschikt voor hiërarchie zonder extra kleuren.
- **Drie thema’s**: zelfde principes (één accent, rust, hiërarchie), andere tokens – onderzoek ondersteunt “één accent per thema”.

### Wat aanscherpen (uit onderzoek)
- **Accentgebruik**: in de UI vooral **één** accent als “primary” (focus); energy/warning alleen voor echte status (energie, waarschuwing), niet als decoratie. Glows alleen voor focus-state of één key metric.
- **Eén kaartstijl**: één basisstijl (subtiele border/schaduw,zelfde radius); accent alleen voor de *enige* primaire blok of CTA.
- **Hiërarchie**: typography (1 titel, 1 body, eventueel 1 label) + spacing; niet nog meer kleuren.
- **Progressive disclosure**: boven de vouw max. 2–3 blokken; “Wat nu?” + vandaag + één samenvatting; rest uitklapbaar of aparte pagina.
- **Geen extra “futuristische” rommel**: geen onnodige grid-lines, geen extra neon; jullie bestaande glows al spaarzaam inzetten.

### Wat expliciet niet (uit onderzoek)
- Meerdere gelijkwaardige accenten naast elkaar.
- Alles tegelijk tonen om “kracht” te laten zien.
- Decoratieve glows of kaartranden overal.

---

## 4. Aanbeveling: “simpel futuristisch” binnen jullie palet

- **Concept**: Blijft “complex systeem, simpel jasje”; research ondersteunt verbergen van complexiteit en één duidelijke focus.
- **Kleuren**: Palet blijft; **accent = focus** als primaire kleur in de UI; energy/warning alleen voor echte energie- en waarschuwings-UI; rest neutraal (grijs/secondary/muted).
- **Visuele taal**: Eén kaartstijl, meer witruimte, minder blokken zichtbaar, één startpunt (“Wat nu?”).
- **Thema’s**: Zelfde regels voor Girly en Industrial: per thema één accent,zelfde hiërarchie en rust.

Hiermee is de research rond en sluit het aan op `UI_DESIGN_VISIE_SIMPEL_FUTURISTISCH.md` voor de concrete richting en volgorde van aanpassingen.
