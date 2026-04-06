"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NEUROHQ_ALERTS_UPDATED, NEUROHQ_DAILY_SNAPSHOT_UPDATED } from "@/lib/bootstrap-query";
import { dashboardCommandDeckOuterClass } from "@/components/layout/DashboardCommandDeckFrame";
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

function formatAlertTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "Zojuist";
  const min = Math.floor(sec / 60);
  if (min < 60) return min <= 1 ? "1 min" : `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr <= 1 ? "1 u" : `${hr} u`;
  const d = Math.floor(hr / 24);
  if (d === 1) return "Gisteren";
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function alertRowBorder(severity: string, unread: boolean) {
  if (!unread) return "border-[rgba(var(--mode-rgb),0.1)]";
  if (severity === "urgent") return "border-[rgba(248,113,113,0.38)] shadow-[0_0_18px_rgba(248,113,113,0.1)]";
  if (severity === "warning") {
    return "border-[rgba(var(--hud-amber-500-rgb),0.42)] shadow-[0_0_20px_rgba(var(--hud-amber-500-rgb),0.08)]";
  }
  return "border-[rgba(var(--mode-rgb),0.14)]";
}

function alertLedClass(severity: string, unread: boolean) {
  if (!unread) return "bg-[var(--text-muted)]/35";
  if (severity === "urgent") return "bg-rose-400 shadow-[0_0_10px_rgba(248,113,113,0.55)]";
  if (severity === "warning") {
    return "bg-[var(--hud-amber-500)] shadow-[0_0_10px_rgba(var(--hud-amber-500-rgb),0.55)]";
  }
  return "bg-[var(--semantic-accent)]/85 shadow-[0_0_8px_rgba(var(--mode-rgb),0.4)]";
}

export function AlertsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [authWall, setAuthWall] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = items.filter((a) => !a.read_at).length;

  const refresh = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/alerts", { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          setAuthWall(true);
          setItems([]);
          setFetchError(null);
          return;
        }
        setAuthWall(false);
        setFetchError("Meldingen laden mislukt.");
        setItems([]);
        return;
      }
      setAuthWall(false);
      const data = (await res.json()) as { items?: AlertItem[] };
      setItems(data.items ?? []);
    } catch {
      setAuthWall(false);
      setFetchError("Geen verbinding. Probeer opnieuw.");
      setItems([]);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 120_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    const onSnap = () => void refresh();
    window.addEventListener(NEUROHQ_DAILY_SNAPSHOT_UPDATED, onSnap);
    window.addEventListener(NEUROHQ_ALERTS_UPDATED, onSnap);
    return () => {
      window.removeEventListener(NEUROHQ_DAILY_SNAPSHOT_UPDATED, onSnap);
      window.removeEventListener(NEUROHQ_ALERTS_UPDATED, onSnap);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  const removeAlert = async (id: string) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) return;
    } catch {
      return;
    }
    setItems((prev) => prev.filter((a) => a.id !== id));
  };

  const removeAll = async () => {
    if (!window.confirm("Alle meldingen verwijderen? Dit kun je niet ongedaan maken.")) return;
    try {
      const res = await fetch("/api/alerts", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });
      if (!res.ok) return;
    } catch {
      return;
    }
    setItems([]);
  };

  if (!ready || authWall) {
    return null;
  }

  const triggerUnread = unread > 0;

  return (
    <div
      ref={panelRef}
      className="fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[calc(env(safe-area-inset-top,0px)+1rem)] z-[85]"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={triggerUnread ? `Signalen, ${unread} ongelezen` : "Signalen, inbox"}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void refresh();
        }}
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl border bg-[color-mix(in_srgb,var(--mode-bg-surface)_78%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--semantic-accent),0.55)] ${
          triggerUnread
            ? "border-[rgba(var(--hud-amber-500-rgb),0.45)] text-[var(--text-primary)] [box-shadow:0_0_22px_rgba(var(--hud-amber-500-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)]"
            : "border-[var(--border-soft)] text-[var(--text-muted)] hover:border-[rgba(var(--mode-rgb),0.22)] hover:text-[var(--text-primary)]"
        }`}
      >
        <span
          className={`absolute left-0 top-1 bottom-1 w-0.5 rounded-full ${triggerUnread ? "bg-[var(--hud-amber-500)] opacity-90" : "bg-[rgba(var(--semantic-accent),0.35)] opacity-60"}`}
          aria-hidden
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative z-[1] translate-x-[1px]"
          aria-hidden
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {triggerUnread ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[1.15rem] justify-center rounded-md bg-[var(--semantic-accent)] px-1 py-0.5 text-[9px] font-bold leading-none text-[var(--bg-primary)] shadow-[0_0_12px_rgba(var(--mode-rgb),0.35)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 mt-2 w-[min(calc(100vw-1.5rem),22rem)] origin-top-right animate-hq-fade-up"
          role="dialog"
          aria-label="Meldingen"
        >
          <div className={`${dashboardCommandDeckOuterClass} text-left shadow-2xl`}>
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(var(--mode-rgb),0.14),transparent_58%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(var(--mode-rgb),0.09),transparent_55%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(var(--hud-amber-500-rgb),0.06),transparent_50%)]"
              aria-hidden
            />

            <div className="relative z-[1] flex max-h-[min(72vh,26rem)] flex-col gap-0 p-3 md:p-4">
              <header className="shrink-0 border-b border-[var(--border-soft)] pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 border-l-2 border-[rgba(var(--semantic-accent),0.55)] pl-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Signalen</p>
                    <h2 className="mt-0.5 text-sm font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_12px_rgba(var(--mode-rgb),0.15)] md:text-base">
                      Meldingen
                    </h2>
                  </div>
                  <div className="dashboard-top-strip max-w-full !mt-0">
                    <div className="dashboard-top-strip-track !py-0" role="toolbar" aria-label="Inbox-acties">
                      {unread > 0 ? (
                        <button
                          type="button"
                          className="dashboard-mini-btn dashboard-mini-btn-primary"
                          onClick={() => void markAllRead()}
                        >
                          Alles gelezen
                        </button>
                      ) : null}
                      {items.length > 0 ? (
                        <button
                          type="button"
                          className={`dashboard-mini-btn ${unread > 0 ? "dashboard-mini-btn-secondary" : "dashboard-mini-btn-primary"}`}
                          onClick={() => void removeAll()}
                        >
                          Alles wissen
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto py-3">
                {fetchError ? (
                  <div className="rounded-xl border border-[rgba(var(--hud-amber-500-rgb),0.25)] bg-[rgba(var(--hud-amber-500-rgb),0.06)] px-3 py-3">
                    <p className="text-xs text-[var(--text-primary)]">{fetchError}</p>
                    <button
                      type="button"
                      className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--semantic-accent)] hover:underline"
                      onClick={() => void refresh()}
                    >
                      Opnieuw proberen
                    </button>
                  </div>
                ) : loading && items.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-[var(--text-muted)]">Laden…</p>
                ) : items.length === 0 ? (
                  <div className="space-y-2 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.28)] px-3 py-4">
                    <p className="text-xs font-medium text-[var(--text-primary)]">Inbox is leeg</p>
                    <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                      Volgende acties, streak en overload verschijnen hier zodra het dashboard ze berekent. Open HQ of ververs na je check-in.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {items.map((a) => {
                      const isUnread = !a.read_at;
                      const rowClass = `flex w-full gap-2.5 rounded-xl border bg-[rgba(6,18,30,0.38)] p-2.5 text-left transition md:gap-3 md:p-3 ${alertRowBorder(a.severity, isUnread)} hover:bg-[rgba(var(--mode-rgb-deep),0.08)]`;
                      const inner = (
                        <>
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${alertLedClass(a.severity, isUnread)}`}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`text-xs font-semibold leading-snug md:text-[13px] ${isUnread ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
                              >
                                {a.title}
                              </p>
                              {isUnread ? (
                                <span className="rounded bg-[var(--semantic-accent)]/18 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[var(--semantic-accent)]">
                                  Nieuw
                                </span>
                              ) : null}
                            </div>
                            {a.body ? (
                              <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">{a.body}</p>
                            ) : null}
                            <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                              {formatAlertTime(a.created_at)}
                            </p>
                          </div>
                          <span className="shrink-0 self-center text-[var(--text-muted)]" aria-hidden>
                            ›
                          </span>
                        </>
                      );
                      return (
                        <li key={a.id} className="flex gap-1">
                          <div className="min-w-0 flex-1">
                            {a.link_path ? (
                              <Link
                                href={a.link_path.startsWith("/") ? a.link_path : `/${a.link_path}`}
                                className={rowClass}
                                onClick={() => void markRead(a.id)}
                              >
                                {inner}
                              </Link>
                            ) : (
                              <button type="button" className={rowClass} onClick={() => void markRead(a.id)}>
                                {inner}
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className="flex h-full min-h-[3rem] w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.35)] text-[var(--text-muted)] transition hover:border-[rgba(var(--mode-rgb),0.2)] hover:bg-[rgba(var(--mode-rgb-deep),0.12)] hover:text-[var(--text-primary)]"
                            aria-label="Melding verwijderen"
                            title="Verwijderen"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void removeAlert(a.id);
                            }}
                          >
                            <span className="text-lg leading-none" aria-hidden>
                              ×
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <footer className="shrink-0 border-t border-[var(--border-soft)] pt-3">
                <Link
                  href="/settings#tijd-notificaties"
                  className="block rounded-lg px-2 py-2 text-center text-[11px] font-semibold text-[var(--semantic-accent)] hover:bg-[rgba(var(--mode-rgb),0.06)]"
                  onClick={() => setOpen(false)}
                >
                  Tijd &amp; notificaties
                </Link>
                <Link
                  href="/settings"
                  className="block px-2 py-1 text-center text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  onClick={() => setOpen(false)}
                >
                  Alle instellingen
                </Link>
              </footer>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
