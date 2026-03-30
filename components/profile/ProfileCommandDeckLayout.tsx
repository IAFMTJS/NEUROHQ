import Link from "next/link";
import type { ReactNode } from "react";
import { tasksDeckTabClass } from "@/components/missions/tasksDeckTabClass";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";
import { profileEngineHref, profileHomeHref } from "@/lib/profile-routes";

export type ProfileDeckMain = "home" | "engine";

type Props = {
  main: ProfileDeckMain;
  children: ReactNode;
};

/**
 * Profiel · command deck — same shell as /tasks: {@link DashboardCommandDeckFrame}
 * + segmented Profiel/Engine rail.
 */
export function ProfileCommandDeckLayout({ main, children }: Props) {
  const deckTitle = main === "engine" ? "Engine" : "Profiel";

  return (
    <div className="profile-page-root container page page-wide dashboard-cinematic pb-10 pt-4 sm:pt-5">
      <div className="hq-frosted-main-shell">
        <DashboardCommandDeckFrame deckTitle={deckTitle}>
          <div className="mt-4" role="navigation" aria-label="Profiel navigatie">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Weergave
              </span>
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
        </DashboardCommandDeckFrame>
      </div>
    </div>
  );
}
