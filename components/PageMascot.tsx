"use client";

import { usePathname } from "next/navigation";
import { pageFromPathname } from "@/lib/mascots";
import { HeroMascotImage } from "@/components/HeroMascotImage";

/** Renders the page mascot (by route) as hero element – no card, focal only. */
export function PageMascot() {
  const pathname = usePathname();
  if (pathname === "/dashboard" || !pathname?.startsWith("/")) return null;

  const page = pageFromPathname(pathname);
  return (
    <section className="mascot-hero mascot-hero-top" data-mascot-page={page} aria-hidden>
      <div className="mascot-hero-inner">
        <HeroMascotImage page={page} className="mascot-img" />
      </div>
    </section>
  );
}
