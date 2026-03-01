# A11y — Contrast & motion checklist

- **Geen pure #000:** Gebruik `#050810` of `--bg-primary` (off-black) i.p.v. `#000000` voor achtergronden.
- **Layered grays:** Tekst: `--text-main`, `--text-soft`, `--text-muted`; geen harde zwart/wit alleen.
- **Reduced-motion:** Toggle in Settings (Weergave) + `[data-reduced-motion="true"]` in CSS; `prefers-reduced-motion` in globals.
- **Contrast (WCAG AA):** Tekst op achtergrond min. 4.5:1; grote tekst 3:1. Donkere theme: lichte tekst op donkere bg.
- **Focus ring:** Zichtbare focus ring op knoppen/links (`--focus-ring`, `focus:ring-2`).
