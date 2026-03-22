"use client";

const LINKS = [
  { href: "#growth-command", label: "Command center" },
  { href: "#growth-system", label: "Systeem & protocollen" },
  { href: "#growth-overview", label: "Dashboard" },
  { href: "#growth-path", label: "Leerpad" },
  { href: "#growth-missions", label: "Doel → missies" },
  { href: "#growth-streams", label: "Streams" },
] as const;

/** Sticky mini-nav — Growth v2 information architecture. */
export function GrowthSectionNav() {
  return (
    <nav
      className="sticky top-[calc(env(safe-area-inset-top,0px)+8px)] z-30 -mx-1 mb-6 flex flex-wrap gap-2 rounded-xl border border-[var(--card-border)]/80 bg-[var(--bg-primary)]/75 px-2 py-2 backdrop-blur-md"
      aria-label="Growth-secties"
    >
      {LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="rounded-lg border border-transparent px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] hover:border-[var(--semantic-ring)]/50 hover:bg-[var(--semantic-accent)]/10 hover:text-[var(--semantic-accent)]"
        >
          {l.label}
        </a>
      ))}
    </nav>
  );
}
