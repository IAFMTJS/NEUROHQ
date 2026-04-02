"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { profileInsightsHref } from "@/lib/profile-routes";

type Props = {
  sentence: string | null;
};

/** Scrolls to the insights section on the same page, or navigates to report and then scrolls. */
function scrollToMoreInsights() {
  const el = document.getElementById("patterns");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function InsightsComparativeCard({ sentence }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInsightsSurface =
    pathname === "/report" || (pathname === "/profile" && searchParams.get("view") === "insights");

  if (!sentence) return null;
  return (
    <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="Vergelijking">
      <h2 className="hq-h2 mb-2">Vergelijking</h2>
      <p className="hq-body mb-4 text-[var(--text-secondary)]">{sentence}</p>
      {isInsightsSurface ? (
        <button
          type="button"
          onClick={scrollToMoreInsights}
          className="btn-hq-secondary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4"
        >
          Meer insights
        </button>
      ) : (
        <Link href={profileInsightsHref("patterns")} className="btn-hq-secondary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4">
          Meer insights
        </Link>
      )}
    </section>
  );
}
