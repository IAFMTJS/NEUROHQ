"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600) % 24;
  const d = Math.floor(totalSec / 86400);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}u`);
  parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

type Props = {
  unlockAtIso: string;
  className?: string;
};

/** Live countdown until no-spend lock ends. */
export function BudgetLockCountdown({ unlockAtIso, className = "" }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const target = new Date(unlockAtIso).getTime();
  const ms = target - now;
  const title = `Unlock ${new Date(unlockAtIso).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })}`;

  if (ms <= 0) {
    return (
      <span className={className} title={title}>
        Lock verloopt…
      </span>
    );
  }

  return (
    <span className={`tabular-nums ${className}`} title={title}>
      Nog {formatRemaining(ms)}
    </span>
  );
}
