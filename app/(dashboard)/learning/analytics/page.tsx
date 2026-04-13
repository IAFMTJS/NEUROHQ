import dynamic from "next/dynamic";
import { HQPageHeader } from "@/components/hq";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getLearningAnalytics } from "@/app/actions/learning-analytics";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";

const LearningVelocityChart = dynamic(
  () => import("@/components/learning/LearningVelocityChart").then((m) => ({ default: m.LearningVelocityChart })),
  { loading: () => <div className="min-h-[160px] animate-pulse rounded-xl bg-white/5" aria-hidden /> },
);

type Props = {};

export default async function LearningAnalyticsPage(_props: Props) {
  const [prefs, analytics] = await Promise.all([getUserPreferencesOrDefaults(), getLearningAnalytics()]);
  const simplified = prefs.simplified_content === true;

  const body = (
    <>
      <section className="card-simple">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Trend summary</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Your learning velocity over the last weeks is{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {analytics.trendLabel === "rising"
              ? "rising"
              : analytics.trendLabel === "declining"
              ? "declining"
              : analytics.trendLabel === "stable"
              ? "stable"
              : "flat"}
          </span>
          {analytics.trendChangePct !== 0 && (
            <> ({analytics.trendChangePct > 0 ? "+" : ""}{analytics.trendChangePct}% vs. a few weeks ago)</>
          )}
          .
        </p>
      </section>

      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Learning velocity</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Weekly sessions. Calm trend view only.
            </p>
          </div>
        </div>
        <div className="p-4">
          <LearningVelocityChart points={analytics.velocity} />
        </div>
      </section>

      <section className="card-simple">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Knowledge density</h2>
        {analytics.knowledgeDensity.topTopics.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Once you log a few more sessions, we’ll show where your learning time concentrates.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Top focus topics in the last weeks:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-primary)]">
              {analytics.knowledgeDensity.topTopics.map((t) => (
                <li key={t.topic} className="flex items-center gap-4">
                  <span>{t.topic}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Growth analytics"
          footerLinks={[
            { href: "/learning", label: "Growth" },
            { href: "/dashboard", label: "HQ" },
            { href: "/tasks", label: "Missions" },
          ]}
        >
          <div className="space-y-6">{body}</div>
        </SimplifiedPageShell>
      </div>
    );
  }

  return (
    <div className="container page page-wide dashboard-cinematic pb-10">
      <div className="hq-frosted-main-shell">
        <DashboardCommandDeckFrame deckTitle="Growth analytics" innerClassName="gap-4">
          <div className="space-y-6">
            <HQPageHeader
              compact
              title="Growth analytics"
              subtitle="Trends in your learning sessions and topic focus."
            />
            {body}
          </div>
        </DashboardCommandDeckFrame>
      </div>
    </div>
  );
}

