export type GreetingLocale = "en" | "nl";

/** Time-of-day greeting for the HQ header (matches user locale choice). */
export function greetingForHour(hours: number, locale: GreetingLocale): string {
  if (locale === "nl") {
    if (hours < 12) return "Goedemorgen";
    if (hours < 17) return "Goedemiddag";
    return "Goedenavond";
  }
  if (hours < 12) return "Good morning";
  if (hours < 17) return "Good afternoon";
  return "Good evening";
}
