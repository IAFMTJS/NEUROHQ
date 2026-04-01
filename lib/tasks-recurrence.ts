/** ISO weekday 1=Mon .. 7=Sun. JS getDay() 0=Sun..6=Sat so ISO = getDay() || 7 */
function getISOWeekday(d: Date): number {
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

export function computeNextRecurrenceDate(
  dueDate: string,
  recurrenceRule: string | null | undefined,
  recurrenceWeekdays: string | null | undefined
): string | null {
  if (!recurrenceRule) return null;
  const base = new Date(dueDate + "T12:00:00Z");

  if (recurrenceRule === "daily") {
    base.setUTCDate(base.getUTCDate() + 1);
    return base.toISOString().slice(0, 10);
  }

  if (recurrenceRule === "weekly" && recurrenceWeekdays?.trim()) {
    const raw = recurrenceWeekdays.trim();
    const daysPart = raw.includes("days=") ? raw.split("days=")[1].split(";")[0] : raw.split("|")[0];
    const intervalPart = raw.includes("interval=") ? Number(raw.split("interval=")[1].split(/[;|]/)[0]) : 1;
    const intervalWeeks = Number.isFinite(intervalPart) && intervalPart > 1 ? Math.floor(intervalPart) : 1;
    const weekdays = daysPart
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => n >= 1 && n <= 7);
    if (weekdays.length === 0) {
      base.setUTCDate(base.getUTCDate() + 7);
      return base.toISOString().slice(0, 10);
    }
    const currentIso = getISOWeekday(base);
    const sorted = [...weekdays].sort((a, b) => a - b);
    const laterThisCycle = sorted.find((d) => d > currentIso);
    const nextDay = new Date(base);
    if (laterThisCycle != null) {
      nextDay.setUTCDate(nextDay.getUTCDate() + (laterThisCycle - currentIso));
      return nextDay.toISOString().slice(0, 10);
    }
    const firstWeekday = sorted[0] ?? currentIso;
    nextDay.setUTCDate(nextDay.getUTCDate() + intervalWeeks * 7 + (firstWeekday - currentIso));
    return nextDay.toISOString().slice(0, 10);
  }

  if (recurrenceRule === "weekly") {
    base.setUTCDate(base.getUTCDate() + 7);
    return base.toISOString().slice(0, 10);
  }

  if (recurrenceRule === "monthly") {
    if (recurrenceWeekdays?.includes("monthday=")) {
      const monthDay = Number(recurrenceWeekdays.split("monthday=")[1].split(/[;|]/)[0]);
      const d = Number.isFinite(monthDay) ? Math.max(1, Math.min(31, Math.floor(monthDay))) : base.getUTCDate();
      const targetMonth = base.getUTCMonth() + 1;
      const targetYear = base.getUTCFullYear() + Math.floor(targetMonth / 12);
      const monthIdx = targetMonth % 12;
      const lastDay = new Date(Date.UTC(targetYear, monthIdx + 1, 0, 12, 0, 0)).getUTCDate();
      base.setUTCFullYear(targetYear, monthIdx, Math.min(d, lastDay));
      return base.toISOString().slice(0, 10);
    }
    const day = base.getUTCDate();
    base.setUTCMonth(base.getUTCMonth() + 1);
    if (base.getUTCDate() !== day) base.setUTCDate(0);
    return base.toISOString().slice(0, 10);
  }

  return null;
}
