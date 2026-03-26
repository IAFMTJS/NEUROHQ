import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";
import { HQPageHeader } from "@/components/hq";
import { HeroMascotImage } from "@/components/HeroMascotImage";
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

  const [prefs, behaviorProfile, studyPlan, accountabilitySettings, budgetSettings] = await Promise.all([
    getUserPreferencesOrDefaults(),
    getBehaviorProfile(),
    getStudyPlan(),
    getAccountabilitySettings(),
    getBudgetSettings(),
  ]);

  return (
    <div className="container page page-wide space-y-6">
      <HQPageHeader
        title="Profiel"
        subtitle="Persoonlijke instellingen en personalisatie."
        backHref="/dashboard"
      />
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="settings" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="settings" className="mascot-img" heroLarge />
        </div>
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

