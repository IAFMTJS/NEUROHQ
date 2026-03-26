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

const ThemePicker = nextDynamic(() => import("@/components/settings/ThemePicker").then((m) => ({ default: m.ThemePicker })), { loading: () => null });
const SettingsCompactUi = nextDynamic(() => import("@/components/settings/SettingsCompactUi").then((m) => ({ default: m.SettingsCompactUi })), { loading: () => null });
const SettingsReducedMotion = nextDynamic(() => import("@/components/settings/SettingsReducedMotion").then((m) => ({ default: m.SettingsReducedMotion })), { loading: () => null });
const SettingsLightUI = nextDynamic(() => import("@/components/settings/SettingsLightUI").then((m) => ({ default: m.SettingsLightUI })), { loading: () => null });
const BehaviorProfileSettings = nextDynamic(() => import("@/components/settings/BehaviorProfileSettings").then((m) => ({ default: m.BehaviorProfileSettings })), { loading: () => null });
const SettingsEngineProfile = nextDynamic(() => import("@/components/settings/SettingsEngineProfile").then((m) => ({ default: m.SettingsEngineProfile })), { loading: () => null });
const SettingsDaysOff = nextDynamic(() => import("@/components/settings/SettingsDaysOff").then((m) => ({ default: m.SettingsDaysOff })), { loading: () => null });
const SettingsBudget = nextDynamic(() => import("@/components/SettingsBudget").then((m) => ({ default: m.SettingsBudget })), { loading: () => null });

export const dynamic = "force-dynamic";

function momentumNl(band: "low" | "medium" | "high"): string {
  if (band === "high") return "hoog";
  if (band === "medium") return "gemiddeld";
  return "laag";
}

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
  const xp7 = insightState?.xpLast7 ?? 0;
  const xpPrev7 = insightState?.xpPrevious7 ?? 0;

  return (
    <div className="container page page-wide space-y-5">
      <HQPageHeader title="Profiel" subtitle="Account, inzichten en personalisatie — compact gegroepeerd." backHref="/dashboard" />
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

      <ProfileCategory title="Inzichten" subtitle="Korte voortgang — details staan op Rapport en XP" defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Niveau</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
              {identity.level}{" "}
              <span className="text-sm font-normal text-[var(--text-secondary)]">· {identity.rank}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{identity.xp_to_next_level} XP tot volgende level</p>
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Streak</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{identity.streak.current} dagen</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Langste: {identity.streak.longest}</p>
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/20 px-3 py-2.5 sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Laatste 7 dagen</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-[var(--text-primary)]">
              <span>
                <span className="tabular-nums font-semibold">{xp7}</span> XP
              </span>
              <span className="text-[var(--text-muted)]">
                vs. week ervoor: <span className="tabular-nums text-[var(--text-secondary)]">{xpPrev7}</span>
              </span>
              {insightState && (
                <span className="text-[var(--text-muted)]">
                  Momentum: <span className="text-[var(--text-secondary)]">{momentumNl(insightState.momentum.band)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/report" className="btn-secondary inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium">
            Rapport
          </Link>
          <Link
            href="/xp"
            className="inline-flex items-center rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]/40 hover:text-[var(--text-primary)]"
          >
            XP &amp; voorspelling
          </Link>
        </div>
      </ProfileCategory>

      <ProfileCategory title="Personalisatie" subtitle="Hoe we je aanspreken" defaultOpen>
        <UserCallsignCard embedded />
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
