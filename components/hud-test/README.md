# Cinematic HUD Assets & Export

Deze map bevat de testbare component-set voor de cinematic HUD.

## Token export

Gebruik `design-tokens/hud-figma-tokens.json` als bron voor Figma token import.

## Asset export regels

- **Default vector:** exporteer iconen als `SVG`
- **Fallback raster:** exporteer ook `@1x`, `@2x`, `@3x` PNG
- **Naming convention:**
  - `hud_btn_primary@2x.png`
  - `hud_btn_glass@2x.png`
  - `hud_ring_ticks.svg`
  - `hud_graph_point.svg`
  - `hud_nav_indicator.svg`

## Richtlijnen

- Gebruik geen witte basisfills in gradients.
- Glows altijd als aparte laag, niet als 1 grote blur.
- Houd stroke widths consistent per icon set.

## Visuele testflow

1. `npm run test:visual:capture`
2. Plaats/vergelijk met `tests/visual/golden/*`
3. `npm run test:visual:diff`

