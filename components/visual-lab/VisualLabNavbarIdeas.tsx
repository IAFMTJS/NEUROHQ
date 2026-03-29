"use client";

import { useState } from "react";
import { BottomNavIcon } from "@/components/ui/BottomNavIcon";
import {
  BOTTOM_NAV_LINKS,
  BOTTOM_NAV_HUB,
  BOTTOM_NAV_LEFT,
  BOTTOM_NAV_RIGHT,
  type BottomNavLink,
} from "@/lib/navigation/bottom-nav-links";

const NAV_ROW1 = BOTTOM_NAV_LINKS.slice(0, 4);
const NAV_ROW2 = BOTTOM_NAV_LINKS.slice(4);

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
              Meerdere chrome-richtingen (oud + nieuw);{" "}
              <strong className="font-semibold text-[var(--text-primary)]">zelfde PNG/SVG-iconen</strong> en tabvolgorde als de echte bottom
              nav (<code className="rounded bg-black/30 px-1 text-[10px]">BOTTOM_NAV_LINKS</code>). Tik een tab: alle rekjes volgen mee (alleen
              visueel).
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

      {/* 6 — Wings + HQ orb */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Vleugels · HQ-centrum</p>
        <p className="text-[10px] text-[var(--text-secondary)]">
          Drie links, drie rechts; dashboard als losse orb met dubbele ring — leest als command-post.
        </p>
        <div className="rounded-2xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(3,10,22,0.75)] px-2 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-end justify-between gap-1 sm:gap-2">
            <div className="flex min-w-0 flex-1 justify-start gap-0.5 sm:gap-1">
              {BOTTOM_NAV_LEFT.map((link) => {
                const active = demoHref === link.href;
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => setDemoHref(link.href)}
                    aria-pressed={active}
                    className={[
                      "flex min-w-0 flex-1 max-w-[4.5rem] flex-col items-center gap-1 rounded-xl px-1 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45",
                      active ? "bg-[rgba(var(--mode-rgb),0.14)] ring-1 ring-[rgba(var(--mode-rgb),0.25)]" : "hover:bg-[rgba(var(--mode-rgb),0.06)]",
                    ].join(" ")}
                  >
                    <span className={iconSlotClass(link, true)}>
                      <BottomNavIcon link={link} active={active} />
                    </span>
                    <span
                      className={[
                        "w-full truncate text-center text-[7px] font-bold uppercase leading-tight tracking-[0.04em] sm:text-[8px]",
                        active ? "text-[var(--semantic-accent)]" : "text-[var(--text-muted)]",
                      ].join(" ")}
                    >
                      {link.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative flex shrink-0 flex-col items-center px-1">
              {(() => {
                const link = BOTTOM_NAV_HUB;
                const active = demoHref === link.href;
                return (
                  <button
                    type="button"
                    onClick={() => setDemoHref(link.href)}
                    aria-pressed={active}
                    className={[
                      "relative flex flex-col items-center gap-1 rounded-full border-2 px-3 py-2.5 shadow-[0_0_24px_rgba(var(--mode-rgb),0.25)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/55",
                      active
                        ? "border-[color:color-mix(in_srgb,var(--semantic-accent),transparent_25%)] bg-[rgba(var(--mode-rgb),0.22)]"
                        : "border-[rgba(var(--mode-rgb),0.28)] bg-[rgba(6,18,32,0.85)] hover:border-[rgba(var(--mode-rgb),0.4)]",
                    ].join(" ")}
                  >
                    <span
                      className="pointer-events-none absolute inset-[-5px] rounded-full border border-[rgba(var(--mode-rgb),0.15)] opacity-70"
                      aria-hidden
                    />
                    <span className={iconSlotClass(link, false)}>
                      <BottomNavIcon link={link} active={active} />
                    </span>
                    <span className="max-w-[4.5rem] truncate text-center text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--semantic-accent)]">
                      {link.label}
                    </span>
                  </button>
                );
              })()}
            </div>

            <div className="flex min-w-0 flex-1 justify-end gap-0.5 sm:gap-1">
              {BOTTOM_NAV_RIGHT.map((link) => {
                const active = demoHref === link.href;
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => setDemoHref(link.href)}
                    aria-pressed={active}
                    className={[
                      "flex min-w-0 flex-1 max-w-[4.5rem] flex-col items-center gap-1 rounded-xl px-1 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45",
                      active ? "bg-[rgba(var(--mode-rgb),0.14)] ring-1 ring-[rgba(var(--mode-rgb),0.25)]" : "hover:bg-[rgba(var(--mode-rgb),0.06)]",
                    ].join(" ")}
                  >
                    <span className={iconSlotClass(link, true)}>
                      <BottomNavIcon link={link} active={active} />
                    </span>
                    <span
                      className={[
                        "w-full truncate text-center text-[7px] font-bold uppercase leading-tight tracking-[0.04em] sm:text-[8px]",
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
      </div>

      {/* 7 — FAB overlap strip */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">FAB-inspringing</p>
        <p className="text-[10px] text-[var(--text-secondary)]">
          Lage balk voor alle tabs; HQ steekt omhoog als fab (material-achtig, cinematic variant).
        </p>
        <div className="relative pt-6">
          <div className="rounded-2xl border border-[rgba(var(--mode-rgb),0.16)] bg-gradient-to-b from-[rgba(8,22,38,0.92)] to-[rgba(4,10,20,0.97)] px-1 pb-2 pt-2 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--mode-rgb),0.35)] to-transparent opacity-80"
              aria-hidden
            />
            <div className="relative flex items-end justify-between gap-0.5">
              {BOTTOM_NAV_LEFT.map((link) => {
                const active = demoHref === link.href;
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => setDemoHref(link.href)}
                    aria-pressed={active}
                    className={[
                      "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-0.5 pb-1 pt-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45",
                      active ? "bg-[rgba(var(--mode-rgb),0.12)]" : "hover:bg-[rgba(var(--mode-rgb),0.05)]",
                    ].join(" ")}
                  >
                    <span className={iconSlotClass(link, true)}>
                      <BottomNavIcon link={link} active={active} />
                    </span>
                    <span
                      className={[
                        "max-w-full truncate text-[7px] font-bold uppercase tracking-[0.04em] sm:text-[8px]",
                        active ? "text-[var(--semantic-accent)]" : "text-[var(--text-muted)]",
                      ].join(" ")}
                    >
                      {link.label}
                    </span>
                  </button>
                );
              })}

              <div className="relative flex w-[4.25rem] shrink-0 justify-center sm:w-[4.75rem]">
                {(() => {
                  const link = BOTTOM_NAV_HUB;
                  const active = demoHref === link.href;
                  return (
                    <button
                      type="button"
                      onClick={() => setDemoHref(link.href)}
                      aria-pressed={active}
                      className={[
                        "absolute bottom-[calc(100%-0.5rem)] left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-1 rounded-full border px-3 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.5)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/50",
                        active
                          ? "border-[rgba(var(--semantic-accent),0.45)] bg-[rgba(4,16,28,0.95)] shadow-[0_0_28px_rgba(var(--mode-rgb),0.35)]"
                          : "border-[rgba(var(--mode-rgb),0.28)] bg-[rgba(6,14,26,0.92)] hover:border-[rgba(var(--mode-rgb),0.45)]",
                      ].join(" ")}
                    >
                      <span className={iconSlotClass(link, false)}>
                        <BottomNavIcon link={link} active={active} />
                      </span>
                      <span className="max-w-[4rem] truncate text-[8px] font-bold uppercase tracking-[0.08em] text-[var(--semantic-accent)]">
                        {link.label}
                      </span>
                    </button>
                  );
                })()}
              </div>

              {BOTTOM_NAV_RIGHT.map((link) => {
                const active = demoHref === link.href;
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => setDemoHref(link.href)}
                    aria-pressed={active}
                    className={[
                      "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-0.5 pb-1 pt-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45",
                      active ? "bg-[rgba(var(--mode-rgb),0.12)]" : "hover:bg-[rgba(var(--mode-rgb),0.05)]",
                    ].join(" ")}
                  >
                    <span className={iconSlotClass(link, true)}>
                      <BottomNavIcon link={link} active={active} />
                    </span>
                    <span
                      className={[
                        "max-w-full truncate text-[7px] font-bold uppercase tracking-[0.04em] sm:text-[8px]",
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
      </div>

      {/* 8 — Neon spine */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Neon-spine</p>
        <p className="text-[10px] text-[var(--text-secondary)]">Horizontale gloedlijn; actieve tab krijgt een pulserende stip op de lijn.</p>
        <div className="relative rounded-xl bg-[rgba(2,8,18,0.65)] px-2 pb-3 pt-2">
          <div
            className="pointer-events-none absolute bottom-[18px] left-[6%] right-[6%] h-[2px] rounded-full bg-gradient-to-r from-transparent via-[var(--semantic-accent)] to-transparent opacity-45 shadow-[0_0_12px_rgba(var(--mode-rgb),0.4)]"
            aria-hidden
          />
          <div className="relative flex items-end justify-between gap-0.5">
            {BOTTOM_NAV_LINKS.map((link) => {
              const active = demoHref === link.href;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => setDemoHref(link.href)}
                  aria-pressed={active}
                  className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 pb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45"
                >
                  <span
                    className={[
                      iconSlotClass(link, true),
                      active ? "scale-105 drop-shadow-[0_0_10px_rgba(var(--mode-rgb),0.55)]" : "opacity-75 group-hover:opacity-95",
                    ].join(" ")}
                  >
                    <BottomNavIcon link={link} active={active} />
                  </span>
                  <span
                    className={[
                      "max-w-full truncate text-center text-[8px] font-semibold uppercase tracking-[0.05em]",
                      active ? "text-[var(--semantic-accent)]" : "text-[var(--text-muted)]",
                    ].join(" ")}
                  >
                    {link.label}
                  </span>
                  <span
                    className={[
                      "h-1.5 w-1.5 shrink-0 rounded-full border border-[rgba(var(--mode-rgb),0.35)] transition",
                      active
                        ? "border-[var(--semantic-accent)] bg-[var(--semantic-accent)] shadow-[0_0_10px_rgba(var(--mode-rgb),0.8)]"
                        : "bg-[rgba(0,0,0,0.35)] group-hover:bg-[rgba(var(--mode-rgb),0.25)]",
                    ].join(" ")}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 9 — Density: 4 + 3 rows */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Dubbele rij (4+3)</p>
        <p className="text-[10px] text-[var(--text-secondary)]">Zelfde volgorde: eerste vier boven, laatste drie gecentreerd onder — meer lucht per icoon.</p>
        <div className="space-y-2 rounded-2xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(5,12,24,0.6)] p-3">
          <div className="flex justify-between gap-2">
            {NAV_ROW1.map((link) => {
              const active = demoHref === link.href;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => setDemoHref(link.href)}
                  aria-pressed={active}
                  className={[
                    "flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45",
                    active
                      ? "border-[rgba(var(--semantic-accent),0.35)] bg-[rgba(var(--mode-rgb),0.12)]"
                      : "border-[rgba(var(--mode-rgb),0.1)] bg-transparent hover:border-[rgba(var(--mode-rgb),0.2)]",
                  ].join(" ")}
                >
                  <span className={iconSlotClass(link, true)}>
                    <BottomNavIcon link={link} active={active} />
                  </span>
                  <span
                    className={[
                      "w-full truncate text-center text-[8px] font-bold uppercase tracking-[0.06em]",
                      active ? "text-[var(--semantic-accent)]" : "text-[var(--text-muted)]",
                    ].join(" ")}
                  >
                    {link.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-center gap-3 sm:gap-6">
            {NAV_ROW2.map((link) => {
              const active = demoHref === link.href;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => setDemoHref(link.href)}
                  aria-pressed={active}
                  className={[
                    "flex min-w-[3.75rem] flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45 sm:min-w-[4.25rem]",
                    active
                      ? "border-[rgba(var(--semantic-accent),0.35)] bg-[rgba(var(--mode-rgb),0.12)]"
                      : "border-[rgba(var(--mode-rgb),0.1)] bg-transparent hover:border-[rgba(var(--mode-rgb),0.2)]",
                  ].join(" ")}
                >
                  <span className={iconSlotClass(link, true)}>
                    <BottomNavIcon link={link} active={active} />
                  </span>
                  <span
                    className={[
                      "max-w-[4rem] truncate text-center text-[8px] font-bold uppercase tracking-[0.06em]",
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

      {/* 10 — Orbs + active chip */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Orbs · actief label-chip</p>
        <p className="text-[10px] text-[var(--text-secondary)]">Iconen in cirkels; alleen de actieve tab toont een tekstpill naast het icoon (compact op smal).</p>
        <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(0,0,0,0.22)] px-2 py-3 sm:flex-nowrap sm:justify-between sm:gap-1">
          {BOTTOM_NAV_LINKS.map((link) => {
            const active = demoHref === link.href;
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => setDemoHref(link.href)}
                aria-pressed={active}
                className={[
                  "flex items-center gap-1.5 rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45",
                  active
                    ? "border-[rgba(var(--semantic-accent),0.4)] bg-[rgba(var(--mode-rgb),0.15)] pr-2 shadow-[0_0_16px_rgba(var(--mode-rgb),0.12)]"
                    : "border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,14,28,0.55)] p-0.5 hover:border-[rgba(var(--mode-rgb),0.28)]",
                  !active ? "p-0.5" : "py-0.5 pl-0.5",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    active ? "bg-[rgba(var(--mode-rgb),0.2)] ring-1 ring-[rgba(var(--semantic-accent),0.35)]" : "bg-[rgba(0,0,0,0.2)]",
                  ].join(" ")}
                >
                  <span className={iconSlotClass(link, true)}>
                    <BottomNavIcon link={link} active={active} />
                  </span>
                </span>
                {active ? (
                  <span className="hidden max-w-[4.5rem] truncate pr-1 text-[8px] font-bold uppercase tracking-[0.06em] text-[var(--semantic-accent)] min-[420px]:inline">
                    {link.label}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* 11 — Sci-fi bracket frame */}
      <div className="relative z-[1] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Bracket rail</p>
        <p className="text-[10px] text-[var(--text-secondary)]">HUD-hoeken + scanlijn; strak rastergevoel zonder zware gradiënt.</p>
        <div className="relative px-3 py-4">
          <span
            className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-[rgba(var(--semantic-accent),0.5)] opacity-80"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-[rgba(var(--semantic-accent),0.5)] opacity-80"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-[rgba(var(--semantic-accent),0.35)] opacity-70"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-[rgba(var(--semantic-accent),0.35)] opacity-70"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-[12%] right-[12%] top-1/2 h-px -translate-y-[10px] bg-gradient-to-r from-transparent via-[rgba(var(--mode-rgb),0.25)] to-transparent"
            aria-hidden
          />
          <div className="relative flex items-end justify-between gap-0.5">
            {BOTTOM_NAV_LINKS.map((link) => {
              const active = demoHref === link.href;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => setDemoHref(link.href)}
                  aria-pressed={active}
                  className={[
                    "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-0.5 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/45",
                    active
                      ? "bg-[rgba(var(--mode-rgb),0.12)] [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)]"
                      : "hover:bg-[rgba(var(--mode-rgb),0.05)]",
                  ].join(" ")}
                >
                  <span className={iconSlotClass(link, true)}>
                    <BottomNavIcon link={link} active={active} />
                  </span>
                  <span
                    className={[
                      "max-w-[3.25rem] truncate text-center text-[7px] font-bold uppercase tracking-[0.08em] sm:max-w-[3.75rem] sm:text-[8px]",
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
    </section>
  );
}
