"use client";

import { isUiSpeechEnabledClient } from "@/lib/audio/ui-feedback-storage";
import { PERSONA_STORAGE, parseGreetingLocale } from "@/lib/user-persona-storage";

/** Speak one line via Web Speech API; cancels any in-progress utterance. */
export function speakUi(text: string): void {
  if (typeof window === "undefined" || !isUiSpeechEnabledClient()) return;
  const syn = window.speechSynthesis;
  if (!syn || !text.trim()) return;
  try {
    syn.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    const locRaw =
      typeof window !== "undefined" ? window.localStorage.getItem(PERSONA_STORAGE.greetingLocale) : null;
    u.lang = parseGreetingLocale(locRaw) === "nl" ? "nl-NL" : "en-US";
    u.rate = 1;
    u.volume = 0.92;
    syn.speak(u);
  } catch {
    /* ignore */
  }
}

export function cancelUiSpeech(): void {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}
