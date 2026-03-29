/**
 * In-app HQ alerts only (`user_alerts` inbox): dashboard-driven rows and `emitUserAlert`.
 * Does not affect web push (cron, reminders, pending push sweep for existing rows).
 *
 * - When `NEUROHQ_INBOX_ALERTS_PAUSED` is true: no new inbox rows from dashboard sync or emitUserAlert.
 * - Re-enable inbox without deploy: set `NEUROHQ_INBOX_ALERTS_ENABLED=1` in the environment.
 */
export const NEUROHQ_INBOX_ALERTS_PAUSED = true;

function envDisablesInboxAlerts(): boolean {
  const v = process.env.NEUROHQ_INBOX_ALERTS_DISABLED;
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

/** When true, new HQ inbox rows are not created (cron pushes still run). */
export function isNeurohqInboxAlertsPaused(): boolean {
  if (process.env.NEUROHQ_INBOX_ALERTS_ENABLED === "1") return false;
  if (NEUROHQ_INBOX_ALERTS_PAUSED) return true;
  return envDisablesInboxAlerts();
}
