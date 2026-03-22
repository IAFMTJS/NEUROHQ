import type { ReactNode } from "react";

/** Minimal markdown for protocol bodies (headings + paragraphs + bullets). No HTML. */
export function renderMarkdownLite(md: string): ReactNode[] {
  const lines = md.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  for (const line of lines) {
    const t = line.trim();
    const key = `md-${i++}`;
    if (!t) continue;
    if (t.startsWith("### ")) {
      out.push(
        <h4 key={key} className="mt-3 text-sm font-bold text-[var(--text-primary)] first:mt-0">
          {t.slice(4)}
        </h4>,
      );
    } else if (t.startsWith("## ")) {
      out.push(
        <h3 key={key} className="mt-4 text-base font-semibold text-[var(--text-primary)] first:mt-0">
          {t.slice(3)}
        </h3>,
      );
    } else if (t.startsWith("# ")) {
      out.push(
        <h2 key={key} className="mt-4 text-lg font-bold text-[var(--text-primary)] first:mt-0">
          {t.slice(2)}
        </h2>,
      );
    } else if (t.startsWith("- ") || t.startsWith("* ")) {
      out.push(
        <li key={key} className="ml-4 list-disc text-[var(--text-secondary)]">
          {t.slice(2)}
        </li>,
      );
    } else {
      out.push(
        <p key={key} className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {t}
        </p>,
      );
    }
  }
  return out;
}
