"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
type AlertItem = {
  id: string;
  title: string;
  body: string | null;
  severity: string;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
};

export function AlertsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = items.filter((a) => !a.read_at).length;

  const refresh = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/alerts", { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        setFetchError(res.status === 401 ? "Log in om meldingen te zien." : "Meldingen laden mislukt.");
        setItems([]);
        return;
      }
      const data = (await res.json()) as { items?: AlertItem[] };
      setItems(data.items ?? []);
    } catch {
      setFetchError("Geen verbinding. Probeer opnieuw.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 120_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    const onSnap = () => void refresh();
    window.addEventListener("neurohq-daily-snapshot-updated", onSnap);
    return () => window.removeEventListener("neurohq-daily-snapshot-updated", onSnap);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const markRead = async (id: string) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      });
      if (!res.ok) return;
    } catch {
      return;
    }
    const now = new Date().toISOString();
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, read_at: now } : a)));
  };

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readAll: true }),
      });
      if (!res.ok) return;
    } catch {
      return;
    }
    const now = new Date().toISOString();
    setItems((prev) => prev.map((a) => ({ ...a, read_at: a.read_at ?? now })));
  };

  return (
    <div
      ref={panelRef}
      className="fixed right-[4.25rem] top-[calc(env(safe-area-inset-top,0px)+1.25rem)] z-[70]"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Meldingen${unread ? `, ${unread} ongelezen` : ""}`}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void refresh();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--bg-surface)]/85 text-lg shadow-sm backdrop-blur hover:bg-[var(--bg-hover)]"
      >
        🔔
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[1.1rem] justify-center rounded-full bg-[var(--semantic-accent)] px-1 text-[10px] font-bold leading-5 text-[var(--bg-primary)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-[min(calc(100vw-2rem),19rem)] rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/97 p-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Meldingen</p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-[10px] font-medium text-[var(--accent-focus)] hover:underline"
                onClick={() => void markAllRead()}
              >
                Alles gelezen
              </button>
            ) : null}
          </div>
          {fetchError ? (
            <div className="px-2 py-3">
              <p className="text-xs text-amber-200/95">{fetchError}</p>
              <button
                type="button"
                className="mt-2 text-[11px] font-medium text-[var(--accent-focus)] hover:underline"
                onClick={() => void refresh()}
              >
                Opnieuw proberen
              </button>
            </div>
          ) : loading && items.length === 0 ? (
            <p className="px-2 py-4 text-xs text-[var(--text-muted)]">Laden…</p>
          ) : items.length === 0 ? (
            <div className="space-y-2 px-2 py-3">
              <p className="text-xs text-[var(--text-muted)]">Geen meldingen in je inbox.</p>
              <p className="text-[11px] leading-snug text-[var(--text-secondary)]">
                Belangrijke tips (volgende actie, streak, overload) verschijnen hier zodra je dashboard ze heeft berekend —
                open het dashboard of ververs na je check-in.
              </p>
            </div>
          ) : (
            <ul className="max-h-[min(60vh,20rem)] overflow-y-auto">
              {items.map((a) => (
                <li key={a.id} className="border-b border-[var(--card-border)]/60 last:border-0">
                  {a.link_path ? (
                    <Link
                      href={a.link_path.startsWith("/") ? a.link_path : `/${a.link_path}`}
                      className="block px-2 py-2 text-left hover:bg-[var(--bg-hover)]/40"
                      onClick={() => void markRead(a.id)}
                    >
                      <p className={`text-xs font-semibold ${a.read_at ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
                        {a.title}
                      </p>
                      {a.body ? <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--text-secondary)]">{a.body}</p> : null}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="w-full px-2 py-2 text-left hover:bg-[var(--bg-hover)]/40"
                      onClick={() => void markRead(a.id)}
                    >
                      <p className={`text-xs font-semibold ${a.read_at ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
                        {a.title}
                      </p>
                      {a.body ? <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--text-secondary)]">{a.body}</p> : null}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-1 flex flex-col gap-0.5 border-t border-[var(--card-border)]/50 pt-2">
            <Link
              href="/settings#tijd-notificaties"
              className="block px-2 py-1 text-center text-[11px] font-medium text-[var(--accent-focus)] hover:underline"
              onClick={() => setOpen(false)}
            >
              Tijd &amp; notificaties
            </Link>
            <Link
              href="/settings"
              className="block px-2 py-0.5 text-center text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              onClick={() => setOpen(false)}
            >
              Alle instellingen
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
