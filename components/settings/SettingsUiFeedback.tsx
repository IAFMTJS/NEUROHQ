"use client";

import { useState, useTransition } from "react";
import { getUserPreferencesOrDefaults, updateUserPreferences } from "@/app/actions/preferences";
import { useSettings } from "@/lib/settings-context";
import { syncUiFeedbackFromPreferences } from "@/lib/audio/ui-feedback-storage";
import { playUiSound } from "@/lib/audio/ui-sounds";
import { speakUi, cancelUiSpeech } from "@/lib/audio/ui-speech";
import { resumeSharedAudioContext } from "@/lib/audio/ui-audio-context";

type Props = {
  initialSoundEnabled: boolean;
  initialSpeechEnabled: boolean;
};

export function SettingsUiFeedback({ initialSoundEnabled, initialSpeechEnabled }: Props) {
  const [soundOn, setSoundOn] = useState(initialSoundEnabled);
  const [speechOn, setSpeechOn] = useState(initialSpeechEnabled);
  const [pending, startTransition] = useTransition();
  const { invalidate } = useSettings();

  const persist = (nextSound: boolean, nextSpeech: boolean) => {
    startTransition(async () => {
      await updateUserPreferences({
        ui_sound_enabled: nextSound,
        ui_speech_enabled: nextSpeech,
      });
      const fresh = await getUserPreferencesOrDefaults();
      syncUiFeedbackFromPreferences(fresh);
      await invalidate();
    });
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    persist(next, speechOn);
  };

  const toggleSpeech = () => {
    const next = !speechOn;
    setSpeechOn(next);
    persist(soundOn, next);
  };

  const testSound = () => {
    void resumeSharedAudioContext();
    playUiSound("success");
    window.setTimeout(() => playUiSound("nudge"), 220);
  };

  const testSpeech = () => {
    void resumeSharedAudioContext();
    speakUi("NeuroHQ audio check. Speech is on.");
  };

  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Geluid & spraak</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Korte geluiden in de site en PWA (geen aparte manifest-instelling). Spraak gebruikt de stem van je systeem;
          werkt het best na een tik op de pagina (browserbeperking).
        </p>
      </div>
      <div className="space-y-0 divide-y divide-[var(--card-border)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">UI-geluiden</p>
            <p className="text-xs text-[var(--text-muted)]">Succes, fout, nudges, level-up</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={soundOn}
            disabled={pending}
            onClick={toggleSound}
            className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--input-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60 data-[state=on]:bg-[var(--accent)]"
            data-state={soundOn ? "on" : "off"}
          >
            <span
              className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
              style={{ transform: soundOn ? "translateX(20px)" : "translateX(2px)" }}
            />
          </button>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Spraak (TTS)</p>
            <p className="text-xs text-[var(--text-muted)]">O.a. budgetwaarschuwing; volgt push-persona en roepnaam</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={speechOn}
            disabled={pending}
            onClick={toggleSpeech}
            className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--input-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60 data-[state=on]:bg-[var(--accent)]"
            data-state={speechOn ? "on" : "off"}
          >
            <span
              className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
              style={{ transform: speechOn ? "translateX(20px)" : "translateX(2px)" }}
            />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 px-4 py-3">
          <button
            type="button"
            disabled={pending || !soundOn}
            onClick={testSound}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-white/10 disabled:opacity-40"
          >
            Test geluid
          </button>
          <button
            type="button"
            disabled={pending || !speechOn}
            onClick={testSpeech}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-white/10 disabled:opacity-40"
          >
            Test spraak
          </button>
          <button
            type="button"
            onClick={() => cancelUiSpeech()}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Stop spraak
          </button>
        </div>
      </div>
    </div>
  );
}
