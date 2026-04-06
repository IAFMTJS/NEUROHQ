"use client";

import { playUiSound } from "@/lib/audio/ui-sounds";
import { isUiSpeechEnabledClient, UI_PERSONALITY_LS_KEY } from "@/lib/audio/ui-feedback-storage";
import { speakUi } from "@/lib/audio/ui-speech";
import { PERSONA_STORAGE, parseGreetingLocale } from "@/lib/user-persona-storage";

function personalityLine(nl: boolean, personality: string | null, callsign: string | null): string {
  const c = callsign?.trim() || null;
  if (nl) {
    if (personality === "drill") {
      if (c) return `Fout, ${c}. Je zit over budget.`;
      return "Je zit over budget. Pak het aan.";
    }
    if (personality === "chaos") {
      if (c) return `Oeps, ${c}. Je portemonnee protesteert.`;
      return "Over budget. Tijd om te remmen.";
    }
    if (personality === "friendly" || personality === "coach") {
      if (c) return `${c}, je zit net over budget. Eén rustige stap terug helpt.`;
      return "Je zit net over budget. Kleine correctie, groot verschil.";
    }
    if (c) return `${c}, je zit over budget.`;
    return "Je zit over budget.";
  }
  if (personality === "drill") {
    if (c) return `Bad call, ${c}. You are over budget.`;
    return "You are over budget. Fix it.";
  }
  if (personality === "chaos") {
    if (c) return `Yikes, ${c}. Wallet says no.`;
    return "Over budget. Time to slow the spend.";
  }
  if (personality === "friendly" || personality === "coach") {
    if (c) return `${c}, you are slightly over budget. A small adjustment goes a long way.`;
    return "You are slightly over budget. One calm step back helps.";
  }
  if (c) return `${c}, you have gone over budget.`;
  return "You have gone over budget.";
}

/** Error tone + optional spoken line (personality + callsign from localStorage). */
export function playBudgetOverFeedback(): void {
  playUiSound("error");
  if (!isUiSpeechEnabledClient() || typeof window === "undefined") return;
  try {
    const locRaw = window.localStorage.getItem(PERSONA_STORAGE.greetingLocale);
    const nl = parseGreetingLocale(locRaw) === "nl";
    const personality = window.localStorage.getItem(UI_PERSONALITY_LS_KEY);
    const callsign = window.localStorage.getItem(PERSONA_STORAGE.callsign);
    speakUi(personalityLine(nl, personality, callsign));
  } catch {
    /* ignore */
  }
}
