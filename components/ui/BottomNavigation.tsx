"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useRef } from "react";
import { BottomNavIcon } from "@/components/ui/BottomNavIcon";
import {
  BOTTOM_NAV_HUB,
  BOTTOM_NAV_LEFT,
  BOTTOM_NAV_RIGHT,
  type BottomNavLink,
} from "@/lib/navigation/bottom-nav-links";

export default memo(function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());

  const prefetchOnIntent = useCallback(
    (href: string) => {
      if (href === pathname) return;
      if (prefetchedRoutesRef.current.has(href)) return;
      prefetchedRoutesRef.current.add(href);
      router.prefetch(href);
    },
    [pathname, router]
  );

  const hubLink = BOTTOM_NAV_HUB;

  function RailLink({ link }: { link: BottomNavLink }) {
    const active = pathname === link.href;
    return (
      <Link
        href={link.href}
        className={`nav-item nav-item-fab-rail ${active ? "active" : ""}`}
        prefetch={false}
        onMouseEnter={() => prefetchOnIntent(link.href)}
        onFocus={() => prefetchOnIntent(link.href)}
        onTouchStart={() => prefetchOnIntent(link.href)}
      >
        <span className="nav-item-icon flex items-center justify-center [&_svg]:h-[18px] [&_svg]:w-[18px]">
          <BottomNavIcon link={link} active={active} />
        </span>
        <span>{link.label}</span>
      </Link>
    );
  }

  const hubActive = pathname === hubLink.href;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-fab-stack">
        <div className="bottom-nav-fab-bar">
          <div className="bottom-nav-fab-glowline" aria-hidden />
          <div className="bottom-nav-fab-row">
            <div className="bottom-nav-fab-cluster bottom-nav-fab-cluster--left">
              {BOTTOM_NAV_LEFT.map((link) => (
                <RailLink key={link.href} link={link} />
              ))}
            </div>

            <div className="bottom-nav-fab-hub-slot">
              <Link
                href={hubLink.href}
                className={`nav-item-fab-hub ${hubActive ? "active" : ""}`}
                prefetch={false}
                aria-current={hubActive ? "page" : undefined}
                onMouseEnter={() => prefetchOnIntent(hubLink.href)}
                onFocus={() => prefetchOnIntent(hubLink.href)}
                onTouchStart={() => prefetchOnIntent(hubLink.href)}
              >
                <span className="nav-item-fab-hub-icon flex items-center justify-center [&_svg]:h-[30px] [&_svg]:w-[30px]">
                  <BottomNavIcon link={hubLink} active={hubActive} />
                </span>
                <span className="nav-item-fab-hub-label">{hubLink.label}</span>
              </Link>
            </div>

            <div className="bottom-nav-fab-cluster bottom-nav-fab-cluster--right">
              {BOTTOM_NAV_RIGHT.map((link) => (
                <RailLink key={link.href} link={link} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
});
