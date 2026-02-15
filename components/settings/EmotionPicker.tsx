"use client";

import Image from "next/image";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getEmotionImagePath, EMOTION_KEYS, EMOTION_LABELS } from "@/lib/emotions";
import type { ThemeId } from "@/lib/theme-tokens";
import type { EmotionKey } from "@/lib/emotions";

const PICKER_IMAGE_SIZE = 64;

export function EmotionPicker() {
  const { theme, emotion, setEmotion } = useTheme();

  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">How you feel</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">
          Choose an emotion to change the visual style and mascot.
        </p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {EMOTION_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setEmotion(emotion === key ? null : key)}
              aria-pressed={emotion === key}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition ${
                emotion === key
                  ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/15"
                  : "border-neuro-border bg-neuro-surface/50 hover:border-neuro-silver/50"
              }`}
            >
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-elevated)]">
                <Image
                  src={getEmotionImagePath(key, (theme ?? "normal") as ThemeId)}
                  alt=""
                  fill
                  sizes={`${PICKER_IMAGE_SIZE}px`}
                  className="object-contain"
                />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-neuro-silver text-center leading-tight line-clamp-2">
                {EMOTION_LABELS[key]}
              </span>
            </button>
          ))}
        </div>
        {emotion && (
          <p className="mt-3 text-xs text-neuro-muted">
            Selected: <span className="text-neuro-silver">{EMOTION_LABELS[emotion]}</span>. Select again to clear.
          </p>
        )}
      </div>
    </div>
  );
}
