import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { HQPageHeader } from "@/components/hq";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getStudyPlan, getAccountabilitySettings } from "@/app/actions/behavior";
import { getBudgetSettings } from "@/app/actions/budget";
import { getXPFullContext } from "@/app/actions/xp-context";
import { UserCallsignCard } from "@/components/settings/UserCallsignCard";
import { ProfileCategory, ProfileSubCard } from "@/components/profile/ProfileSection";
import { ProfileIdentitySummary } from "@/components/profile/ProfileIdentitySummary";
import { ProfileQuickNav } from "@/components/profile/ProfileQuickNav";

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

  const [prefs, behaviorProfile, studyPlan, accountabilitySettings, budgetSettings, xpCtx] = await Promise.all([
    getUserPreferencesOrDefaults(),
    getBehaviorProfile(),
    getStudyPlan(),
    getAccountabilitySettings(),
    getBudgetSettings(),
    getXPFullContext(),
  ]);

  const { identity, insightState } = xpCtx;

  return (
    <div className="container page page-wide space-y-5">
      <HQPageHeader
        title="Profiel"
        subtitle="Jouw bridge: voortgang, coaching, persona — technische opties blijven onder Instellingen."
        backHref="/dashboard"
      />

      <ProfileIdentitySummary identity={identity} insightState={insightState} behaviorProfile={behaviorProfile} />

      <ProfileQuickNav />

      <div className="rounded-xl border border-[var(--card-border)]/70 bg-[var(--bg-surface)]/10 px-3 py-2.5 text-xs text-[var(--text-secondary)]">
        <p className="font-medium text-[var(--text-primary)]">Engine &amp; opslag</p>
        <p className="mt-1">
          Missies, XP-hints en push-toon gebruiken o.a. je behavior profile, user_preferences (incl. HQ-persona) en
          budgetvelden op users — alles per user_id in Supabase. Kaarten met een opslaan-knop schrijven naar de server; het
          dashboard spiegelt persona daarna via bootstrap en{" "}
          <code className="rounded bg-[var(--bg-primary)] px-1 py-0.5 text-[10px]">/api/settings</code> naar dit apparaat.
        </p>
      </div>

      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="settings" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="settings" className="mascot-img" heroLarge />
        </div>
      </section>

      <ProfileCategory title="Account" subtitle="Je account en snelkoppeling naar volledige settings" defaultOpen>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">E-mail</p>
        <p className="break-all text-sm text-[var(--text-primary)]">{user.email}</p>
        <div className="pt-1">
          <Link href="/settings" className="btn-secondary inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium">
            Alle instellingen
          </Link>
        </div>
      </ProfileCategory>

      <ProfileCategory title="Personalisatie" subtitle="HQ-koptekst, aanspreeknaam en begroeting (zoals op het dashboard)" defaultOpen>
        <UserCallsignCard
          embedded
          initialDisplayCallsign={prefs.display_callsign ?? null}
          initialHqHeadline={prefs.hq_headline ?? null}
          initialGreetingLocale={prefs.greeting_locale ?? "en"}
        />
      </ProfileCategory>

      <ProfileCategory title="Weergave" subtitle="Thema en interface">
        <ProfileSubCard title="Thema &amp; dichtheid" subtitle="Kleuren, compacte UI, beweging, lichte modus" defaultOpen>
          <ThemePicker />
          <SettingsCompactUi initialCompactUi={prefs.compact_ui} />
          <SettingsReducedMotion initialReducedMotion={prefs.reduced_motion} />
          <SettingsLightUI initialLightUi={prefs.light_ui} />
        </ProfileSubCard>
      </ProfileCategory>

      <ProfileCategory title="Gedrag &amp; planning" subtitle="Profiel, studieplannen, vrije dagen">
        <ProfileSubCard title="Behavior profile" subtitle="Identiteit, weekthema, avoidance" defaultOpen>
          <BehaviorProfileSettings initial={behaviorProfile} initialAutoMasterMissions={prefs.auto_master_missions} />
        </ProfileSubCard>
        <ProfileSubCard title="Motor &amp; verantwoording" subtitle="Study plan en accountability">
          <SettingsEngineProfile initialStudyPlan={studyPlan} initialAccountability={accountabilitySettings} />
        </ProfileSubCard>
        <ProfileSubCard title="Vrije dagen" subtitle="Welke dagen je meestal vrij neemt">
          <SettingsDaysOff initialDaysOff={prefs.usual_days_off ?? null} initialMode={prefs.day_off_mode ?? "soft"} />
        </ProfileSubCard>
      </ProfileCategory>

      <ProfileCategory title="Budget" subtitle="Valuta, drempels en snelle acties">
        <SettingsBudget
          initialCurrency={budgetSettings.currency}
          initialImpulseThresholdPct={budgetSettings.impulse_threshold_pct}
          initialBudgetPeriod={budgetSettings.budget_period}
          initialImpulseQuickAddMinutes={budgetSettings.impulse_quick_add_minutes}
          initialImpulseRiskCategories={budgetSettings.impulse_risk_categories}
        />
      </ProfileCategory>
    </div>
  );
}
