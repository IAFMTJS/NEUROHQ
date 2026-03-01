"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CONFIRM_TEXT = "DELETE_MY_ACCOUNT";

export function SettingsDeleteAccount() {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirm !== CONFIRM_TEXT) {
      setError("Type DELETE_MY_ACCOUNT to confirm.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: CONFIRM_TEXT }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to delete account.");
        setLoading(false);
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-red-900/40 bg-red-950/20">
      <div className="border-b border-red-900/30 px-4 py-3">
        <h2 className="text-base font-semibold text-red-200">Delete account</h2>
      </div>
      <div className="p-4">
        <p className="text-sm text-[var(--text-muted)]">
          Permanently delete your account and all data. This cannot be undone.
        </p>
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={`Type ${CONFIRM_TEXT} to confirm`}
          className="mt-3 w-full max-w-xs rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading || confirm !== CONFIRM_TEXT}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </div>
  );
}
