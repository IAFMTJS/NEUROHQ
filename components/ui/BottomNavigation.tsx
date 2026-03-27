"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { memo, useCallback, useRef, useState } from "react";
import {
  IconHQ,
  IconMissions,
  IconBudget,
  IconGrowth,
  IconStrategy,
  IconUser,
  IconSettings,
} from "@/components/hq/NavIcons";

/**
 * PNG for each tab: default `/nav/<pngFile>` (see public/nav/README.md).
 * `iconSrc` overrides when the asset lives elsewhere (e.g. public/Icons/).
 */
const navLinks = [
  { href: "/tasks", label: "Missions", Icon: IconMissions, pngFile: "Missions.png" },
  { href: "/budget", label: "Budget", Icon: IconBudget, pngFile: "Budget.png" },
  { href: "/learning", label: "Growth", Icon: IconGrowth, pngFile: "Growth.png" },
  { href: "/dashboard", label: "Dashboard", Icon: IconHQ, pngFile: "Dashboard.png", large: true },
  { href: "/strategy", label: "Strategy", Icon: IconStrategy, pngFile: "Strategy.png" },
  { href: "/profile", label: "User", Icon: IconUser, pngFile: "User.png", iconSrc: "/Icons/User.PNG" },
  { href: "/settings", label: "Settings", Icon: IconSettings, pngFile: "Settings.png" },
] as const;

/** Try PNG from public/nav/*.png first (for deployment). Falls back to SVG on 404. Add dashboard.png, missions.png, etc. to public/nav/ to use PNG icons. */
function NavIcon({
  src,
  Icon,
  active,
  large,
}: {
  src: string;
  Icon: React.ComponentType<{ active?: boolean }>;
  active: boolean;
  large?: boolean;
}) {
  const [useSvg, setUseSvg] = useState(false);
  if (useSvg) return <Icon active={active} />;
  const px = large ? 32 : 22;
  return (
    <img
      src={src}
      alt=""
      width={px}
      height={px}
      className={`object-contain ${large ? "h-8 w-8" : "h-[22px] w-[22px]"}`}
      onError={() => setUseSvg(true)}
    />
  );
}

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

  const links = navLinks;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-plate" aria-hidden>
        <span className="bottom-nav-plate-glow" aria-hidden />
      </div>
      <div className="bottom-nav-items">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.Icon;
          const large = "large" in link && link.large === true;
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
                <NavIcon
                  src={"iconSrc" in link && link.iconSrc ? link.iconSrc : `/nav/${encodeURIComponent(link.pngFile)}`}
                  Icon={Icon}
                  active={active}
                  large={large}
                />
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
