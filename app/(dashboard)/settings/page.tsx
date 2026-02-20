import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMascotSrcForPage } from "@/lib/mascots";
import { HQPageHeader } from "@/components/hq";
import { SettingsExport } from "@/components/SettingsExport";
import { SettingsPush } from "@/components/SettingsPush";
import { SettingsDeleteAccount } from "@/components/SettingsDeleteAccount";
import { SettingsAppleCalendar } from "@/components/SettingsAppleCalendar";
import { SettingsGoogleCalendar } from "@/components/SettingsGoogleCalendar";
import { SettingsTimezone } from "@/components/SettingsTimezone";
import { SettingsBudget } from "@/components/SettingsBudget";
import { SettingsAbout } from "@/components/SettingsAbout";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { EmotionPicker } from "@/components/settings/EmotionPicker";
import { XPBadge } from "@/components/XPBadge";
import { hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getUserTimezone, getPushQuoteTime, getPushQuietHours } from "@/app/actions/auth";
import { getBudgetSettings } from "@/app/actions/budget";
import { getXP } from "@/app/actions/xp";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { SettingsCompactUi } from "@/components/settings/SettingsCompactUi";
import { SettingsQuickLinks } from "@/components/settings/SettingsQuickLinks";
import { SettingsWhereToConfigure } from "@/components/settings/SettingsWhereToConfigure";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [hasGoogle, userTimezone, budgetSettings, xp, pushQuoteTime, pushQuietHours, prefs] = await Promise.all([
    hasGoogleCalendarToken(),
    getUserTimezone(),
    getBudgetSettings(),
    getXP(),
    getPushQuoteTime(),
    getPushQuietHours(),
    getUserPreferencesOrDefaults(),
  ]);
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

  return (
    <div className="container page space-y-6">
      <HQPageHeader
        title="Settings"
        subtitle="Account, weergave, notificaties, budget, agenda, export en privacy."
        backHref="/dashboard"
      />
      <section className="mascot-hero mascot-hero-top" data-mascot-page="settings" aria-hidden>
        <img src={getMascotSrcForPage("settings")} alt="" className="mascot-img" />
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
          <EmotionPicker />
          <XPBadge totalXp={xp.total_xp} level={xp.level} />
        </div>
      </section>

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
