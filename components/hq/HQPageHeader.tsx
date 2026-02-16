"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HeroMascotImage, type HeroMascotVariant } from "@/components/HeroMascotImage";

type Props = {
  title: string;
  subtitle?: string | ReactNode;
  /** When set, shows "← HQ" back link (e.g. "/dashboard"). Omit to hide. */
  backHref?: string;
  /** Show mascot above title (compact variant). Default true */
  showMascot?: boolean;
  /** Page-specific mascot variant for section headers. */
  mascotVariant?: HeroMascotVariant;
};

export function HQPageHeader({ title, subtitle, backHref, showMascot = true, mascotVariant = "homepage" }: Props) {
  const showBackLink = backHref != null && backHref !== "";
  return (
    <header className="flex flex-col gap-0 relative overflow-visible">
      {showMascot && (
        <div className="hq-hero-mascot-wrap hq-hero-mascot-wrap--compact w-full" aria-hidden>
          <div className="hq-mascot-glow" />
          <div className="hq-mascot-img">
            <HeroMascotImage variant={mascotVariant} />
          </div>
        </div>
      )}
      <div className={`relative z-10 ${showMascot ? "-mt-56 md:-mt-64" : ""}`}>
        {showBackLink && (
          <Link
            href={backHref!}
            className="mb-2 inline-block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← HQ
          </Link>
        )}
        <h1 className="hq-h1 text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle != null && (
          <p className="hq-date mt-1 text-sm">
            {typeof subtitle === "string" ? subtitle : subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
