import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { HQPageHeader } from "@/components/hq";
import { hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getUserTimezone, getPushQuoteTime, getPushQuietHours, getPushSubscriptionEnabled } from "@/app/actions/auth";
import { getXP } from "@/app/actions/xp";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getBudgetSettings } from "@/app/actions/budget";
import { XPBadge } from "@/components/XPBadge";
import nextDynamic from "next/dynamic";
import { SettingsSnapshotFallback } from "@/components/settings/SettingsSnapshotFallback";
import { profileEngineHref } from "@/lib/profile-routes";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";

const SettingsExport = nextDynamic(() => import("@/components/SettingsExport").then((m) => ({ default: m.SettingsExport })), { loading: () => null });
const SettingsPush = nextDynamic(() => import("@/components/SettingsPush").then((m) => ({ default: m.SettingsPush })), {
  loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden />,
});
const SettingsDeleteAccount = nextDynamic(() => import("@/components/SettingsDeleteAccount").then((m) => ({ default: m.SettingsDeleteAccount })), { loading: () => null });
const SettingsAppleCalendar = nextDynamic(() => import("@/components/SettingsAppleCalendar").then((m) => ({ default: m.SettingsAppleCalendar })), { loading: () => null });
const SettingsGoogleCalendar = nextDynamic(() => import("@/components/SettingsGoogleCalendar").then((m) => ({ default: m.SettingsGoogleCalendar })), { loading: () => null });
const SettingsTimezone = nextDynamic(() => import("@/components/SettingsTimezone").then((m) => ({ default: m.SettingsTimezone })), { loading: () => null });
const SettingsBudget = nextDynamic(() => import("@/components/SettingsBudget").then((m) => ({ default: m.SettingsBudget })), { loading: () => null });
const SettingsAbout = nextDynamic(() => import("@/components/SettingsAbout").then((m) => ({ default: m.SettingsAbout })), { loading: () => null });
const ThemePicker = nextDynamic(() => import("@/components/settings/ThemePicker").then((m) => ({ default: m.ThemePicker })), { loading: () => null });
const SettingsCompactUi = nextDynamic(() => import("@/components/settings/SettingsCompactUi").then((m) => ({ default: m.SettingsCompactUi })), { loading: () => null });
const SettingsReducedMotion = nextDynamic(() => import("@/components/settings/SettingsReducedMotion").then((m) => ({ default: m.SettingsReducedMotion })), { loading: () => null });
const SettingsLightUI = nextDynamic(() => import("@/components/settings/SettingsLightUI").then((m) => ({ default: m.SettingsLightUI })), { loading: () => null });
const SettingsWhereToConfigure = nextDynamic(() => import("@/components/settings/SettingsWhereToConfigure").then((m) => ({ default: m.SettingsWhereToConfigure })), { loading: () => null });
const SettingsClearCache = nextDynamic(() => import("@/components/settings/SettingsClearCache").then((m) => ({ default: m.SettingsClearCache })), { loading: () => null });
const SettingsRefreshSnapshot = nextDynamic(() => import("@/components/settings/SettingsRefreshSnapshot").then((m) => ({ default: m.SettingsRefreshSnapshot })), { loading: () => null });
const SettingsDCICModeTest = nextDynamic(() => import("@/components/settings/SettingsDCICModeTest").then((m) => ({ default: m.SettingsDCICModeTest })), { loading: () => null });
const SettingsDcicModeExplain = nextDynamic(() => import("@/components/settings/SettingsDcicModeExplain").then((m) => ({ default: m.SettingsDcicModeExplain })), { loading: () => null });
const SettingsQuickLinks = nextDynamic(() => import("@/components/settings/SettingsQuickLinks").then((m) => ({ default: m.SettingsQuickLinks })), { loading: () => null });
const SettingsEmailReminders = nextDynamic(() => import("@/components/settings/SettingsEmailReminders").then((m) => ({ default: m.SettingsEmailReminders })), {
  loading: () => <div className="min-h-[80px] animate-pulse rounded-xl bg-white/5" aria-hidden />,
});
const SettingsHelpOnboarding = nextDynamic(() => import("@/components/settings/SettingsHelpOnboarding").then((m) => ({ default: m.SettingsHelpOnboarding })), { loading: () => null });

export const dynamic = "force-dynamic";

function SettingsShell() {
  return (
    <>
      <HQPageHeader
        title="Instellingen"
        subtitle="Site en apparaat: account, weergave, netwerk, budget. Engine en persona stuur je onder Profiel → Engine."
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

async function SettingsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [hasGoogle, userTimezone, xp, pushQuoteTime, pushQuietHours, pushEnabled, prefs, budgetSettings] = await Promise.all([
    hasGoogleCalendarToken(),
    getUserTimezone(),
    getXP(),
    getPushQuoteTime(),
    getPushQuietHours(),
    getPushSubscriptionEnabled(),
    getUserPreferencesOrDefaults(),
    getBudgetSettings(),
  ]);
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

  return (
    <>
      <SettingsCategory title="Gebruiker" subtitle="Account" defaultOpen>
        <section className="space-y-3" data-tutorial="settings-account">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Account</h2>
          <div className="card-simple overflow-hidden p-0">
            <div className="p-4">
              <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                HQ-persona, gedrag en engine:{" "}
                <a href={profileEngineHref("identity")} className="font-medium text-[var(--accent-focus)] hover:underline">
                  Profiel → Engine
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </SettingsCategory>

      <SettingsCategory title="Systeem" subtitle="Weergave, modus, DCIC en lokale appcontrole">
        <ThemePicker />
        <SettingsCompactUi initialCompactUi={prefs.compact_ui} />
        <SettingsReducedMotion initialReducedMotion={prefs.reduced_motion} />
        <SettingsLightUI initialLightUi={prefs.light_ui} />
        <XPBadge totalXp={xp.total_xp} level={xp.level} href="/settings" />
        <SettingsDcicModeExplain />
        <SettingsDCICModeTest />
        <SettingsClearCache />
        <SettingsRefreshSnapshot />
      </SettingsCategory>

      <SettingsCategory title="Netwerk" subtitle="Notificaties, tijdzone en agenda">
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

      <SettingsCategory title="Budget" subtitle="Valuta, drempels en snelle acties (app-breed)">
        <SettingsBudget
          initialCurrency={budgetSettings.currency}
          initialImpulseThresholdPct={budgetSettings.impulse_threshold_pct}
          initialBudgetPeriod={budgetSettings.budget_period}
          initialImpulseQuickAddMinutes={budgetSettings.impulse_quick_add_minutes}
          initialImpulseRiskCategories={budgetSettings.impulse_risk_categories}
        />
      </SettingsCategory>

      <SettingsCategory title="Toestel" subtitle="Export, privacy en uitleg">
        <SettingsQuickLinks />
        <SettingsExport />
        <SettingsDeleteAccount />
        <SettingsHelpOnboarding />
        <SettingsWhereToConfigure />
        <SettingsAbout appVersion={appVersion} />
      </SettingsCategory>
    </>
  );
}

export default async function SettingsPage() {
  const prefs = await getUserPreferencesOrDefaults();
  const simplified = prefs.simplified_content === true;

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Instellingen"
          footerLinks={[
            { href: "/profile", label: "Profiel" },
            { href: "/dashboard", label: "HQ" },
            { href: "/tasks", label: "Missions" },
          ]}
        >
          <Suspense fallback={<SettingsSnapshotFallback />}>
            <SettingsContent />
          </Suspense>
        </SimplifiedPageShell>
      </div>
    );
  }

  return (
    <div className="container page settings-page space-y-6">
      <SettingsShell />
      <Suspense fallback={<SettingsSnapshotFallback />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
