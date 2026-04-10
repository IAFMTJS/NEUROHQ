"use client";

import { getSharedAudioContext, resumeSharedAudioContext } from "@/lib/audio/ui-audio-context";
import { isUiSoundEnabledClient } from "@/lib/audio/ui-feedback-storage";

export type UiSoundId = "success" | "error" | "nudge" | "level_up";

/** Hoger = merkbaar luider; cap voorkomt harde clip op de master. */
const UI_SOUND_LOUDNESS_MULT = 2.05;
const UI_SOUND_GAIN_CAP = 0.26;

function beep(
  ctx: AudioContext,
  freq: number,
  t0: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = "sine"
): void {
  const peak = Math.min(UI_SOUND_GAIN_CAP, gainPeak * UI_SOUND_LOUDNESS_MULT);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Short procedural UI sounds; no-op when disabled or unsupported. */
export function playUiSound(id: UiSoundId): void {
  if (typeof window === "undefined" || !isUiSoundEnabledClient()) return;
  try {
    void resumeSharedAudioContext();
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (id === "level_up") {
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, i) => {
        beep(ctx, freq, now + i * 0.07, 0.32, 0.11, "sine");
      });
      return;
    }

    if (id === "success") {
      beep(ctx, 392, now, 0.12, 0.06, "sine");
      beep(ctx, 523.25, now + 0.09, 0.14, 0.07, "sine");
      return;
    }

    if (id === "error") {
      beep(ctx, 185, now, 0.22, 0.1, "triangle");
      beep(ctx, 146, now + 0.14, 0.28, 0.09, "triangle");
      return;
    }

    // nudge
    beep(ctx, 440, now, 0.1, 0.055, "sine");
    beep(ctx, 554.37, now + 0.11, 0.12, 0.05, "sine");
  } catch {
    /* ignore */
  }
}
