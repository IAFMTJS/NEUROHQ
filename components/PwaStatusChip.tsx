"use client";

import { useEffect, useMemo, useState } from "react";
import {
  NEUROHQ_DAILY_SNAPSHOT_UPDATED,
  type NeurohqDailySnapshotUpdatedDetail,
} from "@/lib/bootstrap-query";

const SNAPSHOT_KEY = "neurohq-daily-snapshot-v1";

function readSnapshotSavedAt(): number | null {
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ui?: { savedAt?: number | string } } | null;
    const v = parsed?.ui?.savedAt;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const ms = Date.parse(v);
      if (Number.isFinite(ms)) return ms;
    }
  } catch {
    // ignore
  }
  return null;
}

type Props = {
  /** Show chip when last snapshot save older than this. */
  staleAfterMinutes?: number;
};

export function PwaStatusChip({ staleAfterMinutes = 30 }: Props) {
  const [online, setOnline] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnline(navigator.onLine);
    setSavedAt(readSnapshotSavedAt());

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onSnapshot = () => setSavedAt(readSnapshotSavedAt());
    const onBootstrapSynced = (e: Event) => {
      const d = (e as CustomEvent<NeurohqDailySnapshotUpdatedDetail>).detail?.savedAt;
      if (typeof d === "number" && Number.isFinite(d)) {
        setSavedAt(d);
        return;
      }
      onSnapshot();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(NEUROHQ_DAILY_SNAPSHOT_UPDATED, onBootstrapSynced);

    const id = window.setInterval(() => setSavedAt(readSnapshotSavedAt()), 60_000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(NEUROHQ_DAILY_SNAPSHOT_UPDATED, onBootstrapSynced);
      window.clearInterval(id);
    };
  }, []);

  const ageMinutes = useMemo(() => {
    if (!savedAt) return null;
    return Math.max(0, Math.floor((Date.now() - savedAt) / 60_000));
  }, [savedAt]);

  const stale = ageMinutes != null && ageMinutes >= staleAfterMinutes;
  if (online && !stale) return null;

  const label = !online
    ? "Offline · cached"
    : ageMinutes != null
      ? `Last sync ${ageMinutes}m`
      : "Cached";

  return (
    <div className="pointer-events-none sticky top-2 z-[60] flex w-full justify-center sm:justify-end">
      <div
        className="pointer-events-auto rounded-full border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(6,18,30,0.55)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] shadow-[0_0_18px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
        role="status"
        aria-live="polite"
      >
        {label}
      </div>
    </div>
  );
}

