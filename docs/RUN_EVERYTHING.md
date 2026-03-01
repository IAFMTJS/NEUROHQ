# Alles uitvoeren (migraties, build, test)

## 1. Database-migraties

**Optie A — Supabase CLI (als project gekoppeld):**

Zie **`docs/SUPABASE_LINK.md`** voor stap-voor-stap: login, project ref, en `supabase link`. Daarna:

```bash
npx supabase link   # eenmalig: project ref koppelen (zie SUPABASE_LINK.md als dit faalt)
npx supabase db push
```

**Optie B — Handmatig in Supabase Dashboard:**

In **SQL Editor** voer je de bestanden in `supabase/migrations/` **in volgorde** uit (001 → 002 → … → 036). Zie ook `DEPLOY.md` sectie 1.4.

Nieuwe migraties die je lokaal hebt toegevoegd:

- `034_missions_performance_engine.sql`
- `035_emotional_state_resistance.sql`
- `036_economy_chains_pressure.sql`

## 2. Build

```bash
npm run build
```

## 3. Tests

```bash
npm test
```

## 4. Alles in één keer (build + test)

```bash
npm run run:all
```

Dit voert `npm run build` en daarna `npm run test` uit. Migraties moet je apart doen (zie boven).

## 5. Lint

Op Windows (project op niet-C: schijf) kan `next lint` soms falen. Gebruik dan:

```bash
npm run lint
```

(script is aangepast naar `next lint .`; als het nog faalt: `npx eslint .` of vanuit C: of WSL draaien.)
