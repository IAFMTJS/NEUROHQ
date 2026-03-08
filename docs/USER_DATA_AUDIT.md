# User data audit — Supabase overview

Use this to get a **full, detailed overview** of everything stored in Supabase for a given user and to spot double or unneeded data.

## 1. Run the SQL overview

1. Open **Supabase Dashboard → SQL Editor**.
2. Open `supabase/scripts/user_data_overview.sql`.
3. To audit another user: find-replace `b7fc6c46-b8ca-41f4-8ece-938a34d014de` with that user’s `id` (UUID).
4. Run the script:
   - **Run section 1 first** → you get one result set: every table name and its row count for this user. Use this to see which tables hold data and where duplication might exist.
   - **Run sections 2–3** as needed → full row detail per table (and indirect tables via strategy/mission_chain).

## 2. What the SQL gives you

- **Section 1**  
  Single result: `table_name`, `row_count` for all user-scoped tables. No row means 0 rows for that user.

- **Section 2**  
  Full `SELECT *` per table for this user. Some tables are limited (e.g. last 500 rows) to keep results manageable.

- **Section 3**  
  Tables linked via other tables: `alignment_log`, `strategy_review`, `mission_chain_steps` (via strategy_focus / mission_chains).

- **Section 4**  
  Inline notes on which tables are loaded by both dashboard and game/identity flows, and ideas to use the same Supabase tables instead of loading twice.

## 3. Double data / “load 2 times”

- **Same table, multiple app loads**  
  The *data* in Supabase is stored once per user. “Double data” in the sense of “loading 2 times” means the **app** calls the same tables from different flows (e.g. dashboard + game state).  
  See **docs/duplicate-load-analysis.md** for:
  - Which flows load `user_xp`, `user_streak`, `daily_state`, `tasks`, `getFinanceState`, etc.
  - Where `getGameState()` and dashboard both hit the same tables.
  - Suggestions to consolidate (e.g. one “game state” or “identity + XP” fetch reused by dashboard and HQ).

- **Actual duplicate rows**  
  If section 1 shows unexpected counts (e.g. multiple rows in a table that should be 1 row per user), that can indicate duplicate or stale rows. The detailed `SELECT *` in section 2 helps inspect those.

## 4. Tables that are 1:1 with the user

These should have **at most one row** per user. If count > 1, that’s a data issue:

- `users`, `user_xp`, `user_streak`, `user_identity_engine`, `user_reputation`, `user_preferences`, `mission_state`, `behavior_profile`, `user_behavior`, `user_gamification`, `strategy_check_in`, `assistant_conversation_turn`, `assistant_feature_flags`

(Some tables like `feature_flags` can have multiple rows per user by design.)
