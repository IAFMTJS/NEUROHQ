import type { GreetingLocale } from "@/types/preferences.types";

/** Client-only persona keys (localStorage). Mirror of server `user_preferences` for instant HQ header. */
export const PERSONA_STORAGE = {
  callsign: "neurohq-callsign",
  hqHeadline: "neurohq-hq-headline",
  greetingLocale: "neurohq-greeting-locale",
} as const;

export const PERSONA_UPDATED_EVENT = "neurohq-persona-updated";

export type PersonaGreetingLocale = GreetingLocale;

export function parseGreetingLocale(raw: string | null | undefined): PersonaGreetingLocale {
  return raw === "nl" ? "nl" : "en";
}

/** Push server-backed persona into localStorage and notify HQ header. */
export function applyServerPersonaToLocalStorage(prefs: {
  display_callsign?: string | null;
  hq_headline?: string | null;
  greeting_locale?: GreetingLocale | null;
}): void {
  if (typeof window === "undefined") return;
  try {
    const c = prefs.display_callsign?.trim();
    if (c) window.localStorage.setItem(PERSONA_STORAGE.callsign, c.slice(0, 24));
    else window.localStorage.removeItem(PERSONA_STORAGE.callsign);

    const h = prefs.hq_headline?.trim();
    if (h) window.localStorage.setItem(PERSONA_STORAGE.hqHeadline, h.slice(0, 40));
    else window.localStorage.removeItem(PERSONA_STORAGE.hqHeadline);

    window.localStorage.setItem(PERSONA_STORAGE.greetingLocale, parseGreetingLocale(prefs.greeting_locale ?? null));

    window.dispatchEvent(new CustomEvent(PERSONA_UPDATED_EVENT));
    window.dispatchEvent(new CustomEvent("neurohq-callsign-updated"));
  } catch {
    // ignore
  }
}
