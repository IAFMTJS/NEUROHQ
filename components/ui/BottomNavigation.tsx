"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useRef } from "react";
import { BottomNavIcon } from "@/components/ui/BottomNavIcon";
import { BOTTOM_NAV_LINKS } from "@/lib/navigation/bottom-nav-links";

export default memo(function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());

  const prefetchOnIntent = useCallback((href: string) => {
    if (href === pathname) return;
    if (prefetchedRoutesRef.current.has(href)) return;
    prefetchedRoutesRef.current.add(href);
    router.prefetch(href);
  }, [pathname, router]);

  const links = BOTTOM_NAV_LINKS;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-plate" aria-hidden>
        <span className="bottom-nav-plate-glow" aria-hidden />
      </div>
      <div className="bottom-nav-items">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${link.href === "/dashboard" ? "nav-item-dashboard" : ""} ${active ? "active" : ""}`}
              prefetch={false}
              onMouseEnter={() => prefetchOnIntent(link.href)}
              onFocus={() => prefetchOnIntent(link.href)}
              onTouchStart={() => prefetchOnIntent(link.href)}
            >
              <span
                className={`nav-item-icon flex items-center justify-center ${
                  link.href === "/dashboard"
                    ? "[&_svg]:h-[34px] [&_svg]:w-[34px]"
                    : "[&_svg]:h-[18px] [&_svg]:w-[18px]"
                }`}
              >
                <BottomNavIcon link={link} active={active} />
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
