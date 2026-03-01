import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HQPageHeader } from "@/components/hq";
import { getAnalyticsFunnel } from "@/app/actions/analytics-funnel";
import { getMakerWeeklyStats } from "@/app/actions/analytics-maker";

export default async function MakerAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = ((userRow as { role?: string | null } | null)?.role ?? "user") === "admin";

  if (!isAdmin) {
    redirect("/analytics");
  }

  const [weeklyStats, funnel] = await Promise.all([
    getMakerWeeklyStats(8),
    getAnalyticsFunnel(8),
  ]);

  const lastWeeks = weeklyStats.slice(-8);
  const lastFunnelWeeks = funnel.slice(-4);

  return (
    <div className="container page page-wide space-y-6">
      <HQPageHeader
        title="Maker dashboard"
        subtitle="High-level funnel and engine health (admin only)."
        backHref="/analytics"
      />

      <section className="glass-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Weekly engine stats
          </h2>
          <p className="text-[10px] text-[var(--text-muted)]">
            Averages across user_analytics_daily and events.
          </p>
        </div>
        {lastWeeks.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            No analytics rows yet. Engine has not recorded weekly stats.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-muted)]">
                  <th className="px-2 py-1 text-left font-medium">Week</th>
                  <th className="px-2 py-1 text-right font-medium">xp_earned avg</th>
                  <th className="px-2 py-1 text-right font-medium">missions avg</th>
                  <th className="px-2 py-1 text-right font-medium">energy avg</th>
                  <th className="px-2 py-1 text-right font-medium">focus avg</th>
                  <th className="px-2 py-1 text-right font-medium">forced confr.</th>
                  <th className="px-2 py-1 text-right font-medium">Minimal Integrity</th>
                </tr>
              </thead>
              <tbody>
                {lastWeeks.map((w) => (
                  <tr
                    key={w.weekStart}
                    className="border-b border-[var(--card-border)]/60 last:border-0"
                  >
                    <td className="px-2 py-1 text-[var(--text-secondary)]">
                      {w.weekStart} – {w.weekEnd}
                    </td>
                    <td className="px-2 py-1 text-right text-[var(--text-primary)]">
                      {w.xpAvg.toFixed(1)}
                    </td>
                    <td className="px-2 py-1 text-right text-[var(--text-primary)]">
                      {w.missionsAvg.toFixed(1)}
                    </td>
                    <td className="px-2 py-1 text-right text-[var(--text-primary)]">
                      {w.energyAvg != null ? w.energyAvg.toFixed(1) : "—"}
                    </td>
                    <td className="px-2 py-1 text-right text-[var(--text-primary)]">
                      {w.focusAvg != null ? w.focusAvg.toFixed(1) : "—"}
                    </td>
                    <td className="px-2 py-1 text-right text-[var(--text-primary)]">
                      {w.forcedConfrontations}
                    </td>
                    <td className="px-2 py-1 text-right text-[var(--text-primary)]">
                      {w.minimalIntegrityMissions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {lastFunnelWeeks.length > 0 && (
        <section className="glass-card p-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Weekly onboarding funnel (signup → eerste completion)
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Unieke users per stap; conversie tussen stappen (laatste weken).
          </p>
          <div className="mt-3 space-y-4">
            {lastFunnelWeeks.map((week) => (
              <div
                key={week.weekStart}
                className="rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-surface)]/60 p-3"
              >
                <div className="flex items-baseline justify-between text-xs text-[var(--text-muted)]">
                  <span>
                    Week {week.weekStart} – {week.weekEnd}
                  </span>
                  <span>
                    Sign‑ups:{" "}
                    <strong className="text-[var(--text-primary)]">
                      {week.onboarding[0]?.users ?? 0}
                    </strong>
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {week.onboarding.map((step, index) => (
                    <div key={step.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">
                          {step.label}
                        </span>
                        <span className="text-[var(--text-primary)]">
                          {step.users}
                          {index > 0 &&
                            step.conversionFromPrevious != null && (
                              <span className="ml-1 text-[var(--text-muted)]">
                                (
                                {Math.round(
                                  step.conversionFromPrevious * 100
                                )}
                                %)
                              </span>
                            )}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-[var(--accent-focus)]"
                          style={{
                            width: `${
                              week.onboarding[0]?.users
                                ? Math.min(
                                    100,
                                    (step.users /
                                      Math.max(
                                        1,
                                        week.onboarding[0].users
                                      )) * 100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {lastFunnelWeeks.length > 0 && (
        <section className="glass-card p-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Weekly missions funnel (Add → Start → Complete)
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Hoeveel users doorlopen de missions‑stappen per week.
          </p>
          <div className="mt-3 space-y-4">
            {lastFunnelWeeks.map((week) => (
              <div
                key={week.weekStart}
                className="rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-surface)]/60 p-3"
              >
                <div className="flex items-baseline justify-between text-xs text-[var(--text-muted)]">
                  <span>
                    Week {week.weekStart} – {week.weekEnd}
                  </span>
                  <span>
                    Add → Complete:{" "}
                    <strong className="text-[var(--text-primary)]">
                      {week.missions[0]?.users ?? 0} →{" "}
                      {week.missions[week.missions.length - 1]?.users ?? 0}
                    </strong>
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {week.missions.map((step, index) => (
                    <div key={step.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">
                          {step.label}
                        </span>
                        <span className="text-[var(--text-primary)]">
                          {step.users}
                          {index > 0 &&
                            step.conversionFromPrevious != null && (
                              <span className="ml-1 text-[var(--text-muted)]">
                                (
                                {Math.round(
                                  step.conversionFromPrevious * 100
                                )}
                                %)
                              </span>
                            )}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-[var(--accent-focus)]"
                          style={{
                            width: `${
                              week.missions[0]?.users
                                ? Math.min(
                                    100,
                                    (step.users /
                                      Math.max(
                                        1,
                                        week.missions[0].users
                                      )) * 100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-[10px] text-[var(--text-muted)]">
        This page is for internal engine sanity‑checks. Counts for forced confrontations and Minimal
        Integrity missions are based on analytics_events going forward.
      </p>
    </div>
  );
}

