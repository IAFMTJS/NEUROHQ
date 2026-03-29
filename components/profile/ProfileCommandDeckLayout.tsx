import Link from "next/link";
import type { ReactNode } from "react";
import { tasksDeckTabClass } from "@/components/missions/tasksDeckTabClass";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";
import { profileEngineHref, profileHomeHref } from "@/lib/profile-routes";

export type ProfileDeckMain = "home" | "engine";

type Props = {
  main: ProfileDeckMain;
  children: ReactNode;
};

/**
 * Profiel · command deck — same shell as /tasks: ambient frame + {@link VisualLabCommandDeck}
 * + segmented Profiel/Engine rail. Optimized for Light UI via `tasks-command-deck` + route flags.
 */
export function ProfileCommandDeckLayout({ main, children }: Props) {
  const deckTitle = main === "engine" ? "Engine" : "Profiel";

  return (
    <div className="profile-page-root container page page-wide pb-10 pt-4 sm:pt-5">
      <div className="profile-page-ambient rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.22)] p-3 sm:p-4 md:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <VisualLabCommandDeck>
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.18)] pb-4">
            <div className="min-w-0 border-l-2 border-[rgba(var(--semantic-accent),0.55)] pl-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Operator</p>
              <h1 className="mt-0.5 text-base font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-lg">
                {deckTitle}
              </h1>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 rounded-xl border border-[rgba(var(--mode-rgb),0.24)] bg-[rgba(6,18,30,0.55)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] shadow-[0_0_18px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-[rgba(var(--mode-rgb),0.4)] hover:bg-[rgba(8,26,42,0.65)] hover:text-[var(--text-primary)]"
            >
              ← HQ
            </Link>
          </header>

          <div className="mt-4" role="navigation" aria-label="Profiel navigatie">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Weergave</span>
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(4,12,22,0.5)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
              <Link
                href={profileHomeHref()}
                className={tasksDeckTabClass(main === "home")}
                aria-current={main === "home" ? "page" : undefined}
              >
                Profiel
              </Link>
              <Link
                href={profileEngineHref("identity")}
                className={tasksDeckTabClass(main === "engine")}
                aria-current={main === "engine" ? "page" : undefined}
              >
                Engine
              </Link>
            </div>
          </div>

          <div className="mt-4 space-y-6">{children}</div>
        </VisualLabCommandDeck>
      </div>
    </div>
  );
}
