"use client";

import Link from "next/link";
import type { AdaptiveSuggestions } from "@/app/actions/adaptive";
import type { ThemeId } from "@/lib/theme-tokens";
import type { EmotionKey } from "@/lib/emotions";
import { THEME_LABELS } from "@/lib/theme-tokens";
import { EMOTION_LABELS } from "@/lib/emotions";

type Props = {
  suggestions: AdaptiveSuggestions;
  onDismiss?: () => void;
};

export function AdaptiveSuggestionBanner({ suggestions, onDismiss }: Props) {
  const { themeSuggestion, emotionSuggestion, taskCountSuggestion } = suggestions;
  if (!themeSuggestion && !emotionSuggestion && taskCountSuggestion == null) return null;

  const lines: string[] = [];
  if (themeSuggestion) lines.push(`Try the ${THEME_LABELS[themeSuggestion]} theme for a calmer look.`);
  if (emotionSuggestion) lines.push(`Your mood might match "${EMOTION_LABELS[emotionSuggestion]}".`);
  if (taskCountSuggestion != null) lines.push(`Based on this week, we suggest ${taskCountSuggestion} task${taskCountSuggestion !== 1 ? "s" : ""} today.`);

  return (
    <div
      className="card-simple-accent flex flex-wrap items-center justify-between gap-2 px-4 py-3 border border-[var(--accent-focus)]/20"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-[var(--text-primary)]">
        {lines.join(" ")}
        {(themeSuggestion || emotionSuggestion) && (
          <Link href="/settings" className="ml-1 font-medium text-[var(--accent-focus)] hover:underline">
            Settings →
          </Link>
        )}
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="Dismiss suggestion"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
