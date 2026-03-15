# Settings surfaces audit

Where payday, personality, and other user-specific settings are read and written. Server = Supabase (source of truth). Client = localStorage or in-memory (optimistic/cache only).

## Payday (last_payday_date, payday_day_of_month)

| Surface | Reads from | Writes to | Notes |
|--------|------------|-----------|--------|
| users table | Server | Server | Authoritative. Used by getBudgetPeriodBounds, getFinanceState, getPaydayDayOfMonth. |
| client-persisted-payday (localStorage) | Client | Client | Optimistic only. PaydayCard writes here on "Vandaag loon gehad" then syncs to server; sync on load pushes to server. |
| client-pending-budget (localStorage) | Client | Client | Short-lived optimistic snapshot; cleared after sync. |
| PaydayCard | persisted + pending + server props | updateBudgetSettings, setPaydayReceivedToday | Uses derivePaydayDisplay; after mutate calls router.refresh(). |
| BudgetSummaryCard, budget page | Server (getBudgetSettings, finance state) | updateBudgetSettings | |
| getBudgetPeriodBounds, getFinanceState | Server (users) | — | |

## Personality (push_personality_mode)

| Surface | Reads from | Writes to | Notes |
|--------|------------|-----------|--------|
| user_preferences | Server | Server | Authoritative. |
| SettingsPush | Server (initial from page) | savePrefs (updateUserPreferences) | |
| Cron (hourly/daily/weekly), push-personality | Server (user_preferences) | — | |
| behavioral-notification-context | Server | — | |

## Other preferences (usual_days_off, day_off_mode, theme, compact_ui, etc.)

| Surface | Reads from | Writes to | Notes |
|--------|------------|-----------|--------|
| user_preferences | Server | Server | Authoritative. |
| Settings page | getUserPreferencesOrDefaults (server) | updateUserPreferences | revalidatePath("/dashboard") on save. |
| ThemeProvider, ThemeHydrate | getUserPreferencesOrDefaults | updateUserPreferences | |
| master-missions, dashboard-data, tasks page | getUserPreferencesOrDefaults | — | |

## Merge rules

- Payday: Server wins after sync. Client persisted payday is used for immediate UI after "Vandaag loon gehad" until server responds; then router.refresh() loads server state.
- Preferences: No client cache for preferences; server only. Settings page gets initial from server; mutations call revalidatePath so next load is fresh.

## Recommended consistency

- All mutations (updateBudgetSettings, updateUserPreferences) already call revalidatePath("/dashboard") and/or router.refresh() from callers.
- client-persisted-payday: treat as optimistic-only; after sync, rely on server for display (router.refresh() or settings read-through).
