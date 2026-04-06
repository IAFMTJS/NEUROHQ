import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HQPageHeader } from "@/components/hq";
import { hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getUserTimezone, getPushQuoteTime, getPushQuietHours, getPushSubscriptionEnabled } from "@/app/actions/auth";
import { getXP } from "@/app/actions/xp";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getBudgetSettings } from "@/app/actions/budget";
import { XPBadge } from "@/components/XPBadge";
import nextDynamic from "next/dynamic";
import { SettingsSnapshotFallback } from "@/components/settings/SettingsSnapshotFallback";
import { SettingsPageLayout } from "@/components/settings/SettingsPageLayout";
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard";
import { profileEngineHref } from "@/lib/profile-routes";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";

const SettingsExport = nextDynamic(() => import("@/components/SettingsExport").then((m) => ({ default: m.SettingsExport })), { loading: () => null });
const SettingsPush = nextDynamic(() => import("@/components/SettingsPush").then((m) => ({ default: m.SettingsPush })), {
  loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden />,
});
const SettingsAppleCalendar = nextDynamic(() => import("@/components/SettingsAppleCalendar").then((m) => ({ default: m.SettingsAppleCalendar })), { loading: () => null });
const SettingsGoogleCalendar = nextDynamic(() => import("@/components/SettingsGoogleCalendar").then((m) => ({ default: m.SettingsGoogleCalendar })), { loading: () => null });
const SettingsTimezone = nextDynamic(() => import("@/components/SettingsTimezone").then((m) => ({ default: m.SettingsTimezone })), { loading: () => null });
const SettingsBudget = nextDynamic(() => import("@/components/SettingsBudget").then((m) => ({ default: m.SettingsBudget })), { loading: () => null });
const SettingsAbout = nextDynamic(() => import("@/components/SettingsAbout").then((m) => ({ default: m.SettingsAbout })), { loading: () => null });
const ThemePicker = nextDynamic(() => import("@/components/settings/ThemePicker").then((m) => ({ default: m.ThemePicker })), { loading: () => null });
const SettingsWhereToConfigure = nextDynamic(() => import("@/components/settings/SettingsWhereToConfigure").then((m) => ({ default: m.SettingsWhereToConfigure })), { loading: () => null });
const SettingsClearCache = nextDynamic(() => import("@/components/settings/SettingsClearCache").then((m) => ({ default: m.SettingsClearCache })), { loading: () => null });
const SettingsRefreshSnapshot = nextDynamic(() => import("@/components/settings/SettingsRefreshSnapshot").then((m) => ({ default: m.SettingsRefreshSnapshot })), { loading: () => null });
const SettingsHardRefresh = nextDynamic(() => import("@/components/settings/SettingsHardRefresh").then((m) => ({ default: m.SettingsHardRefresh })), { loading: () => null });
const SettingsDCICModeTest = nextDynamic(() => import("@/components/settings/SettingsDCICModeTest").then((m) => ({ default: m.SettingsDCICModeTest })), { loading: () => null });
const SettingsDcicModeExplain = nextDynamic(() => import("@/components/settings/SettingsDcicModeExplain").then((m) => ({ default: m.SettingsDcicModeExplain })), { loading: () => null });
const SettingsHelpOnboarding = nextDynamic(() => import("@/components/settings/SettingsHelpOnboarding").then((m) => ({ default: m.SettingsHelpOnboarding })), { loading: () => null });
const SettingsAutoMasterMissions = nextDynamic(
  () => import("@/components/settings/SettingsAutoMasterMissions").then((m) => ({ default: m.SettingsAutoMasterMissions })),
  { loading: () => <div className="min-h-[88px] animate-pulse rounded-xl bg-white/5" aria-hidden /> },
);
const SettingsUiFeedback = nextDynamic(
  () => import("@/components/settings/SettingsUiFeedback").then((m) => ({ default: m.SettingsUiFeedback })),
  { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> },
);

export const dynamic = "force-dynamic";

function SettingsShell() {
  return (
    <>
      <HQPageHeader
        compact
        title="Instellingen"
        subtitle="Accountoverzicht, missies, systeem en toestel. Engine en persona stuur je onder Profiel → Engine."
      />
    </>
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
    <SettingsPageLayout>
      <SettingsSectionCard
        id="settings-section-user"
        title="Gebruiker"
        subtitle="Account"
        searchText="account email profiel persona identity inlog hq"
      >
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
      </SettingsSectionCard>

      <SettingsSectionCard
        id="settings-section-missions"
        title="Missies"
        subtitle="Automatische suggesties op je dag"
        searchText="missies master automatisering suggesties gedrag weekthema ochtend"
      >
        <SettingsAutoMasterMissions initialEnabled={prefs.auto_master_missions} />
        <p className="text-xs text-[var(--text-muted)]">
          Gedragsprofiel en weekthema:{" "}
          <a href={profileEngineHref("behavior")} className="font-medium text-[var(--accent-focus)] hover:underline">
            Profiel → Engine → Gedrag
          </a>
          .
        </p>
      </SettingsSectionCard>

      <SettingsSectionCard
        id="settings-section-system"
        title="Systeem"
        subtitle="Thema, budget, DCIC en lokale appcontrole"
        searchText="thema neuro amber emerald dcic modus snapshot cache harde refresh volledig vernieuwen service worker xp level dark mode budget valuta eur usd impuls drempel periode maand week categorie risk quick add geluid spraak tts"
      >
        <ThemePicker />
        <SettingsUiFeedback
          initialSoundEnabled={prefs.ui_sound_enabled !== false}
          initialSpeechEnabled={prefs.ui_speech_enabled === true}
        />
        <XPBadge totalXp={xp.total_xp} level={xp.level} href="/settings" />
        <SettingsBudget
          initialCurrency={budgetSettings.currency}
          initialImpulseThresholdPct={budgetSettings.impulse_threshold_pct}
          initialBudgetPeriod={budgetSettings.budget_period}
          initialImpulseQuickAddMinutes={budgetSettings.impulse_quick_add_minutes}
          initialImpulseRiskCategories={budgetSettings.impulse_risk_categories}
        />
        <SettingsDcicModeExplain />
        <SettingsDCICModeTest />
        <SettingsHardRefresh />
        <SettingsClearCache />
        <SettingsRefreshSnapshot />
      </SettingsSectionCard>

      <SettingsSectionCard
        id="settings-section-device"
        title="Toestel"
        subtitle="Tijdzone, push, agenda’s en data"
        searchText="push notificaties tijdzone agenda google apple calendar icloud ochtend avond quote stille uren export data download privacy onboarding help waar configureer versie about"
      >
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
        </section>
        <SettingsAppleCalendar />
        <SettingsGoogleCalendar hasToken={hasGoogle} />
        <SettingsExport />
        <SettingsHelpOnboarding />
        <SettingsWhereToConfigure />
        <SettingsAbout appVersion={appVersion} />
      </SettingsSectionCard>
    </SettingsPageLayout>
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
    <div className="container page settings-page dashboard-cinematic pb-10">
      <div className="hq-frosted-main-shell">
        <DashboardCommandDeckFrame deckTitle="Instellingen" innerClassName="gap-4">
          <div className="space-y-6">
            <SettingsShell />
            <Suspense fallback={<SettingsSnapshotFallback />}>
              <SettingsContent />
            </Suspense>
          </div>
        </DashboardCommandDeckFrame>
      </div>
    </div>
  );
}
