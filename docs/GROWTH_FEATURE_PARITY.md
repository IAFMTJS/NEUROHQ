# Growth — feature-parity checklist (D.2) — audit 2025-03

Doel: Growth naderen aan de betrouwbaarheid en UX van Mission/Budget.

| Gebied | Mission/Budget referentie | Status | Notities |
|--------|---------------------------|--------|----------|
| Notificaties | Push + gedrag | Gedeeltelijk | Learning gebruikt algemene cron; growth-specifieke triggers kunnen later op learning-streaks |
| Snapshot / cache | Dashboard bootstrap | OK | Growth leest via learning page + HQ `gameState` voor adaptive hint |
| Offline / PWA | Lokale queue | Open | `OfflineQueueSync` globaal; learning entries niet apart geaudit |
| Settings | Eén plek voor toggles | Gedeeltelijk | Geen apart growth-settings-subpanel; kan later |
| Progress export | `SettingsExport` | Open | Geen dedicated learning-exportrij; aligneren indien nodig |
| Consistente modals/toasts | Sonner + Modal | OK | Streams/growth gebruiken zelfde patronen; tokens via `--semantic-*` waar van toepassing |
| Adaptive preview (D.3) | DCIC brain | OK | `GrowthAdaptiveHint` + `lib/growth/adaptive-engine.ts` (stub) |

**Protocolbibliotheek:** zie `PROTOCOLS_CONTENT_IMPORT.md`, `GROWTH_ADAPTIVE_ROADMAP.md`, migratie `089`, importscript `scripts/import-protocols-json.mjs`.
