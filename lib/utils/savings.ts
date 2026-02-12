export function weeklyRequired(targetCents: number, currentCents: number, deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  const end = new Date(deadline);
  if (end <= now) return 0;
  const weeks = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const remaining = Math.max(0, targetCents - currentCents);
  return Math.ceil(remaining / weeks);
}
