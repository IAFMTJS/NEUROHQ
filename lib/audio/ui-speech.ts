"use client";

import { isUiSpeechEnabledClient } from "@/lib/audio/ui-feedback-storage";
import { PERSONA_STORAGE, parseGreetingLocale } from "@/lib/user-persona-storage";

function isIOSOrIPadOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  // iPadOS 13+ desktop mode
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return false;
}

/** iOS WebKit loads voices asynchronously; first getVoices() is often empty. */
function pickBestVoice(synth: SpeechSynthesis, lang: string): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  if (!voices.length) return null;
  const want = lang.replace("_", "-").toLowerCase();
  const short = want.split("-")[0] || want;

  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;

  for (const v of voices) {
    const l = v.lang.replace("_", "-").toLowerCase();
    if (!l.startsWith(short)) continue;

    let score = 0;
    if (l === want) score += 120;
    else if (l.startsWith(`${short}-`)) score += 90;
    else score += 70;

    const n = v.name.toLowerCase();
    // Prefer higher-quality bundled voices (iOS/macOS/Safari naming varies).
    if (n.includes("enhanced") || n.includes("improved")) score += 55;
    if (n.includes("premium")) score += 50;
    if (n.includes("siri")) score += 40;
    if (n.includes("natural")) score += 25;
    if (v.default) score += 4;

    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }

  return best;
}

function applyUtteranceProsody(u: SpeechSynthesisUtterance, lang: string, voice: SpeechSynthesisVoice | null): void {
  u.lang = lang;
  if (voice) u.voice = voice;
  u.volume = 0.92;

  if (isIOSOrIPadOS()) {
    // Slightly slower + neutral pitch reads less "flat robot" on Apple TTS.
    u.rate = 0.94;
    u.pitch = 1;
  } else {
    u.rate = 1;
    u.pitch = 1;
  }
}

function doSpeak(synth: SpeechSynthesis, text: string, lang: string): void {
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickBestVoice(synth, lang);
  applyUtteranceProsody(u, lang, voice);

  const run = () => {
    try {
      synth.speak(u);
    } catch {
      /* ignore */
    }
  };

  // iOS sometimes drops utterances if speak() runs in the same tick as cancel().
  if (isIOSOrIPadOS()) {
    window.setTimeout(run, 48);
  } else {
    run();
  }
}

/** Speak one line via Web Speech API; cancels any in-progress utterance. */
export function speakUi(text: string): void {
  if (typeof window === "undefined" || !isUiSpeechEnabledClient()) return;
  const syn = window.speechSynthesis;
  if (!syn || !text.trim()) return;

  const trimmed = text.trim();
  const locRaw =
    typeof window !== "undefined" ? window.localStorage.getItem(PERSONA_STORAGE.greetingLocale) : null;
  const lang = parseGreetingLocale(locRaw) === "nl" ? "nl-NL" : "en-US";

  try {
    syn.cancel();

    const start = () => doSpeak(syn, trimmed, lang);

    if (syn.getVoices().length > 0) {
      start();
      return;
    }

    let started = false;
    const startOnce = () => {
      if (started) return;
      if (syn.getVoices().length === 0) return;
      started = true;
      syn.removeEventListener("voiceschanged", onVoices);
      start();
    };

    const onVoices = () => {
      startOnce();
    };
    syn.addEventListener("voiceschanged", onVoices);
    // iOS PWA: voices may appear slightly later without firing voiceschanged reliably.
    window.setTimeout(startOnce, 250);
    window.setTimeout(startOnce, 800);
    // Last resort: speak with default engine so we never stay silent if lists stay empty.
    window.setTimeout(() => {
      if (started) return;
      started = true;
      syn.removeEventListener("voiceschanged", onVoices);
      start();
    }, 1500);
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
