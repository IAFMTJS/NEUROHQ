"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createPlatformEvent } from "@/app/actions/admin-platform-events";

export function AdminEventCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

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

        if (!title || !body) {
          setErr("Titel en tekst zijn verplicht.");
          return;
        }

        const starts_at = startsLocal ? new Date(startsLocal).toISOString() : new Date().toISOString();
        const ends_at = endsLocal ? new Date(endsLocal).toISOString() : null;

        startTransition(async () => {
          try {
            await createPlatformEvent({ title, body, starts_at, ends_at, active });
            form.reset();
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
          <label htmlFor="ev-title" className="mb-1 block text-xs font-medium text-white/50">
            Titel
          </label>
          <input
            id="ev-title"
            name="title"
            required
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Onderhoud zondagavond"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ev-body" className="mb-1 block text-xs font-medium text-white/50">
            Tekst (alle gebruikers)
          </label>
          <textarea
            id="ev-body"
            name="body"
            required
            rows={4}
            className="w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Van 22:00 tot 23:00 kan de app traag zijn."
          />
        </div>
        <div>
          <label htmlFor="ev-starts" className="mb-1 block text-xs font-medium text-white/50">
            Start (lokaal)
          </label>
          <input
            id="ev-starts"
            name="starts_at"
            type="datetime-local"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <p className="mt-1 text-[10px] text-white/35">Leeg = nu. Tijd volgt je computer (lokaal).</p>
        </div>
        <div>
          <label htmlFor="ev-ends" className="mb-1 block text-xs font-medium text-white/50">
            Einde (lokaal, optioneel)
          </label>
          <input
            id="ev-ends"
            name="ends_at"
            type="datetime-local"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <p className="mt-1 text-[10px] text-white/35">Leeg = geen eindtijd (tot je deactiveert).</p>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input id="ev-active" name="active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/30" />
          <label htmlFor="ev-active" className="text-sm text-white/70">
            Direct actief
          </label>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[#050810] hover:bg-amber-400 disabled:opacity-50"
      >
        {pending ? "Opslaan…" : "Event toevoegen"}
      </button>
    </form>
  );
}
