"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminSignOutButton() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/admin/login";
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={busy}
      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 disabled:opacity-50"
    >
      {busy ? "…" : "Uitloggen"}
    </button>
  );
}
