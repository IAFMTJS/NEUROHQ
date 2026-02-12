import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsExport } from "@/components/SettingsExport";
import { SettingsPush } from "@/components/SettingsPush";
import { SettingsDeleteAccount } from "@/components/SettingsDeleteAccount";
import { SettingsGoogleCalendar } from "@/components/SettingsGoogleCalendar";
import { SettingsTimezone } from "@/components/SettingsTimezone";
import { SettingsBudget } from "@/components/SettingsBudget";
import { hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getUserTimezone } from "@/app/actions/auth";
import { getBudgetSettings } from "@/app/actions/budget";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [hasGoogle, userTimezone, budgetSettings] = await Promise.all([
    hasGoogleCalendarToken(),
    getUserTimezone(),
    getBudgetSettings(),
  ]);
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neuro-silver">Settings</h1>
        <p className="mt-1 text-sm text-neuro-muted">Account, notifications, export, and integrations.</p>
      </div>
      <div className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">Account</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-neuro-muted">{user.email}</p>
        </div>
      </div>
      <SettingsTimezone initialTimezone={userTimezone} />
      <SettingsBudget
        initialCurrency={budgetSettings.currency}
        initialImpulseThresholdPct={budgetSettings.impulse_threshold_pct}
        initialBudgetPeriod={budgetSettings.budget_period}
        initialImpulseQuickAddMinutes={budgetSettings.impulse_quick_add_minutes}
        initialImpulseRiskCategories={budgetSettings.impulse_risk_categories}
      />
      <SettingsPush />
      <SettingsExport />
      <SettingsDeleteAccount />
      <SettingsGoogleCalendar hasToken={hasGoogle} />
      <div className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">About</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-neuro-muted">
            NEUROHQ — nervous-system-aware personal operating system. Version {appVersion}.
          </p>
        </div>
      </div>
    </div>
  );
}
