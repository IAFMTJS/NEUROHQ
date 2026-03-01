"use client";

import React from "react";
import styles from "./hud.module.css";
import { HudButton } from "./HudButton";

export type MissionCardProps = {
  title: string;
  xp: number;
  tags?: string[];
};

export function MissionCard({ title, xp, tags = [] }: MissionCardProps) {
  return (
    <article className={styles.missionCard}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-[var(--peak-white)]">{title}</p>
        <span className={styles.badge}>+{xp} XP</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className={styles.badge}>
            {tag}
          </span>
        ))}
      </div>
      <HudButton className="w-full">Deploy</HudButton>
    </article>
  );
}

