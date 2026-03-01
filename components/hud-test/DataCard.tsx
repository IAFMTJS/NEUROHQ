"use client";

import React from "react";
import styles from "./hud.module.css";
import { Divider1px } from "./Divider1px";

export type DataCardProps = {
  title: string;
  value: string;
  progress?: number;
  meta?: string;
};

export function DataCard({ title, value, progress = 0, meta }: DataCardProps) {
  const width = Math.max(0, Math.min(100, progress));
  return (
    <article className={styles.dataCard}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#9befff]">{title}</p>
      {meta ? <p className={styles.metaLabel}>{meta}</p> : null}
      <Divider1px />
      <p className={styles.dataCardValue}>{value}</p>
      <div className={`${styles.progressBarTrack} mt-3`}>
        <div className={styles.progressBarFill} style={{ width: `${width}%` }} />
      </div>
    </article>
  );
}

