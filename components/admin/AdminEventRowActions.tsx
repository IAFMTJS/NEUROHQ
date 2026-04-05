"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlatformEvent, setPlatformEventActive } from "@/app/actions/admin-platform-events";

export function AdminEventRowActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            void (async () => {
              try {
                await setPlatformEventActive(id, !active);
                router.refresh();
              } catch (e) {
                alert(e instanceof Error ? e.message : "Actie mislukt.");
              }
            })();
          })
        }
        className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/85 hover:bg-white/10 disabled:opacity-50"
      >
        {active ? "Deactiveren" : "Activeren"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Dit event permanent verwijderen?")) return;
          startTransition(() => {
            void (async () => {
              try {
                await deletePlatformEvent(id);
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
  );
}
