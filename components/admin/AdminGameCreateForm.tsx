"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createPlatformGame } from "@/app/actions/admin-platform-games";
import { AdminGamePresetBuilder } from "@/components/admin/AdminGamePresetBuilder";

export function AdminGameCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [configJson, setConfigJson] = useState("{}");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        const form = e.currentTarget;
        const fd = new FormData(form);
        const title = String(fd.get("title") ?? "").trim();
        const body = String(fd.get("body") ?? "").trim();
        const startsLocal = String(fd.get("starts_at") ?? "").trim();
        const endsLocal = String(fd.get("ends_at") ?? "").trim();
        const active = fd.get("active") === "on";
        const config_json = configJson.trim();

        if (!title || !body) {
          setErr("Titel en beschrijving zijn verplicht.");
          return;
        }

        const starts_at = startsLocal ? new Date(startsLocal).toISOString() : new Date().toISOString();
        const ends_at = endsLocal ? new Date(endsLocal).toISOString() : null;

        startTransition(async () => {
          try {
            await createPlatformGame({ title, body, starts_at, ends_at, active, config_json });
            form.reset();
            setConfigJson("{}");
            router.refresh();
          } catch (er) {
            setErr(er instanceof Error ? er.message : "Opslaan mislukt.");
          }
        });
      }}
    >
      {err ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100" role="alert">
          {err}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="pg-title" className="mb-1 block text-xs font-medium text-white/50">
            Titel
          </label>
          <input
            id="pg-title"
            name="title"
            required
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Week-challenge: 5 missies"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pg-body" className="mb-1 block text-xs font-medium text-white/50">
            Beschrijving / spelregels (alle gebruikers)
          </label>
          <textarea
            id="pg-body"
            name="body"
            required
            rows={4}
            className="w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Voltooi deze week vijf missies om deel te nemen aan de prijzenpot."
          />
        </div>
        <div className="sm:col-span-2 space-y-3">
          <AdminGamePresetBuilder configJson={configJson} setConfigJson={setConfigJson} />
          <div>
            <label htmlFor="pg-config" className="mb-1 block text-xs font-medium text-white/50">
              Config (JSON) — parameters + voortgang
            </label>
            <textarea
              id="pg-config"
              name="config_json"
              rows={8}
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              className="w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-white outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder='{"progress":{"mode":"auto","winLogic":"all","rules":[...]}}'
            />
            <p className="mt-1 text-[10px] text-white/35">
              <span className="text-amber-200/80">Handmatig:</span> <code className="text-white/50">progress.mode</code>{" "}
              <code className="text-white/50">&quot;checklist&quot;</code>, <code className="text-white/50">&quot;answer&quot;</code>{" "}
              of <code className="text-white/50">&quot;auto&quot;</code> (automatische meting; zie preset-builder). Optioneel{" "}
              <code className="text-white/50">rewardXp</code> / <code className="text-white/50">winMessage</code>.
            </p>
          </div>
        </div>
        <div>
          <label htmlFor="pg-starts" className="mb-1 block text-xs font-medium text-white/50">
            Start (lokaal)
          </label>
          <input
            id="pg-starts"
            name="starts_at"
            type="datetime-local"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <p className="mt-1 text-[10px] text-white/35">Leeg = nu.</p>
        </div>
        <div>
          <label htmlFor="pg-ends" className="mb-1 block text-xs font-medium text-white/50">
            Einde (lokaal, optioneel)
          </label>
          <input
            id="pg-ends"
            name="ends_at"
            type="datetime-local"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <p className="mt-1 text-[10px] text-white/35">Leeg = tot je deactiveert.</p>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input id="pg-active" name="active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/30" />
          <label htmlFor="pg-active" className="text-sm text-white/70">
            Direct actief
          </label>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[#050810] hover:bg-amber-400 disabled:opacity-50"
      >
        {pending ? "Opslaan…" : "Game toevoegen"}
      </button>
    </form>
  );
}
