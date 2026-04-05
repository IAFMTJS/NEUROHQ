"use client";

import { Fragment, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deletePlatformGame,
  setPlatformGameActive,
  stopPlatformGameNow,
  updatePlatformGame,
} from "@/app/actions/admin-platform-games";
import type { Tables } from "@/types/database.types";

type GameRow = Tables<"platform_games">;

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatConfig(config: unknown): string {
  try {
    return JSON.stringify(config ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export function AdminGamesTable({ rows }: { rows: GameRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-white/45">
            <th className="px-3 py-2 font-medium">Titel</th>
            <th className="px-3 py-2 font-medium">Start</th>
            <th className="px-3 py-2 font-medium">Einde</th>
            <th className="px-3 py-2 font-medium">Actief</th>
            <th className="px-3 py-2 font-medium">Live nu</th>
            <th className="w-52 px-3 py-2 font-medium">Acties</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-white/45">
                Nog geen games. Voeg er een toe hierboven.
              </td>
            </tr>
          ) : (
            rows.map((g) => {
              const now = Date.now();
              const live =
                g.active &&
                new Date(g.starts_at).getTime() <= now &&
                (g.ends_at == null || new Date(g.ends_at).getTime() >= now);
              const editing = editingId === g.id;

              return (
                <Fragment key={g.id}>
                  <tr className="border-b border-white/[0.06] align-top">
                    <td className="px-3 py-2">
                      <div className="font-medium text-white">{g.title}</div>
                      <div className="mt-1 line-clamp-2 max-w-md text-xs text-white/50 whitespace-pre-wrap">{g.body}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-white/70">{formatNl(g.starts_at)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-white/70">{g.ends_at ? formatNl(g.ends_at) : "—"}</td>
                    <td className="px-3 py-2 text-xs">{g.active ? "ja" : "nee"}</td>
                    <td className="px-3 py-2 text-xs">
                      {live ? <span className="text-emerald-400">ja</span> : <span className="text-white/40">nee</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setEditingId(editing ? null : g.id)}
                          className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/85 hover:bg-white/10 disabled:opacity-50"
                        >
                          {editing ? "Sluiten" : "Bewerken"}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(() => {
                              void (async () => {
                                try {
                                  await setPlatformGameActive(g.id, !g.active);
                                  router.refresh();
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : "Actie mislukt.");
                                }
                              })();
                            })
                          }
                          className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/85 hover:bg-white/10 disabled:opacity-50"
                        >
                          {g.active ? "Deactiveren" : "Activeren"}
                        </button>
                        {g.active ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              if (
                                !confirm(
                                  "Game nu stoppen? Wordt gedeactiveerd; als het nog liep, wordt het eindmoment op nu gezet. Je kunt daarna weer activeren via Activeren."
                                )
                              )
                                return;
                              startTransition(() => {
                                void (async () => {
                                  try {
                                    await stopPlatformGameNow(g.id);
                                    router.refresh();
                                  } catch (e) {
                                    alert(e instanceof Error ? e.message : "Stoppen mislukt.");
                                  }
                                })();
                              });
                            }}
                            className="rounded-md border border-rose-500/45 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            Nu stoppen
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (!confirm("Deze game permanent verwijderen?")) return;
                            startTransition(() => {
                              void (async () => {
                                try {
                                  await deletePlatformGame(g.id);
                                  setEditingId((id) => (id === g.id ? null : id));
                                  router.refresh();
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : "Verwijderen mislukt.");
                                }
                              })();
                            });
                          }}
                          className="rounded-md border border-rose-500/40 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/15 disabled:opacity-50"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editing ? (
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <td colSpan={6} className="px-3 py-4">
                        <form
                          className="space-y-3"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const fd = new FormData(form);
                            const title = String(fd.get("title") ?? "").trim();
                            const body = String(fd.get("body") ?? "").trim();
                            const startsLocal = String(fd.get("starts_at") ?? "").trim();
                            const endsLocal = String(fd.get("ends_at") ?? "").trim();
                            const active = fd.get("active") === "on";
                            const config_json = String(fd.get("config_json") ?? "").trim();

                            if (!title || !body) {
                              alert("Titel en beschrijving zijn verplicht.");
                              return;
                            }

                            const starts_at = startsLocal
                              ? new Date(startsLocal).toISOString()
                              : new Date().toISOString();
                            const ends_at = endsLocal ? new Date(endsLocal).toISOString() : null;

                            startTransition(() => {
                              void (async () => {
                                try {
                                  await updatePlatformGame({
                                    id: g.id,
                                    title,
                                    body,
                                    starts_at,
                                    ends_at,
                                    active,
                                    config_json,
                                  });
                                  setEditingId(null);
                                  router.refresh();
                                } catch (er) {
                                  alert(er instanceof Error ? er.message : "Opslaan mislukt.");
                                }
                              })();
                            });
                          }}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">Game bewerken</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs text-white/50">Titel</label>
                              <input
                                name="title"
                                required
                                defaultValue={g.title}
                                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs text-white/50">Beschrijving</label>
                              <textarea
                                name="body"
                                required
                                rows={3}
                                defaultValue={g.body}
                                className="w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs text-white/50">Config (JSON) — o.a. progress / win</label>
                              <textarea
                                name="config_json"
                                rows={5}
                                defaultValue={formatConfig(g.config)}
                                className="w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-white outline-none focus:ring-2 focus:ring-amber-500/50"
                              />
                              <p className="mt-1 text-[10px] text-white/35">
                                Zie admin Games — uitleg bij nieuwe game: <code className="text-white/45">progress.mode</code> checklist of
                                answer + <code className="text-white/45">accepts</code> (alleen server).
                              </p>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">Start (lokaal)</label>
                              <input
                                name="starts_at"
                                type="datetime-local"
                                defaultValue={isoToDatetimeLocal(g.starts_at)}
                                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">Einde (lokaal)</label>
                              <input
                                name="ends_at"
                                type="datetime-local"
                                defaultValue={g.ends_at ? isoToDatetimeLocal(g.ends_at) : ""}
                                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
                              />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <input
                                id={`pg-active-${g.id}`}
                                name="active"
                                type="checkbox"
                                defaultChecked={g.active}
                                className="h-4 w-4 rounded border-white/30"
                              />
                              <label htmlFor={`pg-active-${g.id}`} className="text-sm text-white/70">
                                Actief
                              </label>
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={pending}
                            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[#050810] hover:bg-amber-400 disabled:opacity-50"
                          >
                            {pending ? "Opslaan…" : "Wijzigingen opslaan"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatNl(iso: string) {
  try {
    return new Date(iso).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}
