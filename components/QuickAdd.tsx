"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useState } from "react";

/**
 * Quick-add: één veld om een taak of bericht in te voeren.
 * Enter → ga naar assistant met de tekst (pre-fill); user kan daar verzenden.
 */
export function QuickAdd() {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    setValue("");
    if (pathname === "/assistant") {
      inputRef.current?.blur();
      const event = new CustomEvent("quickadd-fill", { detail: { message: text } });
      window.dispatchEvent(event);
    } else {
      router.push(`/assistant?message=${encodeURIComponent(text)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="shrink-0 px-2 py-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Taak of bericht… (N = focus, A = assistant)"
        maxLength={500}
        aria-label="Taak of bericht naar assistant"
        data-quick-add-input
        className="w-full rounded-xl border border-[var(--accent-neutral)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]"
      />
    </form>
  );
}
