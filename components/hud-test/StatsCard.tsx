"use client";

import React from "react";
import styles from "./hud.module.css";
import { MiniRing } from "./StatRings";

export type StatsCardProps = {
  title: string;
  value: string;
  delta?: string;
  ringValue: number;
};

export function StatsCard({ title, value, delta = "", ringValue }: StatsCardProps) {
  return (
    <article className={styles.statsCard}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#9befff]">{title}</p>
          <p className={styles.statsCardValue}>{value}</p>
          {delta ? <p className={styles.metaLabel}>{delta}</p> : null}
        </div>
        <MiniRing value={ringValue} label="Load" />
      </div>
    </article>
  );
}

