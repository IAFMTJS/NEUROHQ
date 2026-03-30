import { Suspense } from "react";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { HQPageHeader } from "@/components/hq";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { ReportSnapshotFallback } from "@/components/report/ReportSnapshotFallback";
import { ReportInsightsContent } from "@/components/report/ReportInsightsContent";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";

type Props = { searchParams: Promise<{ weekStart?: string; tab?: string }> };

export const dynamic = "force-dynamic";

function ReportShell() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HQPageHeader compact title="Insights" subtitle="Verklaren, voorspellen, sturen." />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" aria-hidden />
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Momentum, trend, gedragspatronen, voorspellingen en aanbevelingen. Alles wat we tracken: 7d / 30d, bronnen, wekelijkse vergelijking.
      </p>
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="report" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="report" className="mascot-img" heroLarge />
        </div>
      </section>
    </>
  );
}

export default async function ReportPage({ searchParams }: Props) {
  const prefs = await getUserPreferencesOrDefaults();
  const simplified = prefs.simplified_content === true;

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Insights"
          footerLinks={[
            { href: "/tasks", label: "Missions" },
            { href: "/strategy", label: "Strategy" },
            { href: "/budget", label: "Budget" },
          ]}
        >
          <Suspense fallback={<ReportSnapshotFallback />}>
            <ReportInsightsContent searchParams={searchParams} simplifiedLayout />
          </Suspense>
        </SimplifiedPageShell>
      </div>
    );
  }

  return (
    <div className="container page page-wide dashboard-cinematic pb-10">
      <div className="hq-frosted-main-shell">
        <DashboardCommandDeckFrame deckTitle="Insights" innerClassName="gap-4">
          <div className="space-y-6">
            <ReportShell />
            <Suspense fallback={<ReportSnapshotFallback />}>
              <ReportInsightsContent searchParams={searchParams} />
            </Suspense>
          </div>
        </DashboardCommandDeckFrame>
      </div>
    </div>
  );
}
