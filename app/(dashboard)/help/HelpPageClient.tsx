"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  HELP_FAQ,
  HELP_GROUPS,
  HELP_LAST_UPDATED,
  HELP_QUICK_LINKS,
  HELP_QUICK_START_STEPS,
  HELP_SECTIONS,
  HELP_TERMS,
  type HelpSection,
} from "@/content/help/sections";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";

const LEGACY_HASH_REDIRECTS: Record<string, string> = {
  intro: "dashboard",
  goal: "dashboard",
  philosophy: "automation",
  "card-entries": "budget",
  "auto-tasks": "automation",
  "level-system": "xp-system",
  "rank-system": "xp-system",
  "streak-system": "xp-system",
  achievements: "xp-system",
  stats: "dashboard",
  "progression-loop": "automation",
  "today-engine": "missions",
  undocumented: "data-storage",
};

function AccordionSection({
  id,
  title,
  sectionNum,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  sectionNum?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="help-section" data-open={open ? "true" : "false"}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="help-section-heading flex w-full items-center justify-between gap-3 rounded-lg py-4 pl-2 pr-3 text-left font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/50 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]"
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {sectionNum != null && (
            <span
              className="help-section-num flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
              aria-hidden
            >
              {sectionNum}
            </span>
          )}
          <span className="truncate">{title}</span>
        </span>
        <span
          className="shrink-0 text-lg leading-none text-[var(--text-muted)] transition-transform duration-200"
          aria-hidden
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          v
        </span>
      </button>
      {open && (
        <div className="help-section-body space-y-4 pb-6 text-sm text-[var(--text-secondary)]">
          {children}
        </div>
      )}
    </section>
  );
}

function SectionBody({ section }: { section: HelpSection }) {
  return (
    <>
      <p>{section.summary}</p>

      {section.highlights && section.highlights.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {section.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}

      {section.steps && section.steps.length > 0 && (
        <ol className="space-y-2 rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/35 px-4 py-3">
          {section.steps.map((step, index) => (
            <li key={`${section.id}-step-${index}`} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-focus)]/20 text-[10px] font-bold text-[var(--accent-focus)]">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-[var(--text-main)]">{step.title}</p>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {section.tips && section.tips.length > 0 && (
        <div className="rounded-xl border border-[var(--accent-cyan)]/25 bg-[var(--accent-cyan)]/8 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-cyan)]">Tips</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {section.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {section.seeAlso && section.seeAlso.length > 0 && (
        <div className="help-related rounded-xl p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">See also</p>
          <div className="flex flex-wrap gap-2">
            {section.seeAlso.map((link) => (
              <Link
                key={`${section.id}-${link.href}`}
                href={link.href}
                className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--accent-cyan)] hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function HelpPageClient({ simplifiedLayout = false }: { simplifiedLayout?: boolean }) {
  const [showBackToContents, setShowBackToContents] = useState(false);

  const sectionNumberById = useMemo(
    () => new Map(HELP_SECTIONS.map((section, index) => [section.id, index + 1])),
    []
  );

  const sectionsByGroup = useMemo(
    () =>
      HELP_GROUPS.map((group) => ({
        ...group,
        sections: HELP_SECTIONS.filter((section) => section.group === group.id),
      })),
    []
  );

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (simplifiedLayout) {
      const scrollEl =
        document.getElementById("main-content") ??
        document.querySelector("[data-hq-simplified-scroll]");
      if (!scrollEl) return;
      const onScroll = () =>
        setShowBackToContents(
          scrollEl instanceof HTMLElement ? scrollEl.scrollTop > 400 : window.scrollY > 400
        );
      scrollEl.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => scrollEl.removeEventListener("scroll", onScroll);
    }
    const onScroll = () => setShowBackToContents(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [simplifiedLayout]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const mapped = LEGACY_HASH_REDIRECTS[hash] ?? hash;
    if (mapped !== hash) {
      window.history.replaceState(null, "", `${window.location.pathname}#${mapped}`);
    }
    const el = document.getElementById(mapped);
    if (!el) return;
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }, []);

  const helpMainContent = (
    <>
      <header className="mb-10 space-y-4">
        {!simplifiedLayout && (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text-main)]"
          >
            Back to HQ
          </Link>
        )}
        <h1 className="page-title-glow text-3xl font-bold tracking-tight md:text-5xl">Help Center</h1>
        <p className="max-w-2xl text-base text-[var(--text-muted)] md:text-lg">
          Praktische handleiding voor je dagelijkse flow in NeuroHQ. Alles is opgebouwd rond uitvoer: wat eerst, waarom, en waar je het vindt.
        </p>
        <p className="text-xs text-[var(--text-muted)]">Last updated: {HELP_LAST_UPDATED}</p>
      </header>

      <section className="help-quick-start mb-8 rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/20 text-xl" aria-hidden>
            !
          </span>
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Quick start</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {HELP_QUICK_START_STEPS.map((step, index) => (
            <div key={step.title} className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/35 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-cyan)]">Step {index + 1}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">{step.title}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {HELP_QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent-cyan)]/40 hover:text-[var(--text-main)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <details className="mb-8 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/35 px-5 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--text-main)]">Key terms</summary>
        <dl className="mt-3 space-y-3 text-sm">
          {HELP_TERMS.map((term) => (
            <div key={term.term}>
              <dt className="font-semibold text-[var(--accent-cyan)]">{term.term}</dt>
              <dd className="text-[var(--text-secondary)]">{term.definition}</dd>
            </div>
          ))}
        </dl>
      </details>

      <nav id="help-toc" aria-label="Table of contents" className="mb-8 rounded-2xl p-6">
        <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Table of contents</h2>
        <div className="space-y-6">
          {sectionsByGroup.map((group) => (
            <div key={group.id}>
              <div className="mb-2">
                <p className="help-toc-group-label text-[11px] font-semibold uppercase tracking-widest">{group.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{group.description}</p>
              </div>
              <ul className="grid gap-1 text-sm md:grid-cols-2">
                {group.sections.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className="help-toc-link flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left font-medium"
                    >
                      <span className="help-toc-num flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold">
                        {sectionNumberById.get(section.id)}
                      </span>
                      {section.title}
                    </button>
                  </li>
                ))}
                {group.id === "reference" && (
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToSection("faq")}
                      className="help-toc-link flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left font-medium"
                    >
                      <span className="help-toc-num flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold">
                        {HELP_SECTIONS.length + 1}
                      </span>
                      FAQ
                    </button>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="space-y-0">
        {HELP_SECTIONS.map((section, index) => (
          <AccordionSection
            key={section.id}
            id={section.id}
            title={section.title}
            sectionNum={index + 1}
            defaultOpen={index < 2}
          >
            <SectionBody section={section} />
          </AccordionSection>
        ))}

        <AccordionSection id="faq" title="FAQ" sectionNum={HELP_SECTIONS.length + 1} defaultOpen>
          <ul className="space-y-3">
            {HELP_FAQ.map((item, index) => (
              <li
                key={`${item.question}-${index}`}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/35 px-4 py-3"
              >
                <p className="font-semibold text-[var(--text-main)]">{item.question}</p>
                <p className="mt-1 text-[var(--text-secondary)]">{item.answer}</p>
              </li>
            ))}
          </ul>
        </AccordionSection>
      </div>

      <p className="mt-8 text-center text-[11px] text-[var(--text-muted)]" aria-label="Help last updated">
        Help bijgewerkt: {HELP_LAST_UPDATED}
      </p>

      {showBackToContents && (
        <button
          type="button"
          onClick={() =>
            document.getElementById("help-toc")?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="help-back-btn fixed bottom-20 right-4 z-10 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/50"
          aria-label="Back to table of contents"
        >
          ^ Contents
        </button>
      )}
    </>
  );

  const inner = simplifiedLayout ? (
    <div className="help-page mx-auto max-w-5xl pb-8">{helpMainContent}</div>
  ) : (
    <div className="container page help-page mx-auto max-w-5xl pb-24 dashboard-cinematic">
      <DashboardCommandDeckFrame deckTitle="Help" innerClassName="gap-4">
        <div className="mt-0 space-y-6">{helpMainContent}</div>
      </DashboardCommandDeckFrame>
    </div>
  );

  if (simplifiedLayout) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Help"
          bodyClassName="px-2 py-2 sm:px-3"
          footerLinks={[
            { href: "/dashboard", label: "HQ" },
            { href: "/tasks", label: "Missions" },
            { href: "/settings", label: "Instellingen" },
          ]}
        >
          {inner}
        </SimplifiedPageShell>
      </div>
    );
  }

  return inner;
}
