"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProtocolCatchupRound } from "@/app/actions/protocol-missions";
import { neuroToast } from "@/lib/ui/neuro-toast";

type Props = {
  protocolSlug: string | null;
  locale: string | null;
};

const OPTIONS = [2, 3, 4] as const;

export function GrowthCatchupRoundButton({ protocolSlug, locale }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [count, setCount] = useState<(typeof OPTIONS)[number]>(3);

  const canRun = !!protocolSlug;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            disabled={pending || !canRun}
            onClick={() => setCount(option)}
            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
              count === option
                ? "border border-cyan-300/35 bg-cyan-500/15 text-cyan-100"
                : "border border-white/10 bg-black/30 text-slate-300 hover:text-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={pending || !canRun}
        className="rounded-lg border border-cyan-300/35 bg-cyan-500/12 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() =>
          startTransition(async () => {
            if (!protocolSlug) {
              neuroToast.info("Geen actief protocol geselecteerd.");
              return;
            }
            try {
              const result = await createProtocolCatchupRound({
                protocol_slug: protocolSlug,
                locale: locale ?? "nl",
                max_tasks: count,
              });
              if (result.created > 0) {
                neuroToast.success(
                  `Catch-up ronde ${result.round}: ${result.created}/${count} extra protocoltaken toegevoegd${result.skipped ? ` (${result.skipped} overgeslagen)` : ""}.`
                );
              } else {
                neuroToast.info("Geen extra ronde nodig: huidige protocoltaken lijken al afgedekt.");
              }
              router.refresh();
            } catch (error) {
              neuroToast.error(error instanceof Error ? error.message : "Extra ronde toevoegen mislukt.");
            }
          })
        }
      >
        {pending ? "Bezig..." : `Voeg ${count} extra taken toe`}
      </button>
    </div>
  );
}
