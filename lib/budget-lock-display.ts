import { format } from "date-fns";
import { nl } from "date-fns/locale";

/** Full date + 24h clock for lock end (NL). */
export function formatLockEndDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return format(new Date(iso), "d MMMM yyyy · HH:mm", { locale: nl });
  } catch {
    return null;
  }
}

/** Compact strip / tab label. */
export function formatLockEndShort(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return format(new Date(iso), "d MMM · HH:mm", { locale: nl });
  } catch {
    return null;
  }
}
