# Protocol content import

Protocols beschreven in `Updates 22 03.md` (lange sectie) zijn **content packs**: fasen, weken, taken, examens.

**Aanpak:** definieer een JSON-schema per protocol (fases → weken → taken) en seed via migratie of admin-only import. Koppel aan `mission_chain` / learning streams wanneer de Growth-engine klaar is.

**Implementatie in repo (D.3):**

- Migratie `089_protocol_library_stub.sql` — tabel `protocol_library` (slug, locale, title, body_md, …).
- Voorbeeld JSON: `lib/protocols-seed-sample.json`.
- Importscript: `node scripts/import-protocols-json.mjs` (vereist service role + env).
