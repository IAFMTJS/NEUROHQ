# Supabase scripts

## Brain state (daily_state) controleren

**Waar wordt brain state opgeslagen?**  
In de tabel **`public.daily_state`** (Supabase). De app slaat "Hoe voel je je vandaag?" daar op via `saveDailyState()` → `supabase.from("daily_state").upsert(...)`.

**SQL-script om te controleren:**

1. Ga in Supabase naar **SQL Editor**.
2. Open of plak het script: **`check_brain_state_daily_state.sql`**.
3. Run het script.

Je ziet dan o.a.:
- Welke kolommen `daily_state` heeft (o.a. `energy`, `focus`, `sensory_load`, `social_load`, `sleep_hours`, `auto_master_missions_generated`).
- Recente rijen (laatste 14 dagen) met eventueel `users.email`.
- **Rijen voor “vandaag” (Europe/Amsterdam)** — handig om te zien of er een rij is voor jouw user op de dag dat je brain status hebt gezet.

Als je met de **anon key** (RLS) werkt, zie je alleen je eigen rijen. Met **service_role** (bijv. in SQL Editor zonder RLS) zie je alle users.

---

## Lokaal koppelen aan Supabase

Zodat brain state en auto-missies goed werken:

1. **Kopieer env-variabelen**
   - Vanuit de projectroot: `cp .env.example .env.local`
   - Vul in `.env.local` de echte waarden (geen voorbeeldwaarden committen).

2. **Verplicht voor brain state + auto-missies**
   - `NEXT_PUBLIC_SUPABASE_URL` — project-URL (Supabase Dashboard → Project Settings → API).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key (zelfde pagina).
   - `SUPABASE_SERVICE_ROLE_KEY` — **service_role** key (zelfde pagina, "Reveal" bij service_role).  
     Nodig zodat de server `daily_state` kan lezen en auto-missies kan aanmaken (o.a. op de mission-pagina).

3. **Controleren of de koppeling werkt**
   - App lokaal starten: `npm run dev` (of `pnpm dev`).
   - Brain status zetten op het dashboard ("Hoe voel je je vandaag?").
   - In Supabase **SQL Editor** het script `check_brain_state_daily_state.sql` draaien en kijken of er een rij voor **vandaag (Europe/Amsterdam)** en jouw user bij staat.
   - Mission-pagina openen: als alles goed staat, zouden er auto-missies moeten zijn (of de juiste melding als er geen zijn).

4. **Tijdzone**  
   De app gebruikt overal **Europe/Amsterdam** voor "vandaag" (`todayDateString()`). De datum in `daily_state.date` hoort diezelfde "vandaag" te zijn; het SQL-script toont die datum expliciet.
