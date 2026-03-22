# Protocol content import

Protocols beschreven in `Updates 22 03.md` (lange sectie) zijn **content packs**: fasen, weken, taken, examens.

**Aanpak:** definieer een JSON-schema per protocol (fases → weken → taken) en seed via migratie of admin-only import. Koppel aan `mission_chain` / learning streams wanneer de Growth-engine klaar is.

**Implementatie in repo (D.3):**

- Migratie `089_protocol_library_stub.sql` — tabel `protocol_library` (slug, locale, title, body_md, …).
- Migratie `090_protocol_definition_and_progress.sql` — kolom `definition_json` (PHASES → WEEKS → taken + scaling) en tabel `user_protocol_progress`.
- Canonieke seed: `lib/protocols-seed-full.json` (o.a. Language Acquisition System, Focus-blok, Recovery pacing — inhoud uit Updates 22-03-structuur).
- Klein voorbeeld: `lib/protocols-seed-sample.json` (stub).
- Import: `npm run import-protocols` (default: `protocols-seed-full.json`; override: `PROTOCOLS_SEED=protocols-seed-sample.json`). Vereist service role + env.
- UI: `/learning` — protocolkaarten, modal met tier (easy/medium/hard), week-nav, taken afvinken (persist in `user_protocol_progress`).
