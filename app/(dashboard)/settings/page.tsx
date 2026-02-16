import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [hasGoogle, userTimezone, budgetSettings, xp, pushQuoteTime, pushQuietHours] = await Promise.all([
    hasGoogleCalendarToken(),
    getUserTimezone(),
    getBudgetSettings(),
    getXP(),
    getPushQuoteTime(),
    getPushQuietHours(),
  ]);
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Account, notifications, export, and integrations.</p>
      </div>
      <div className="card-modern overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Account</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
        </div>
      </div>
      <ThemePicker />
      <EmotionPicker />
      <XPBadge totalXp={xp.total_xp} level={xp.level} />
      <SettingsTimezone initialTimezone={userTimezone} />
      <SettingsBudget
        initialCurrency={budgetSettings.currency}
        initialImpulseThresholdPct={budgetSettings.impulse_threshold_pct}
        initialBudgetPeriod={budgetSettings.budget_period}
        initialImpulseQuickAddMinutes={budgetSettings.impulse_quick_add_minutes}
        initialImpulseRiskCategories={budgetSettings.impulse_risk_categories}
      />
      <SettingsPush initialPushQuoteTime={pushQuoteTime} initialQuietHours={pushQuietHours} />
      <SettingsExport />
      <SettingsDeleteAccount />
      <SettingsAppleCalendar />
      <SettingsGoogleCalendar hasToken={hasGoogle} />
      <SettingsAbout appVersion={appVersion} />
    </div>
  );
}
