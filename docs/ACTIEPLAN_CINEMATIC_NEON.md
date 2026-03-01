# Actieplan: Full Cinematic Neon Design

Doel: de app visueel brengen naar het niveau van de referentie (cinematic neon, space theme, glassmorphism, neon accents, mascot met halo). Geen half werk – alles wat nodig is wordt geïmplementeerd in code.

---

## Wat ik nodig heb (van jou)

1. **Optioneel: achtergrondafbeelding**  
   De referentie gebruikt een diepe space/nebula-achtergrond. We kunnen:
   - **Zonder asset:** een puur CSS-achtergrond gebruiken (starfield SVG + gradient-nebula’s). Dat doen we standaard zodat het direct werkt.
   - **Met asset:** als je een bestand hebt (bijv. `BACKGROUND.PNG` of een space/nebula image), plaats het in `public/` en we laten de body dat als laag gebruiken (naast de CSS-lagen).

2. **Niets anders**  
   De rest (tokens, componenten, layout) doen we in code.

---

## Wat we gaan doen (concreet)

### 1. Achtergrond (cinematic space)

- **Body:** vaste, fullscreen achtergrond met:
  - Donkere navy base (`#050816` → `#0A0F25`).
  - CSS starfield (herhaald SVG of gradient-circles) voor sterren.
  - Nebula-achtige gradients (blauw/paars, zacht, groot) voor diepte.
  - Één centrale “light source” (radial gradient) rond 50% 35% (cyan/blue) voor focus.
  - Vignette aan de randen zodat de content centraal blijft.
- **Fallback:** als `BACKGROUND.PNG` niet bestaat, blijft dezelfde look door alleen CSS (geen 404).

### 2. Design tokens (neon + glass)

- Nieuwe/uitgebreide tokens in `:root`:
  - **Cinematic background:** `--cinematic-navy`, `--cinematic-nebula`, `--cinematic-radial-top/mid/bottom`, `--cinematic-glow-cyan`, `--starfield` (SVG of gradient).
  - **Glass:** `--glass-bg`, `--glass-border`, `--glow-depth`, `--glow-stack-cyan`, `--glow-stack-purple`, etc.
  - **Neon CTA:** `--neon-btn-gradient` (blue → purple → pink), `--neon-btn-shadow` (multi-layer glow).
  - **Nav:** `--nav-active-glow` voor de actieve tab.
  - **Progress bars:** `--bar-energy-gradient`, `--bar-focus-gradient`, `--bar-load-gradient` (voor Brain Status e.d.).
- Bestaande tokens (`--bg-main`, `--accent-*`, `--text-main`, etc.) blijven; we vullen alleen aan.

### 3. Cards (glassmorphism + neon rand)

- Alle “panel”-cards (inclusief Brain Status, mission cards, calendar, strategy, etc.):
  - Semi-transparante achtergrond (`rgba(15, 25, 55, 0.5)` of token) + `backdrop-filter: blur(20px)`.
  - Dunne border met lichte neon (cyan/paars gradient of token).
  - Box-shadow: diepte + zachte neon-stack (cyan/purple) zoals in de referentie.
  - Optioneel: subtiele inner highlight (top) voor 3D-gevoel.
- Classes: bestaande `.card`, `.glass-card`, `.hq-card` worden in globals (of één cinematic stylesheet) zo overschreven/uitgebreid dat ze overal hetzelfde cinematic glass + neon gedrag krijgen.

### 4. Primary button (“BEGIN MISSION” / Start Mission)

- Full neon-stijl:
  - Gradient: blue → purple → pink (horizontaal), overeenkomend met referentie.
  - Multi-layer box-shadow (cyan + purple glow).
  - Witte, bold tekst; geen dubbele border.
  - Hover: iets sterkere glow; active: scale(0.98).
- Toepassen op:
  - Dashboard: de grote “Start Mission”-link (CommanderHomeHero).
  - Overige primary actions die dezelfde CTA moeten zijn (bijv. “Begin mission” in tasks/assistant waar van toepassing).
- Implementatie: class `.primary-btn` en/of `.neon-button` (of één unified class) in CSS; componenten gebruiken die class.

### 5. Stat rings (Energy / Focus / Load)

- Blijven circulair met percentage; visueel aansluiten bij cinematic:
  - Sterkere neon arc (gradient stroke of conic met heldere kleuren).
  - Zachte glow rond de ring (per variant: cyan, blue, amber).
  - Binnenkant donker houden zodat de arc “uit het donker” komt.
- Bestaande `RadialMeter` en `CommanderStatRing` behouden; alleen CSS/tokens aanpassen voor sterkere neon en betere aansluiting op de rest.

### 6. Bottom navigation

- Bar zelf:
  - Donker, semi-transparant, `backdrop-filter: blur(20px)`.
  - Pill-vorm (afgeronde hoeken), subtiele rand en depth shadow.
  - Optioneel: zeer lichte cyan top-highlight.
- Actieve tab:
  - Neon accent (cyan of primary blue) op icoon + tekst.
  - Kleine glow rond het actieve item en/of onderstreep (zoals in referentie).
- In code: bestaande `BottomNavigation` behouden; CSS aanpassen zodat `.nav-item.active` (of de class die we gebruiken) bovenstaande krijgt. Geen extra wrapper nodig tenzij we een “pill” per item willen; dat kan met border-radius + padding.

### 7. Mascot (Commander HQ)

- Sterke blauw-paarse halo achter de mascot:
  - `filter: drop-shadow` meerdere lagen (blue/purple) of een achterliggende div met gradient + blur.
  - Zorgen dat de mascot het dominante element blijft (niet overspoeld door rest van de UI).
- Positie en grootte zoals nu (hero boven op dashboard); alleen de glow versterken in CSS.

### 8. Typography & kleur

- Tekst: wit/lichtgrijs; belangrijke titels eventueel met zeer subtiele text-shadow (neon) voor leesbaarheid op donkere achtergrond.
- Geen grote font-wijzigingen; bestaande Plus Jakarta Sans blijft. Alleen waar nodig een lichte glow op headings/CTA.

### 9. Overige schermen

- Zelfde design language:
  - Zelfde body-achtergrond (fixed).
  - Zelfde glass cards + neon randen.
  - Zelfde button-stijl voor primary actions.
  - Zelfde bottom nav.
- Pagina’s die nu andere cards/buttons gebruiken (tasks, budget, learning, strategy, report, settings) krijgen geen aparte “theme”; ze gebruiken dezelfde tokens en classes zodat het overal cinematic neon is.

### 10. Technische keuzes

- **Eén plek voor cinematic styling:** alle tokens en cinematic-specifieke regels in `app/globals.css` (of één dedicated `cinematic-neon.css` die we in `layout.tsx` importeren na globals). Geen versnipperde theme files voor dit doel.
- **Geen breaking changes:** bestaande class names (`.card`, `.primary-btn`, `.nav-item`, `.glass-card`, etc.) blijven; we overschrijven of extenden alleen de stijl.
- **Performance:** `backdrop-filter` alleen waar nodig (cards, bottom nav); background fixed zodat scroll geen repaint van de achtergrond triggert.
- **Toegankelijkheid:** contrast van tekst en focus states behouden; neon is visueel, niet alleen kleur-afhankelijk voor info.

---

## Volgorde van uitvoering

1. Tokens + body-achtergrond (starfield + nebula + vignette) in globals.
2. Cards: glassmorphism + neon border/shadow.
3. Primary button: neon gradient + glow.
4. Stat rings: neon arcs + glow (tokens + component-CSS).
5. Bottom nav: glass bar + active neon state.
6. Mascot: halo (drop-shadow / gradient div).
7. Kleine afstelling: typography glow waar nodig, consistentie over alle pagina’s.

Daarna is het full cinematic neon design in code af en kun je eventueel nog een eigen BACKGROUND.PNG toevoegen voor extra diepte.
