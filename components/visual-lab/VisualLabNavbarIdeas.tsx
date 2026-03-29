"use client";

import { useState } from "react";
import { BottomNavIcon } from "@/components/ui/BottomNavIcon";
import { BOTTOM_NAV_LINKS, type BottomNavLink } from "@/lib/navigation/bottom-nav-links";

function iconSlotClass(link: BottomNavLink, compact: boolean) {
  if (link.href === "/dashboard") return "flex shrink-0 items-center justify-center";
  return [
    "flex shrink-0 items-center justify-center",
    compact ? "[&_img]:h-[18px] [&_img]:w-[18px] [&_svg]:h-[18px] [&_svg]:w-[18px]" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

type TileProps = {
  link: BottomNavLink;
  active: boolean;
  onSelect: (href: string) => void;
  compact?: boolean;
};

function LabNavTile({ link, active, onSelect, compact = true }: TileProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(link.href)}
      aria-pressed={active}
      className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[var(--text-primary)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/50"
    >
      <span className={iconSlotClass(link, compact)}>
        <BottomNavIcon link={link} active={active} />
      </span>
      <span
        className={[
          "max-w-[4.2rem] truncate text-center text-[9px] font-semibold uppercase tracking-[0.08em]",
          active ? "text-[var(--semantic-accent)]" : "text-[var(--text-muted)]",
        ].join(" ")}
      >
        {link.label}
      </span>
    </button>
  );
}

export function VisualLabNavbarIdeas() {
  const [demoHref, setDemoHref] = useState<string>("/dashboard");

  return (
    <section
      id="navbar-design-lab"
      className="relative isolate mb-10 scroll-mt-24 space-y-8 rounded-xl border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(4,14,26,0.72)] p-4 shadow-[0_0_28px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)] md:p-5"
      aria-labelledby="navbar-lab-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--mode-rgb),0.1),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="mt-0.5 hidden h-10 w-1 shrink-0 rounded-full bg-[var(--semantic-accent)] shadow-[0_0_12px_rgba(var(--mode-rgb),0.35)] sm:block" aria-hidden />
          <div className="min-w-0">
            <h2
              id="navbar-lab-heading"
              className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-primary)] sm:text-[11px] sm:tracking-[0.18em]"
            >
              Navbar · ontwerpen
            </h2>
            <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-[var(--text-secondary)]">
              Vijf alternatieve chrome-layouts;{" "}
              <strong className="font-semibold text-[var(--text-primary)]">zelfde PNG/SVG-iconen</strong> en tabvolgorde als de echte bottom
              nav (<code className="rounded bg-black/30 px-1 text-[10px]">BOTTOM_NAV_LINKS</code>). Tik een tab: alle rekjes hieronder volgen
              mee (alleen visueel).
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(0,0,0,0.2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Mock
        </span>
      </div>

      {/* 1 — Strategy-style capsule */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Capsule dock</p>
        <p className="text-[10px] text-[var(--text-secondary)]">Volle boog, strategy-achtige gradient, compacte labels.</p>
        <div className="relative overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.2)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.12)] px-1 py-2 shadow-[0_0_28px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--mode-rgb),0.12),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex max-w-full items-stretch justify-between gap-0.5 sm:gap-1">
            {BOTTOM_NAV_LINKS.map((link) => {
              const active = demoHref === link.href;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => setDemoHref(link.href)}
                  aria-pressed={active}
                  className={[
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-0.5 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45",
                    active
                      ? "bg-[rgba(var(--mode-rgb),0.18)] shadow-[0_0_16px_rgba(var(--mode-rgb),0.15),inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "hover:bg-[rgba(var(--mode-rgb),0.06)]",
                  ].join(" ")}
                >
                  <span className={iconSlotClass(link, true)}>
                    <BottomNavIcon link={link} active={active} />
                  </span>
                  <span
                    className={[
                      "line-clamp-2 max-w-full px-0.5 text-center text-[7px] font-bold uppercase leading-tight tracking-[0.04em] min-[380px]:text-[8px] min-[380px]:tracking-[0.06em]",
                      active ? "text-[var(--semantic-accent)]" : "text-[var(--text-muted)]",
                    ].join(" ")}
                  >
                    {link.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2 — Glass strip */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Glazen strip</p>
        <p className="text-[10px] text-[var(--text-secondary)]">Backdrop blur, subtiele rand; geschikt als top- of bottom-dock.</p>
        <div className="rounded-2xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] px-2 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-end justify-between gap-1 overflow-x-auto pb-0.5 pt-1">
            {BOTTOM_NAV_LINKS.map((link) => (
              <LabNavTile key={link.href} link={link} active={demoHref === link.href} onSelect={setDemoHref} />
            ))}
          </div>
        </div>
      </div>

      {/* 3 — Hub island */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Hub-eiland</p>
        <p className="text-[10px] text-[var(--text-secondary)]">Dashboard midden, groter plateau; flanken lichtere tegels.</p>
        <div className="flex flex-wrap items-end justify-center gap-2 sm:flex-nowrap sm:justify-between">
          {BOTTOM_NAV_LINKS.map((link) => {
            const active = demoHref === link.href;
            const isHub = link.href === "/dashboard";
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => setDemoHref(link.href)}
                aria-pressed={active}
                className={[
                  "flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45",
                  isHub
                    ? "min-w-[5.25rem] flex-1 px-4 py-3 sm:min-w-[6rem] sm:px-5 sm:py-4 " +
                      (active
                        ? "border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb),0.16)] shadow-[0_0_32px_rgba(var(--mode-rgb),0.2),inset_0_1px_0_rgba(255,255,255,0.07)]"
                        : "border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(8,26,42,0.55)] shadow-[0_8px_28px_rgba(0,0,0,0.3)]")
                    : "min-w-[3.25rem] flex-1 px-2 py-2 sm:flex-none sm:min-w-[3.6rem] " +
                      (active
                        ? "border-[rgba(var(--mode-rgb),0.28)] bg-[rgba(var(--mode-rgb),0.1)]"
                        : "border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(4,12,22,0.45)] hover:border-[rgba(var(--mode-rgb),0.18)]"),
                ].join(" ")}
              >
                <span className={iconSlotClass(link, !isHub)}>
                  <BottomNavIcon link={link} active={active} />
                </span>
                <span
                  className={[
                    "max-w-[5rem] truncate text-center text-[9px] font-semibold uppercase tracking-[0.08em]",
                    active ? "text-[var(--semantic-accent)]" : "text-[var(--text-muted)]",
                  ].join(" ")}
                >
                  {link.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 — Segmented track */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Segment rail</p>
        <p className="text-[10px] text-[var(--text-secondary)]">Één groef; actieve tile vult een pill in het spoor.</p>
        <div className="rounded-2xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(4,10,20,0.65)] p-1.5 shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)]">
          <div className="flex gap-0.5 overflow-x-auto rounded-xl bg-[rgba(0,0,0,0.25)] p-1">
            {BOTTOM_NAV_LINKS.map((link) => {
              const active = demoHref === link.href;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => setDemoHref(link.href)}
                  aria-pressed={active}
                  className={[
                    "flex min-w-[3rem] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45",
                    active
                      ? "bg-[rgba(8,26,42,0.92)] shadow-[0_0_14px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.05)]"
                      : "hover:bg-[rgba(var(--mode-rgb),0.06)]",
                  ].join(" ")}
                >
                  <span className={iconSlotClass(link, true)}>
                    <BottomNavIcon link={link} active={active} />
                  </span>
                  <span
                    className={[
                      "max-w-full truncate text-[8px] font-bold uppercase tracking-[0.05em]",
                      active ? "text-[var(--semantic-accent)]" : "text-[var(--text-muted)]",
                    ].join(" ")}
                  >
                    {link.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5 — Inline bar + neon tick */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Minimal +accent rule</p>
        <p className="text-[10px] text-[var(--text-secondary)]">Lichte rail; actief item krijgt onderstreep en iets helderdere iconen.</p>
        <div className="border-b border-[rgba(var(--mode-rgb),0.12)]">
          <div className="flex items-center justify-between gap-1 overflow-x-auto px-0.5 pb-0">
            {BOTTOM_NAV_LINKS.map((link) => {
              const active = demoHref === link.href;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => setDemoHref(link.href)}
                  aria-pressed={active}
                  className="group flex min-w-0 flex-1 flex-col items-center gap-1 pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(4,10,20,0.4)]"
                >
                  <span
                    className={[
                      iconSlotClass(link, true),
                      active ? "opacity-100 drop-shadow-[0_0_8px_rgba(var(--mode-rgb),0.45)]" : "opacity-65 group-hover:opacity-90",
                    ].join(" ")}
                  >
                    <BottomNavIcon link={link} active={active} />
                  </span>
                  <span
                    className={[
                      "max-w-[3.5rem] truncate text-center text-[8px] font-semibold uppercase tracking-[0.06em]",
                      active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]",
                    ].join(" ")}
                  >
                    {link.label}
                  </span>
                  <span
                    className={[
                      "h-0.5 w-full max-w-[2rem] rounded-full transition",
                      active
                        ? "bg-[var(--semantic-accent)] shadow-[0_0_10px_rgba(var(--mode-rgb),0.5)]"
                        : "bg-transparent group-hover:bg-[rgba(var(--mode-rgb),0.2)]",
                    ].join(" ")}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
