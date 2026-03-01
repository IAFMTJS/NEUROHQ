"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFreezeToken } from "@/app/actions/behavior";

type Props = {
  streakAtRisk: boolean;
  streakFreezeTokens: number;
  enabled: boolean;
};

/** When streak is at risk and user has freeze tokens, show CTA to use one (grace-day). */
export function StreakFreezeBanner({ streakAtRisk, streakFreezeTokens, enabled }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!enabled || !streakAtRisk || streakFreezeTokens <= 0) return null;

  function handleUseToken() {
    startTransition(async () => {
      const ok = await useFreezeToken();
      if (ok) router.refresh();
    });
  }

  return (
    <div className="dashboard-hud-alert mt-2 px-3 py-2 text-sm">
      <p className="font-medium">Streak in gevaar</p>
      <p className="mt-0.5 text-xs">
        Je hebt {streakFreezeTokens} freeze token{streakFreezeTokens !== 1 ? "s" : ""}. Gebruik er één om je streak vandaag te behouden zonder een missie te voltooien.
      </p>
      <button
        type="button"
        onClick={handleUseToken}
        disabled={pending}
        className="dashboard-hud-alert-btn mt-2 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
      >
        {pending ? "Bezig…" : "Gebruik freeze token"}
      </button>
    </div>
  );
}
