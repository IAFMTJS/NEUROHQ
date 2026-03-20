import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { HQPageHeader } from "@/components/hq";
import { hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getUserTimezone, getPushQuoteTime, getPushQuietHours, getPushSubscriptionEnabled } from "@/app/actions/auth";
import { getBudgetSettings } from "@/app/actions/budget";
import { getXP } from "@/app/actions/xp";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { XPBadge } from "@/components/XPBadge";
import dynamic from "next/dynamic";
import { SettingsSnapshotFallback } from "@/components/settings/SettingsSnapshotFallback";

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
const SettingsLightUI = dynamic(() => import("@/components/settings/SettingsLightUI").then((m) => ({ default: m.SettingsLightUI })), { loading: () => null });
const SettingsQuickLinks = dynamic(() => import("@/components/settings/SettingsQuickLinks").then((m) => ({ default: m.SettingsQuickLinks })), { loading: () => <div className="min-h-[60px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const SettingsWhereToConfigure = dynamic(() => import("@/components/settings/SettingsWhereToConfigure").then((m) => ({ default: m.SettingsWhereToConfigure })), { loading: () => null });
const SettingsClearCache = dynamic(() => import("@/components/settings/SettingsClearCache").then((m) => ({ default: m.SettingsClearCache })), { loading: () => null });
const SettingsRefreshSnapshot = dynamic(() => import("@/components/settings/SettingsRefreshSnapshot").then((m) => ({ default: m.SettingsRefreshSnapshot })), { loading: () => null });
const SettingsDCICModeTest = dynamic(() => import("@/components/settings/SettingsDCICModeTest").then((m) => ({ default: m.SettingsDCICModeTest })), { loading: () => null });
const BehaviorProfileSettings = dynamic(() => import("@/components/settings/BehaviorProfileSettings").then((m) => ({ default: m.BehaviorProfileSettings })), { loading: () => null });
const SettingsDaysOff = dynamic(() => import("@/components/settings/SettingsDaysOff").then((m) => ({ default: m.SettingsDaysOff })), { loading: () => null });
const SettingsEmailReminders = dynamic(() => import("@/components/settings/SettingsEmailReminders").then((m) => ({ default: m.SettingsEmailReminders })), { loading: () => <div className="min-h-[80px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const SettingsHelpOnboarding = dynamic(() => import("@/components/settings/SettingsHelpOnboarding").then((m) => ({ default: m.SettingsHelpOnboarding })), { loading: () => null });

function SettingsShell() {
  return (
    <>
      <HQPageHeader
        title="Settings"
        subtitle="Account, weergave, tijdzone, notificaties, budget, agenda, brain status (dashboard), Behavior Profile (identity, weekthema, avoidance), export en privacy."
        backHref="/dashboard"
      />
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="settings" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="settings" className="mascot-img" heroLarge />
        </div>
      </section>
    </>
  );
}

function SettingsCategory({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="card-simple overflow-hidden p-0" open={defaultOpen}>
      <summary className="cursor-pointer list-none border-b border-[var(--card-border)] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
      </summary>
      <div className="space-y-4 p-4">{children}</div>
    </details>
  );
}

function SettingsSubCard({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="card-simple overflow-hidden p-0" open={defaultOpen}>
      <summary className="cursor-pointer list-none border-b border-[var(--card-border)] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
      </summary>
      <div className="space-y-4 p-4">{children}</div>
    </details>
  );
}

async function SettingsContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [hasGoogle, userTimezone, budgetSettings, xp, pushQuoteTime, pushQuietHours, pushEnabled, prefs, behaviorProfile] = await Promise.all([
    hasGoogleCalendarToken(),
    getUserTimezone(),
    getBudgetSettings(),
    getXP(),
    getPushQuoteTime(),
    getPushQuietHours(),
    getPushSubscriptionEnabled(),
    getUserPreferencesOrDefaults(),
    getBehaviorProfile(),
  ]);
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

  return (
    <>
      <SettingsCategory title="Gebruiker" subtitle="Account, brain & gedrag, en budgetinstellingen" defaultOpen>
        <section className="space-y-3" data-tutorial="settings-account">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Account</h2>
          <div className="card-simple overflow-hidden p-0">
            <div className="p-4">
              <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
            </div>
          </div>
        </section>
        <SettingsQuickLinks />
        <SettingsSubCard
          title="Brain & gedrag"
          subtitle="Gedragsprofiel, routines en planningsbias"
          defaultOpen
        >
          <BehaviorProfileSettings initial={behaviorProfile} initialAutoMasterMissions={prefs.auto_master_missions} />
          <SettingsDaysOff initialDaysOff={prefs.usual_days_off ?? null} initialMode={prefs.day_off_mode ?? "soft"} />
        </SettingsSubCard>
        <SettingsSubCard
          title="Budget voorkeuren"
          subtitle="Valuta, budgetperiode en impulscontrole"
          defaultOpen
        >
          <SettingsBudget
            initialCurrency={budgetSettings.currency}
            initialImpulseThresholdPct={budgetSettings.impulse_threshold_pct}
            initialBudgetPeriod={budgetSettings.budget_period}
            initialImpulseQuickAddMinutes={budgetSettings.impulse_quick_add_minutes}
            initialImpulseRiskCategories={budgetSettings.impulse_risk_categories}
          />
        </SettingsSubCard>
      </SettingsCategory>

      <SettingsCategory title="Systeem" subtitle="Weergave, modus en lokale appcontrole">
        <ThemePicker />
        <SettingsCompactUi initialCompactUi={prefs.compact_ui} />
        <SettingsReducedMotion initialReducedMotion={prefs.reduced_motion} />
        <SettingsLightUI initialLightUi={prefs.light_ui} />
        <XPBadge totalXp={xp.total_xp} level={xp.level} href="/settings" />
        <SettingsDCICModeTest />
        <SettingsClearCache />
        <SettingsRefreshSnapshot />
      </SettingsCategory>

      <SettingsCategory title="Netwerk" subtitle="Notificaties, tijdzone en gekoppelde diensten">
        <section id="tijd-notificaties" className="space-y-3" data-tutorial="settings-push">
          <SettingsTimezone initialTimezone={userTimezone} />
          <SettingsPush
            initialPushQuoteTime={pushQuoteTime}
            initialQuietHours={pushQuietHours}
            initialPushSubscribed={pushEnabled}
            initialPushRemindersEnabled={prefs.push_reminders_enabled ?? true}
            initialPushMorningEnabled={prefs.push_morning_enabled ?? true}
            initialPushEveningEnabled={prefs.push_evening_enabled ?? true}
            initialPushWeeklyLearningEnabled={prefs.push_weekly_learning_enabled ?? true}
            initialPushPersonalityMode={prefs.push_personality_mode ?? "auto"}
          />
          <SettingsEmailReminders initialEnabled={prefs.email_reminders_enabled ?? true} />
        </section>
        <SettingsAppleCalendar />
        <SettingsGoogleCalendar hasToken={hasGoogle} />
      </SettingsCategory>

      <SettingsCategory title="Toestel" subtitle="Export, privacy en apparaatgerichte beheeracties">
        <SettingsExport />
        <SettingsDeleteAccount />
        <SettingsHelpOnboarding />
        <SettingsWhereToConfigure />
        <SettingsAbout appVersion={appVersion} />
      </SettingsCategory>
    </>
  );
}

export default function SettingsPage() {
  return (
    <div className="container page settings-page space-y-6">
      <SettingsShell />
      <Suspense fallback={<SettingsSnapshotFallback />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
