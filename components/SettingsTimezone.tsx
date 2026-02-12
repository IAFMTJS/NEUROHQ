"use client";

import { useState, useTransition } from "react";
import { updateUserTimezone } from "@/app/actions/auth";

const TIMEZONE = "Europe/Brussels";

type Props = { initialTimezone: string | null };

export function SettingsTimezone({ initialTimezone }: Props) {
  const [tz, setTz] = useState(initialTimezone ?? TIMEZONE);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(value: string) {
    setTz(value);
    setSaved(false);
    startTransition(async () => {
      await updateUserTimezone(value);
      setSaved(true);
    });
  }

  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Timezone</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">Used for &quot;today&quot; and daily rollover.</p>
      </div>
      <div className="p-4">
        <label htmlFor="timezone" className="block text-sm font-medium text-neuro-silver mb-2">
          Your timezone
        </label>
        <select
          id="timezone"
          value={tz}
          onChange={(e) => handleChange(e.target.value)}
          disabled={pending}
          className="w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-neuro-silver focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30 disabled:opacity-50"
        >
          <option value={TIMEZONE}>{TIMEZONE}</option>
        </select>
        {saved && <p className="mt-2 text-xs text-green-500/80">Saved.</p>}
      </div>
    </div>
  );
}
