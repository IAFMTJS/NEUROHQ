/**
 * NEUROHQ – iCal (RFC 5545) format voor iOS / Apple Kalender.
 * Gebruikt voor subscribe-URL en .ics-export.
 */

export type ICalEvent = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
};

function escapeIcalText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcalDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

/**
 * Genereert een iCalendar string (VCALENDAR met VEVENTs) voor Apple Calendar / iOS.
 */
export function toIcal(events: ICalEvent[], options?: { productId?: string; title?: string }): string {
  const productId = options?.productId ?? "NEUROHQ";
  const title = options?.title ?? "NEUROHQ Agenda";
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//" + productId + "//iCal//NL",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:" + escapeIcalText(title),
    "METHOD:PUBLISH",
  ];
  for (const e of events) {
    const summary = escapeIcalText(e.title || "Agenda");
    const uid = "neurohq-" + e.id + "@neurohq";
    const dtstart = formatIcalDate(e.start_at);
    const dtend = formatIcalDate(e.end_at);
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:" + now,
      "DTSTART:" + dtstart,
      "DTEND:" + dtend,
      "SUMMARY:" + summary,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
