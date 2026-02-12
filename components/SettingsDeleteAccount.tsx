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
    <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-4">
      <h2 className="text-sm font-medium text-red-200">Delete account</h2>
      <p className="mt-2 text-sm text-neutral-400">
        Permanently delete your account and all data. This cannot be undone.
      </p>
      <input
        type="text"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={`Type ${CONFIRM_TEXT} to confirm`}
        className="mt-3 w-full max-w-xs rounded border border-neutral-600 bg-neuro-dark px-3 py-2 text-sm text-white placeholder-neutral-500"
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading || confirm !== CONFIRM_TEXT}
        className="mt-3 rounded bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50"
      >
        {loading ? "Deleting…" : "Delete my account"}
      </button>
    </div>
  );
}
