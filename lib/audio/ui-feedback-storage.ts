import type { UserPreferences } from "@/types/preferences.types";

export const UI_SOUND_LS_KEY = "neurohq-ui-sound-enabled";
export const UI_SPEECH_LS_KEY = "neurohq-ui-speech-enabled";
export const UI_PERSONALITY_LS_KEY = "neurohq-push-personality-mode";

/** Mirror server prefs for instant client reads (ThemeHydrate + settings toggles). */
export function syncUiFeedbackFromPreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UI_SOUND_LS_KEY, String(prefs.ui_sound_enabled !== false));
    window.localStorage.setItem(UI_SPEECH_LS_KEY, String(prefs.ui_speech_enabled === true));
    window.localStorage.setItem(UI_PERSONALITY_LS_KEY, prefs.push_personality_mode ?? "auto");
  } catch {
    /* ignore */
  }
}

export function writeUiFeedbackLocalPartial(partial: {
  ui_sound_enabled?: boolean;
  ui_speech_enabled?: boolean;
  push_personality_mode?: string | null;
}): void {
  if (typeof window === "undefined") return;
  try {
    if (partial.ui_sound_enabled !== undefined) {
      window.localStorage.setItem(UI_SOUND_LS_KEY, String(partial.ui_sound_enabled));
    }
    if (partial.ui_speech_enabled !== undefined) {
      window.localStorage.setItem(UI_SPEECH_LS_KEY, String(partial.ui_speech_enabled));
    }
    if (partial.push_personality_mode !== undefined) {
      window.localStorage.setItem(UI_PERSONALITY_LS_KEY, partial.push_personality_mode ?? "auto");
    }
  } catch {
    /* ignore */
  }
}

export function isUiSoundEnabledClient(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = window.localStorage.getItem(UI_SOUND_LS_KEY);
    if (v === null) return true;
    return v === "true";
  } catch {
    return true;
  }
}

export function isUiSpeechEnabledClient(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(UI_SPEECH_LS_KEY) === "true";
  } catch {
    return false;
  }
}
