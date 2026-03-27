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
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = items.filter((a) => !a.read_at).length;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: AlertItem[] };
      setItems(data.items ?? []);
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
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const markRead = async (id: string) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, read_at: new Date().toISOString() } : a)));
  };

  return (
    <div ref={panelRef} className="fixed right-[4.25rem] top-3 z-[70]">
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
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Meldingen</p>
          {loading && items.length === 0 ? (
            <p className="px-2 py-4 text-xs text-[var(--text-muted)]">Laden…</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-4 text-xs text-[var(--text-muted)]">Geen meldingen.</p>
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
          <Link
            href="/settings"
            className="mt-1 block px-2 py-1.5 text-center text-[11px] font-medium text-[var(--accent-focus)] hover:underline"
            onClick={() => setOpen(false)}
          >
            Instellingen
          </Link>
        </div>
      ) : null}
    </div>
  );
}
