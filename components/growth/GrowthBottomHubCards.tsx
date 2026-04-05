"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProtocolLibraryRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import { setGrowthFocusAndCommitProtocolWeek } from "@/app/actions/growth-focus";
import type { GrowthFocusState } from "@/app/actions/growth-focus";
import { parseProtocolDefinition, maxWeekIndex, weekForIndex } from "@/lib/growth/protocol-definition";
import { progressKey, resolveFocusProtocol } from "@/lib/growth/resolve-focus-protocol";
import { neuroToast } from "@/lib/ui/neuro-toast";

const subCardClass =
  "rounded-[18px] border border-[rgba(var(--mode-rgb),0.14)] bg-gradient-to-br from-[rgba(var(--mode-rgb-deep),0.28)] via-[rgba(8,14,24,0.78)] to-[rgba(var(--mode-rgb),0.07)] p-4 shadow-[0_8px_26px_rgba(0,0,0,0.34),0_0_0_1px_rgba(var(--mode-rgb),0.08),0_0_18px_rgba(var(--mode-rgb),0.07)] backdrop-blur-[18px] transition-[box-shadow,border-color] duration-200 hover:border-[rgba(var(--mode-rgb),0.22)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(var(--mode-rgb),0.14),0_0_26px_rgba(var(--mode-rgb),0.11)] sm:p-5";

type Props = {
  protocols: ProtocolLibraryRow[];
  progressMap: Record<string, ProtocolProgressState>;
  growthFocus: GrowthFocusState;
  onOpenProtocol: (p: ProtocolLibraryRow) => void;
};

function sameProtocol(a: ProtocolLibraryRow, b: ProtocolLibraryRow) {
  return a.slug === b.slug && a.locale === b.locale;
}

export function GrowthBottomHubCards({ protocols, progressMap, growthFocus, onOpenProtocol }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const active = useMemo(
    () => resolveFocusProtocol(protocols, progressMap, growthFocus),
    [protocols, progressMap, growthFocus],
  );

  const otherProtocols = useMemo(() => {
    if (!active) return protocols;
    return protocols.filter((p) => !sameProtocol(p, active));
  }, [protocols, active]);

  const outlook = useMemo(() => {
    if (!active) return null;
    const def = parseProtocolDefinition(active.definition_json);
    if (!def) return { kind: "no_def" as const };
    const prog = progressMap[progressKey(active.slug, active.locale)] ?? null;
    const weekIndex = prog?.current_week_index ?? 1;
    const maxW = maxWeekIndex(def);
    if (weekIndex >= maxW) {
      return {
        kind: "last" as const,
        maxW,
        weekIndex,
        goal: def.goal_one_liner,
      };
    }
    const next = weekForIndex(def, weekIndex + 1);
    return {
      kind: "next" as const,
      maxW,
      weekIndex,
      nextWeekIndex: weekIndex + 1,
      nextTitle: next?.title ?? `Week ${weekIndex + 1}`,
      nextObjective: next?.objective ?? null,
      weeksAfterThis: maxW - weekIndex,
      goal: def.goal_one_liner,
    };
  }, [active, progressMap]);

  const setFocus = (p: ProtocolLibraryRow) => {
    startTransition(async () => {
      try {
        const r = await setGrowthFocusAndCommitProtocolWeek({ slug: p.slug, locale: p.locale });
        neuroToast.success(
          r.created > 0
            ? `Focus: ${p.title} · ${r.created} taken verdeeld over de week${r.skipped ? ` (${r.skipped} al aanwezig)` : ""}`
            : r.skipped > 0
              ? `Focus: ${p.title} · week stond al op je bord`
              : `Focus: ${p.title}`,
        );
        router.refresh();
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Mislukt.");
      }
    });
  };

  if (protocols.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <section className={subCardClass} aria-labelledby="growth-outlook-heading">
        <h3
          id="growth-outlook-heading"
          className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] [text-shadow:0_0_10px_rgba(var(--mode-rgb),0.2)]"
        >
          Vooruitzicht
        </h3>
        {!active ? (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Geen actief traject.</p>
        ) : outlook?.kind === "no_def" ? (
          <p className="mt-3 text-sm leading-snug text-[var(--text-secondary)]">
            Geen gestructureerde roadmap voor dit protocol — open het traject voor details.
          </p>
        ) : outlook?.kind === "last" ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Laatste week ({outlook.weekIndex}/{outlook.maxW}) — afronden of ander traject.
            </p>
            {outlook.goal ? (
              <p className="text-xs text-[var(--text-muted)] line-clamp-2">{outlook.goal}</p>
            ) : null}
          </div>
        ) : outlook?.kind === "next" ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Week {outlook.nextWeekIndex}: {outlook.nextTitle}
            </p>
            {outlook.nextObjective ? (
              <p className="text-sm leading-snug text-[var(--text-secondary)] line-clamp-3">{outlook.nextObjective}</p>
            ) : null}
            <p className="text-[11px] text-[var(--text-muted)]">
              Nog {outlook.weeksAfterThis} week{outlook.weeksAfterThis === 1 ? "" : "en"} na deze in het traject.
            </p>
            {outlook.goal ? (
              <p className="text-xs leading-relaxed text-[var(--text-muted)] line-clamp-2 border-t border-[rgba(var(--mode-rgb),0.1)] pt-2">
                Traject: {outlook.goal}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Geen vooruitzicht beschikbaar.</p>
        )}
        <p className="mt-4">
          <Link
            href="/learning/analytics"
            className="text-[11px] font-medium text-[var(--text-muted)] underline-offset-2 transition hover:text-[var(--accent-focus)] hover:underline"
          >
            Trend & velocity →
          </Link>
        </p>
      </section>

      <section className={subCardClass} aria-labelledby="growth-other-tracks-heading">
        <h3
          id="growth-other-tracks-heading"
          className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] [text-shadow:0_0_10px_rgba(var(--mode-rgb),0.2)]"
        >
          Andere trajecten
        </h3>
        {otherProtocols.length === 0 ? (
          <p className="mt-3 text-sm leading-snug text-[var(--text-secondary)]">
            Geen andere trajecten in de bibliotheek — dit is je enige protocol.
          </p>
        ) : (
          <div className="mt-3 flex min-h-0 flex-col">
            {otherProtocols.length > 3 ? (
              <p className="mb-2 text-[10px] text-[var(--text-muted)]">
                {otherProtocols.length} trajecten — scroll in het vak
              </p>
            ) : null}
            <div
              className="max-h-52 overflow-y-auto overscroll-contain rounded-lg border border-[rgba(var(--mode-rgb),0.12)] bg-black/25 py-2 pl-2 pr-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] [-webkit-overflow-scrolling:touch] sm:max-h-56"
              role="region"
              aria-label="Lijst met andere protocollen"
            >
              <ul className="space-y-2 pr-1">
                {otherProtocols.map((p) => {
                  const pk = progressKey(p.slug, p.locale);
                  const pp = progressMap[pk];
                  const wk = pp?.current_week_index ?? 1;
                  const defP = parseProtocolDefinition(p.definition_json);
                  const maxP = defP ? maxWeekIndex(defP) : null;
                  return (
                    <li key={p.id}>
                      <div className="flex flex-col gap-2 rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-[var(--bg-primary)]/35 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{p.title}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            Week {wk}
                            {maxP != null ? ` / ${maxP}` : null}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={pending}
                            className="rounded-md border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(var(--mode-rgb),0.08)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-focus)] transition hover:border-[rgba(var(--mode-rgb),0.4)] hover:bg-[rgba(var(--mode-rgb),0.14)] disabled:opacity-50"
                            onClick={() => setFocus(p)}
                          >
                            Als focus
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            className="text-[11px] font-medium text-[var(--text-muted)] underline-offset-2 hover:text-[var(--accent-focus)] hover:underline disabled:opacity-50"
                            onClick={() => onOpenProtocol(p)}
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
