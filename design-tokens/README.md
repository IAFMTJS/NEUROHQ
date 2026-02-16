# Commander Design System v2 – Tokens

Single source of truth: **`commander-v2.json`** (zie `New styling idea/Design System Architecture v2 met.md`).

## Lagen

1. **Primitive** – Kleuren, spacing (8pt grid), radius, opacity. Geen component gebruikt deze direct.
2. **Semantic** – background, text, border, status. Alle componenten gebruiken alleen semantic (of component) tokens.
3. **Component** – o.a. `button_primary`: gradient `primary_cta`, shadow `purple_glow` / `button_active`, state matrix.
4. **Theme** – Dark (accent_primary = cyan), Minimal (#000, #FFF).

## Gebruik

- **CSS** in `app/globals.css` volgt deze structuur: primitives → semantic → component → theme overrides.
- Voor **Style Dictionary**-export: gebruik `commander-v2.json` als input; references `{primitive.color...}` kunnen worden omgezet naar waarden in een build step.
