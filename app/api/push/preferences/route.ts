import { NextResponse } from "next/server";
import { getPushSubscriptionEnabled } from "@/app/actions/auth";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";

export async function GET() {
  try {
    const [prefs, subscribed] = await Promise.all([
      getUserPreferencesOrDefaults(),
      getPushSubscriptionEnabled(),
    ]);

    return NextResponse.json({
      subscribed,
      pushRemindersEnabled: prefs.push_reminders_enabled ?? true,
      pushMorningEnabled: prefs.push_morning_enabled ?? true,
      pushEveningEnabled: prefs.push_evening_enabled ?? true,
      pushWeeklyLearningEnabled: prefs.push_weekly_learning_enabled ?? true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to load push preferences";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
