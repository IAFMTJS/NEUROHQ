"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getActiveAcceptanceGate, resolveAcceptanceGate } from "@/app/actions/acceptance-gate";
import { toast } from "sonner";

function gateTitle(gateType: string): string {
  switch (gateType) {
    case "budget_compliance":
      return "Budget & compliance";
    case "task_defer_threshold":
      return "Taken & uitstel";
    default:
      return "Actie vereist";
  }
}

function gateBody(gateType: string, payload: Record<string, unknown>): string {
  const msg = typeof payload.message === "string" ? payload.message : null;
  if (msg) return msg;
  switch (gateType) {
    case "budget_compliance":
      return "Er is een drempel bereikt die we eerst met je willen afstemmen voordat je verder gaat met uitgeven of budgetacties.";
    case "task_defer_threshold":
      return "Een taak is vaak uitgesteld. Neem even kort de tijd om te reflecteren of de taak te herzien.";
    default:
      return "Er staat een korte reflectiestap open. Los dit op om verder te gaan.";
  }
}

/**
 * Full-screen layer when `user_acceptance_gates` has an unresolved row.
 * Crisis / help link is always available (plan: no therapeutic lock-in).
 */
export function AcceptanceGateLayer() {
  const router = useRouter();
  const [gate, setGate] = useState<{ id: string; gate_type: string; payload: Record<string, unknown> } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void getActiveAcceptanceGate().then((g) => {
      if (!cancelled) setGate(g);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!gate) return null;

  const body = gateBody(gate.gate_type, gate.payload);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 px-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="acceptance-gate-title"
    >
      <div className="max-h-[min(560px,88dvh)] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)] p-6 shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">Acceptatie / veiligheid</p>
        <h2 id="acceptance-gate-title" className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
          {gateTitle(gate.gate_type)}
        </h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">{body}</p>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Dit is geen straf: het helpt het systeem eerlijk te blijven. Als je in crisis zit of hulp nodig hebt, gebruik de noodlink
          hieronder — daar kun je altijd naartoe.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={pending}
            className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
            onClick={() =>
              startTransition(async () => {
                try {
                  await resolveAcceptanceGate(gate.id);
                  toast.success("Je bent weer verder. Blijf voorzichtig met je grenzen.");
                  setGate(null);
                  router.refresh();
                } catch {
                  toast.error("Kon niet opslaan. Probeer opnieuw.");
                }
              })
            }
          >
            {pending ? "Bezig…" : "Begrepen — ga verder"}
          </button>
          <Link
            href="/help"
            className="text-center text-sm font-medium text-red-300 underline-offset-2 hover:underline"
          >
            Nood / crisis — help en resources
          </Link>
          <a href="mailto:support@neurohq.app" className="text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
