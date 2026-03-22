/** Mirrors app/actions/strategy getStrategyCompletion — used by crons without a user session. */
export function quarterlyStrategyCompletionPercent(
  row: {
    one_word?: string | null;
    primary_theme?: string | null;
    identity_statement?: string | null;
    key_results?: string | null;
    north_star?: string | null;
    anti_goals?: string | null;
    savings_goal_id?: string | null;
  } | null
): number {
  if (!row) return 0;
  const kr = String(row.key_results ?? "").trim();
  const krOk = kr.length > 0 && kr.split(/\n/).filter(Boolean).length > 0;
  const items = [
    !!String(row.one_word ?? "").trim(),
    !!String(row.primary_theme ?? "").trim(),
    !!String(row.identity_statement ?? "").trim(),
    krOk,
    !!String(row.north_star ?? "").trim(),
    !!String(row.anti_goals ?? "").trim(),
    !!row.savings_goal_id,
  ];
  const done = items.filter(Boolean).length;
  return Math.round((done / 7) * 100);
}
