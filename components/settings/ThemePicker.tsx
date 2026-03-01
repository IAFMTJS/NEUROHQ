"use client";

/**
 * Commander v2 is de enige visuele stijl.
 * Theme- en color-mode keuzes zijn uitgeschakeld.
 */
export function ThemePicker() {
  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Appearance</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Visual style: Commander Design System v2 (dark). Other themes are disabled.
        </p>
      </div>
      <div className="p-4">
        <p className="text-sm text-[var(--text-secondary)]">
          The app uses a single design system. Minimal mode and reduced motion are available from the dashboard when needed.
        </p>
      </div>
    </div>
  );
}
