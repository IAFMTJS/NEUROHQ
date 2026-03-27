import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import { HQPageHeader } from "@/components/hq";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getStudyPlan, getAccountabilitySettings } from "@/app/actions/behavior";
import { getBudgetSettings } from "@/app/actions/budget";
import { getXPFullContext } from "@/app/actions/xp-context";
import { hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getUserTimezone, getPushQuoteTime, getPushQuietHours, getPushSubscriptionEnabled } from "@/app/actions/auth";
import { getXP } from "@/app/actions/xp";
import { UserCallsignCard } from "@/components/settings/UserCallsignCard";
import { ProfileCategory, ProfileSubCard } from "@/components/profile/ProfileSection";
import { ProfileHomeCompact } from "@/components/profile/ProfileHomeCompact";
import { ReportSnapshotFallback } from "@/components/report/ReportSnapshotFallback";
import { ReportInsightsContent } from "@/components/report/ReportInsightsContent";
import {
  parseProfileMainView,
  parseProfileSettingsTab,
  profileHomeHref,
  profileSettingsHref,
  type ProfileSettingsTabId,
} from "@/lib/profile-routes";
import { XPBadge } from "@/components/XPBadge";

const ThemePicker = nextDynamic(() => import("@/components/settings/ThemePicker").then((m) => ({ default: m.ThemePicker })), { loading: () => null });
const SettingsCompactUi = nextDynamic(() => import("@/components/settings/SettingsCompactUi").then((m) => ({ default: m.SettingsCompactUi })), { loading: () => null });
const SettingsReducedMotion = nextDynamic(() => import("@/components/settings/SettingsReducedMotion").then((m) => ({ default: m.SettingsReducedMotion })), { loading: () => null });
const SettingsLightUI = nextDynamic(() => import("@/components/settings/SettingsLightUI").then((m) => ({ default: m.SettingsLightUI })), { loading: () => null });
const BehaviorProfileSettings = nextDynamic(() => import("@/components/settings/BehaviorProfileSettings").then((m) => ({ default: m.BehaviorProfileSettings })), { loading: () => null });
const SettingsEngineProfile = nextDynamic(() => import("@/components/settings/SettingsEngineProfile").then((m) => ({ default: m.SettingsEngineProfile })), { loading: () => null });
const SettingsDaysOff = nextDynamic(() => import("@/components/settings/SettingsDaysOff").then((m) => ({ default: m.SettingsDaysOff })), { loading: () => null });
const SettingsBudget = nextDynamic(() => import("@/components/SettingsBudget").then((m) => ({ default: m.SettingsBudget })), { loading: () => null });
const SettingsExport = nextDynamic(() => import("@/components/SettingsExport").then((m) => ({ default: m.SettingsExport })), { loading: () => null });
const SettingsPush = nextDynamic(() => import("@/components/SettingsPush").then((m) => ({ default: m.SettingsPush })), {
  loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden />,
});
const SettingsDeleteAccount = nextDynamic(() => import("@/components/SettingsDeleteAccount").then((m) => ({ default: m.SettingsDeleteAccount })), { loading: () => null });
const SettingsAppleCalendar = nextDynamic(() => import("@/components/SettingsAppleCalendar").then((m) => ({ default: m.SettingsAppleCalendar })), { loading: () => null });
const SettingsGoogleCalendar = nextDynamic(() => import("@/components/SettingsGoogleCalendar").then((m) => ({ default: m.SettingsGoogleCalendar })), { loading: () => null });
const SettingsTimezone = nextDynamic(() => import("@/components/SettingsTimezone").then((m) => ({ default: m.SettingsTimezone })), { loading: () => null });
const SettingsAbout = nextDynamic(() => import("@/components/SettingsAbout").then((m) => ({ default: m.SettingsAbout })), { loading: () => null });
const SettingsWhereToConfigure = nextDynamic(() => import("@/components/settings/SettingsWhereToConfigure").then((m) => ({ default: m.SettingsWhereToConfigure })), { loading: () => null });
const SettingsClearCache = nextDynamic(() => import("@/components/settings/SettingsClearCache").then((m) => ({ default: m.SettingsClearCache })), { loading: () => null });
const SettingsRefreshSnapshot = nextDynamic(() => import("@/components/settings/SettingsRefreshSnapshot").then((m) => ({ default: m.SettingsRefreshSnapshot })), { loading: () => null });
const SettingsDCICModeTest = nextDynamic(() => import("@/components/settings/SettingsDCICModeTest").then((m) => ({ default: m.SettingsDCICModeTest })), { loading: () => null });
const SettingsDcicModeExplain = nextDynamic(() => import("@/components/settings/SettingsDcicModeExplain").then((m) => ({ default: m.SettingsDcicModeExplain })), { loading: () => null });
const SettingsSimplifiedContent = nextDynamic(() => import("@/components/settings/SettingsSimplifiedContent").then((m) => ({ default: m.SettingsSimplifiedContent })), { loading: () => null });
const SettingsEmailReminders = nextDynamic(() => import("@/components/settings/SettingsEmailReminders").then((m) => ({ default: m.SettingsEmailReminders })), {
  loading: () => <div className="min-h-[80px] animate-pulse rounded-xl bg-white/5" aria-hidden />,
});
const SettingsHelpOnboarding = nextDynamic(() => import("@/components/settings/SettingsHelpOnboarding").then((m) => ({ default: m.SettingsHelpOnboarding })), { loading: () => null });

export const dynamic = "force-dynamic";

const SETTINGS_NAV: { id: ProfileSettingsTabId; label: string }[] = [
  { id: "identity", label: "Identiteit" },
  { id: "behavior", label: "Gedrag" },
  { id: "system", label: "Systeem" },
  { id: "budget", label: "Budget" },
  { id: "insights", label: "Insights" },
];

function MainTabNav({ active }: { active: "home" | "settings" }) {
  const c =
    "rounded-lg border px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide transition min-h-[44px] flex flex-1 items-center justify-center sm:flex-none";
  const on = "border-[var(--semantic-ring)]/60 bg-[var(--semantic-accent)]/20 text-[var(--semantic-accent)]";
  const off = "border-[var(--card-border)]/60 bg-[var(--bg-surface)]/20 text-[var(--text-muted)] hover:border-[var(--semantic-ring)]/40 hover:text-[var(--text-primary)]";
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Profiel navigatie">
      <Link href={profileHomeHref()} aria-current={active === "home" ? "page" : undefined} className={`${c} ${active === "home" ? on : off}`}>
        Profiel
      </Link>
      <Link
        href={profileSettingsHref("identity")}
        aria-current={active === "settings" ? "page" : undefined}
        className={`${c} ${active === "settings" ? on : off}`}
      >
        Instellingen
      </Link>
    </nav>
  );
}

function SettingsTabNav({ active }: { active: ProfileSettingsTabId }) {
  const c =
    "rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition whitespace-nowrap";
  const on = "border-[var(--semantic-ring)]/60 bg-[var(--semantic-accent)]/15 text-[var(--semantic-accent)]";
  const off = "border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/35 hover:text-[var(--text-primary)]";
  return (
    <nav
      className="sticky top-[calc(env(safe-area-inset-top,0px)+4px)] z-20 -mx-1 flex gap-1 overflow-x-auto pb-1"
      aria-label="Instellingen"
    >
      {SETTINGS_NAV.map(({ id, label }) => (
        <Link key={id} href={profileSettingsHref(id)} aria-current={active === id ? "page" : undefined} className={`${c} ${active === id ? on : off}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

type Search = {
  view?: string;
  settingsTab?: string;
  insightsTab?: string;
  weekStart?: string;
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const mainView = parseProfileMainView(raw.view);

  if (mainView === "home") {
    const xpCtx = await getXPFullContext();
    const { identity, insightState } = xpCtx;
    return (
      <div className="container page page-wide space-y-5 pb-10">
        <HQPageHeader title="Profiel" subtitle="Identiteit en status." backHref="/dashboard" />
        <MainTabNav active="home" />
        <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="profile" aria-hidden>
          <div className="mascot-hero-inner mx-auto">
            <HeroMascotImage page="profile" className="mascot-img" heroLarge />
          </div>
        </section>
        <ProfileHomeCompact identity={identity} insightState={insightState} />
      </div>
    );
  }

  const settingsTab = parseProfileSettingsTab(raw.settingsTab);

  const [prefs, behaviorProfile, studyPlan, accountabilitySettings, budgetSettings, hasGoogle, userTimezone, xp, pushQuoteTime, pushQuietHours, pushEnabled] =
    await Promise.all([
      getUserPreferencesOrDefaults(),
      getBehaviorProfile(),
      getStudyPlan(),
      getAccountabilitySettings(),
      getBudgetSettings(),
      hasGoogleCalendarToken(),
      getUserTimezone(),
      getXP(),
      getPushQuoteTime(),
      getPushQuietHours(),
      getPushSubscriptionEnabled(),
    ]);

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

  const insightsSearchParams = Promise.resolve({
    weekStart: raw.weekStart,
    tab: raw.insightsTab,
  });

  return (
    <div className="container page page-wide space-y-5 pb-10">
      <HQPageHeader title="Instellingen" subtitle="Identiteit, gedrag, systeem, budget en insights." backHref="/dashboard" />
      <MainTabNav active="settings" />
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="settings" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="settings" className="mascot-img" heroLarge />
        </div>
      </section>

      <SettingsTabNav active={settingsTab} />

      {settingsTab === "identity" && (
        <div className="space-y-4">
          <div className="card-simple p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Account</p>
            <p className="mt-1 break-all text-sm text-[var(--text-primary)]">{user.email}</p>
          </div>
          <UserCallsignCard
            embedded
            initialDisplayCallsign={prefs.display_callsign ?? null}
            initialHqHeadline={prefs.hq_headline ?? null}
            initialGreetingLocale={prefs.greeting_locale ?? "en"}
          />
        </div>
      )}

      {settingsTab === "behavior" && (
        <div className="space-y-4">
          <ProfileCategory title="Gedragsprofiel" subtitle="Identiteit, weekthema, avoidance" defaultOpen>
            <BehaviorProfileSettings initial={behaviorProfile} initialAutoMasterMissions={prefs.auto_master_missions} />
          </ProfileCategory>
          <ProfileCategory title="Motor &amp; verantwoording" subtitle="Study plan en accountability" defaultOpen={false}>
            <SettingsEngineProfile initialStudyPlan={studyPlan} initialAccountability={accountabilitySettings} />
          </ProfileCategory>
          <ProfileCategory title="Vrije dagen" subtitle="Welke dagen je meestal vrij neemt" defaultOpen={false}>
            <SettingsDaysOff initialDaysOff={prefs.usual_days_off ?? null} initialMode={prefs.day_off_mode ?? "soft"} />
          </ProfileCategory>
        </div>
      )}

      {settingsTab === "system" && (
        <div className="space-y-4">
          <ProfileSubCard title="Weergave &amp; modus" subtitle="Thema, dichtheid, beweging, lichte UI" defaultOpen>
            <ThemePicker />
            <SettingsCompactUi initialCompactUi={prefs.compact_ui} />
            <SettingsReducedMotion initialReducedMotion={prefs.reduced_motion} />
            <SettingsLightUI initialLightUi={prefs.light_ui} />
            <SettingsSimplifiedContent initialSimplifiedContent={prefs.simplified_content} />
            <XPBadge totalXp={xp.total_xp} level={xp.level} href={profileSettingsHref("system")} />
            <SettingsDcicModeExplain />
            <SettingsDCICModeTest />
            <SettingsClearCache />
            <SettingsRefreshSnapshot />
          </ProfileSubCard>

          <ProfileSubCard title="Tijd &amp; notificaties" subtitle="Tijdzone, push, e-mail" defaultOpen={false}>
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
          </ProfileSubCard>

          <ProfileSubCard title="Agenda" subtitle="Apple en Google" defaultOpen={false}>
            <SettingsAppleCalendar />
            <SettingsGoogleCalendar hasToken={hasGoogle} />
          </ProfileSubCard>

          <ProfileSubCard title="Apparaat &amp; privacy" subtitle="Export, uitleg, onboarding" defaultOpen={false}>
            <SettingsExport />
            <SettingsDeleteAccount />
            <SettingsHelpOnboarding />
            <SettingsWhereToConfigure />
            <SettingsAbout appVersion={appVersion} />
          </ProfileSubCard>
        </div>
      )}

      {settingsTab === "budget" && (
        <SettingsBudget
          initialCurrency={budgetSettings.currency}
          initialImpulseThresholdPct={budgetSettings.impulse_threshold_pct}
          initialBudgetPeriod={budgetSettings.budget_period}
          initialImpulseQuickAddMinutes={budgetSettings.impulse_quick_add_minutes}
          initialImpulseRiskCategories={budgetSettings.impulse_risk_categories}
        />
      )}

      {settingsTab === "insights" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Momentum, patronen, performance en weekrapport — zelfde engine als voorheen op Rapport.</p>
          <Suspense fallback={<ReportSnapshotFallback />}>
            <ReportInsightsContent searchParams={insightsSearchParams} embedInProfile />
          </Suspense>
        </div>
      )}
    </div>
  );
}
