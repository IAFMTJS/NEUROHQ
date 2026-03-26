import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";
import { HQPageHeader } from "@/components/hq";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getXPFullContext } from "@/app/actions/xp-context";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getStudyPlan, getAccountabilitySettings } from "@/app/actions/behavior";
import { getBudgetSettings } from "@/app/actions/budget";
import { UserCallsignCard } from "@/components/settings/UserCallsignCard";

const ThemePicker = nextDynamic(() => import("@/components/settings/ThemePicker").then((m) => ({ default: m.ThemePicker })), { loading: () => null });
const SettingsCompactUi = nextDynamic(() => import("@/components/settings/SettingsCompactUi").then((m) => ({ default: m.SettingsCompactUi })), { loading: () => null });
const SettingsReducedMotion = nextDynamic(() => import("@/components/settings/SettingsReducedMotion").then((m) => ({ default: m.SettingsReducedMotion })), { loading: () => null });
const SettingsLightUI = nextDynamic(() => import("@/components/settings/SettingsLightUI").then((m) => ({ default: m.SettingsLightUI })), { loading: () => null });
const BehaviorProfileSettings = nextDynamic(() => import("@/components/settings/BehaviorProfileSettings").then((m) => ({ default: m.BehaviorProfileSettings })), { loading: () => null });
const SettingsEngineProfile = nextDynamic(() => import("@/components/settings/SettingsEngineProfile").then((m) => ({ default: m.SettingsEngineProfile })), { loading: () => null });
const SettingsDaysOff = nextDynamic(() => import("@/components/settings/SettingsDaysOff").then((m) => ({ default: m.SettingsDaysOff })), { loading: () => null });
const SettingsBudget = nextDynamic(() => import("@/components/SettingsBudget").then((m) => ({ default: m.SettingsBudget })), { loading: () => null });

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [xpContext, prefs, behaviorProfile, studyPlan, accountabilitySettings, budgetSettings] = await Promise.all([
    getXPFullContext(),
    getUserPreferencesOrDefaults(),
    getBehaviorProfile(),
    getStudyPlan(),
    getAccountabilitySettings(),
    getBudgetSettings(),
  ]);

  const insight = xpContext.insightState;

  return (
    <div className="container page page-wide space-y-6">
      <HQPageHeader
        title="Profiel"
        subtitle="Jouw insights + persoonlijke instellingen in één command center."
        backHref="/dashboard"
      />
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="settings" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="settings" className="mascot-img" heroLarge />
        </div>
      </section>

      <section className="card-simple space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Insights snapshot</p>
        {insight ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-3">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Momentum</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{insight.momentum.score}/100</p>
            </div>
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-3">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">XP 7d</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{insight.xpLast7}</p>
            </div>
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-3">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Completion 7d</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                {insight.completionRateLast7 != null ? `${Math.round(insight.completionRateLast7 * 100)}%` : "-"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Nog niet genoeg data voor een insights snapshot.</p>
        )}
        <a href="/report" className="text-sm font-semibold text-[var(--accent-focus)] hover:underline">
          Open volledige Insights pagina
        </a>
      </section>

      <UserCallsignCard />

      <section className="card-simple space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Visuals & UI</p>
        <ThemePicker />
        <SettingsCompactUi initialCompactUi={prefs.compact_ui} />
        <SettingsReducedMotion initialReducedMotion={prefs.reduced_motion} />
        <SettingsLightUI initialLightUi={prefs.light_ui} />
      </section>

      <section className="card-simple space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Persoonlijke sturing</p>
        <BehaviorProfileSettings initial={behaviorProfile} initialAutoMasterMissions={prefs.auto_master_missions} />
        <SettingsEngineProfile initialStudyPlan={studyPlan} initialAccountability={accountabilitySettings} />
        <SettingsDaysOff initialDaysOff={prefs.usual_days_off ?? null} initialMode={prefs.day_off_mode ?? "soft"} />
      </section>

      <section className="card-simple space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Budget voorkeuren</p>
        <SettingsBudget
          initialCurrency={budgetSettings.currency}
          initialImpulseThresholdPct={budgetSettings.impulse_threshold_pct}
          initialBudgetPeriod={budgetSettings.budget_period}
          initialImpulseQuickAddMinutes={budgetSettings.impulse_quick_add_minutes}
          initialImpulseRiskCategories={budgetSettings.impulse_risk_categories}
        />
      </section>
    </div>
  );
}

