"use client";

import Link from "next/link";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function OfflinePage() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
        <GlassCard className="w-full max-w-[360px] p-8 text-center">
          <Image
            src="/app-icon.png"
            alt=""
            width={64}
            height={64}
            className="mx-auto h-16 w-16 rounded-xl object-contain opacity-90"
          />
          <h1 className="mt-5 text-lg font-semibold text-white">You&apos;re offline</h1>
          <p className="mt-3 text-sm text-white/70">
            NEUROHQ needs a connection to load. Check your network, then try again.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <PrimaryButton type="button" onClick={() => window.location.reload()} className="w-auto px-6 py-2.5">
              Try again
            </PrimaryButton>
            <Link href="/" className="inline-flex min-h-[48px] items-center justify-center rounded-[18px] border border-white/20 px-6 py-2.5 text-sm font-medium text-white">
              Go home
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
