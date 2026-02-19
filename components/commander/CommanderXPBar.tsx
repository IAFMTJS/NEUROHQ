"use client";

import { xpRangeForNextLevel, levelFromTotalXP } from "@/lib/xp";

type Props = {
  totalXP: number;
};

export function CommanderXPBar({ totalXP }: Props) {
  const level = levelFromTotalXP(totalXP);
  const { current, needed } = xpRangeForNextLevel(totalXP);
  const pct = needed <= 0 ? 100 : Math.min(100, Math.round((current / needed) * 100));

  return (
    <section className="glass-card glass-card-glow-cyan">
      <h3>Level {level}</h3>
      <div className="progress">
        <div
          className="progress-fill"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={needed}
          aria-label={`Level ${level} progress: ${current} of ${needed} XP`}
        />
      </div>
      <p className="text-soft">
        {current} / {needed} XP
      </p>
    </section>
  );
}
