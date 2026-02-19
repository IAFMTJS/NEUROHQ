"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string | ReactNode;
  backHref?: string;
};

export function HQPageHeader({ title, subtitle, backHref }: Props) {
  const showBackLink = backHref != null && backHref !== "";
  return (
    <header>
      {showBackLink && (
        <Link
          href={backHref!}
          className="inline-block text-sm font-medium text-soft hover:text-[var(--text-main)]"
        >
          ← HQ
        </Link>
      )}
      <h1 className="page-title-glow">{title}</h1>
      {subtitle != null && (
        <p className="text-soft">
          {typeof subtitle === "string" ? subtitle : subtitle}
        </p>
      )}
    </header>
  );
}
