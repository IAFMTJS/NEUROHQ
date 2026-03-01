import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { HQPageHeader } from "@/components/hq";
import { hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getUserTimezone, getPushQuoteTime, getPushQuietHours } from "@/app/actions/auth";
import { getBudgetSettings } from "@/app/actions/budget";
import { getXP } from "@/app/actions/xp";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { XPBadge } from "@/components/XPBadge";
import dynamic from "next/dynamic";

const SettingsExport = dynamic(() => import("@/components/SettingsExport").then((m) => ({ default: m.SettingsExport })), { loading: () => null });
const SettingsPush = dynamic(() => import("@/components/SettingsPush").then((m) => ({ default: m.SettingsPush })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const SettingsDeleteAccount = dynamic(() => import("@/components/SettingsDeleteAccount").then((m) => ({ default: m.SettingsDeleteAccount })), { loading: () => null });
const SettingsAppleCalendar = dynamic(() => import("@/components/SettingsAppleCalendar").then((m) => ({ default: m.SettingsAppleCalendar })), { loading: () => null });
const SettingsGoogleCalendar = dynamic(() => import("@/components/SettingsGoogleCalendar").then((m) => ({ default: m.SettingsGoogleCalendar })), { loading: () => null });
const SettingsTimezone = dynamic(() => import("@/components/SettingsTimezone").then((m) => ({ default: m.SettingsTimezone })), { loading: () => null });
const SettingsBudget = dynamic(() => import("@/components/SettingsBudget").then((m) => ({ default: m.SettingsBudget })), { loading: () => null });
const SettingsAbout = dynamic(() => import("@/components/SettingsAbout").then((m) => ({ default: m.SettingsAbout })), { loading: () => null });
const ThemePicker = dynamic(() => import("@/components/settings/ThemePicker").then((m) => ({ default: m.ThemePicker })), { loading: () => null });
const SettingsCompactUi = dynamic(() => import("@/components/settings/SettingsCompactUi").then((m) => ({ default: m.SettingsCompactUi })), { loading: () => null });
const SettingsReducedMotion = dynamic(() => import("@/components/settings/SettingsReducedMotion").then((m) => ({ default: m.SettingsReducedMotion })), { loading: () => null });
const SettingsQuickLinks = dynamic(() => import("@/components/settings/SettingsQuickLinks").then((m) => ({ default: m.SettingsQuickLinks })), { loading: () => <div className="min-h-[60px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const SettingsWhereToConfigure = dynamic(() => import("@/components/settings/SettingsWhereToConfigure").then((m) => ({ default: m.SettingsWhereToConfigure })), { loading: () => null });
const BehaviorProfileSettings = dynamic(() => import("@/components/settings/BehaviorProfileSettings").then((m) => ({ default: m.BehaviorProfileSettings })), { loading: () => null });

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [hasGoogle, userTimezone, budgetSettings, xp, pushQuoteTime, pushQuietHours, prefs, behaviorProfile] = await Promise.all([
    hasGoogleCalendarToken(),
    getUserTimezone(),
    getBudgetSettings(),
    getXP(),
    getPushQuoteTime(),
    getPushQuietHours(),
    getUserPreferencesOrDefaults(),
    getBehaviorProfile(),
  ]);
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

  return (
    <div className="container page settings-page space-y-6">
      <HQPageHeader
        title="Settings"
        subtitle="Account, weergave, tijdzone, notificaties, budget, agenda, brain status (dashboard), Behavior Profile (identity, weekthema, avoidance), export en privacy."
        backHref="/dashboard"
      />
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="settings" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="settings" className="mascot-img" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Account</h2>
        <div className="card-simple overflow-hidden p-0">
          <div className="p-4">
            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Snel naar</h2>
        <SettingsQuickLinks />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Weergave</h2>
        <div className="space-y-4">
          <ThemePicker />
          <SettingsCompactUi initialCompactUi={prefs.compact_ui} />
          <SettingsReducedMotion initialReducedMotion={prefs.reduced_motion} />
          <XPBadge totalXp={xp.total_xp} level={xp.level} href="/settings" />
        </div>
      </section>

      <BehaviorProfileSettings initial={behaviorProfile} initialAutoMasterMissions={prefs.auto_master_missions} />

      <section id="tijd-notificaties" className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Tijd & notificaties</h2>
        <div className="space-y-4">
          <SettingsTimezone initialTimezone={userTimezone} />
          <SettingsPush initialPushQuoteTime={pushQuoteTime} initialQuietHours={pushQuietHours} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Budget & geld</h2>
        <SettingsBudget
        initialCurrency={budgetSettings.currency}
        initialImpulseThresholdPct={budgetSettings.impulse_threshold_pct}
        initialBudgetPeriod={budgetSettings.budget_period}
        initialImpulseQuickAddMinutes={budgetSettings.impulse_quick_add_minutes}
        initialImpulseRiskCategories={budgetSettings.impulse_risk_categories}
      />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Agenda</h2>
        <div className="space-y-4">
          <SettingsAppleCalendar />
          <SettingsGoogleCalendar hasToken={hasGoogle} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Gegevens & privacy</h2>
        <div className="space-y-4">
          <SettingsExport />
          <SettingsDeleteAccount />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Over & hulp</h2>
        <SettingsWhereToConfigure />
        <SettingsAbout appVersion={appVersion} />
      </section>
    </div>
  );
}
