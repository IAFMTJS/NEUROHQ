import type { XPFullContext } from "@/app/actions/xp-context";
import type { ProfileDailyChallengeContext } from "@/app/actions/profile-daily-challenges";

export type ProfileHomeBundle = {
  userId: string;
  dateStr: string;
  moodLabel: string | null;
  identity: XPFullContext["identity"];
  insightState: XPFullContext["insightState"];
  forecast: XPFullContext["forecast"];
  dailyChallengeContext: ProfileDailyChallengeContext;
};

