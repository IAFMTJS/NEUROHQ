"use client";

import { NativeCachedImg } from "@/components/NativeCachedImg";

/** Logos warmed on native (`getNativeVisualCriticalWarmPaths`); resolves to file:// when cached. */
export function AuthHeroBrand() {
  return (
    <div className="flex flex-col items-center gap-2">
      <NativeCachedImg
        src="/icon-192.png"
        alt=""
        width={96}
        height={96}
        className="h-24 w-24 rounded-2xl object-contain"
      />
      <NativeCachedImg
        src="/logo-naam.png"
        alt="NEUROHQ"
        width={220}
        height={58}
        className="h-14 w-auto max-w-[200px] object-contain"
      />
      <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Your daily HQ</p>
    </div>
  );
}
