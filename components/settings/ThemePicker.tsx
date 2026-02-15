"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { THEME_IDS, THEME_LABELS, COLOR_MODES, COLOR_MODE_LABELS } from "@/lib/theme-tokens";

export function ThemePicker() {
  const { theme, colorMode, setTheme, setColorMode } = useTheme();

  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Appearance</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">
          Theme and color mode. Same dashboard, different look.
        </p>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-neuro-silver mb-2">Theme</p>
          <div className="flex flex-wrap gap-2">
            {THEME_IDS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                aria-pressed={theme === t}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  theme === t
                    ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]"
                    : "border-neuro-border bg-neuro-surface text-neuro-muted hover:border-neuro-silver/50 hover:text-neuro-silver"
                }`}
              >
                {THEME_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-neuro-silver mb-2">Color mode</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_MODES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColorMode(c)}
                aria-pressed={colorMode === c}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  colorMode === c
                    ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]"
                    : "border-neuro-border bg-neuro-surface text-neuro-muted hover:border-neuro-silver/50 hover:text-neuro-silver"
                }`}
              >
                {COLOR_MODE_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
