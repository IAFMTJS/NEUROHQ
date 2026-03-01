"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  label?: string;
  className?: string;
};

/** Refreshes the current route so server components re-run (e.g. after setting brain status on dashboard). */
export function RefreshPageButton({ label = "Vernieuw pagina", className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className={className ?? "underline text-[var(--accent-focus)] hover:no-underline disabled:opacity-50"}
    >
      {pending ? "Vernieuwen…" : label}
    </button>
  );
}
