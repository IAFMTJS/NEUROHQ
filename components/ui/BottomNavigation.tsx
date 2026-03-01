"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useState } from "react";
import {
  IconHQ,
  IconAssistant,
  IconMissions,
  IconBudget,
  IconGrowth,
  IconXP,
  IconStrategy,
  IconInsights,
  IconSettings,
} from "@/components/hq/NavIcons";

/** PNG filename in public/nav/ (exact name, case-sensitive on server). No value = use SVG only. Includes XP. */
const navLinks = [
  { href: "/dashboard", label: "HQ", Icon: IconHQ, pngFile: "Dashboard.png" },
  { href: "/assistant", label: "Assistant", Icon: IconAssistant, pngFile: "Assistent.png" },
  { href: "/tasks", label: "Missions", Icon: IconMissions, pngFile: "Missions.png" },
  { href: "/budget", label: "Budget", Icon: IconBudget, pngFile: "Budget.png" },
  { href: "/learning", label: "Growth", Icon: IconGrowth, pngFile: "Growth.png" },
  { href: "/xp", label: "XP", Icon: IconXP, pngFile: "XP.png" },
  { href: "/strategy", label: "Strategy", Icon: IconStrategy, pngFile: "Strategy.png" },
  { href: "/report", label: "Insight", Icon: IconInsights, pngFile: "Insights.png" },
  { href: "/settings", label: "Settings", Icon: IconSettings, pngFile: "Settings.png" },
] as const;

/** Try PNG from public/nav/*.png first (for deployment). Falls back to SVG on 404. Add dashboard.png, missions.png, etc. to public/nav/ to use PNG icons. */
function NavIcon({ src, Icon, active }: { src: string; Icon: React.ComponentType<{ active?: boolean }>; active: boolean }) {
  const [useSvg, setUseSvg] = useState(false);
  if (useSvg) return <Icon active={active} />;
  return (
    <img
      src={src}
      alt=""
      width={24}
      height={24}
      className="object-contain w-6 h-6"
      onError={() => setUseSvg(true)}
    />
  );
}

export default memo(function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav"
      aria-label="Main navigation"
    >
      {navLinks.map((link) => {
        const active = pathname === link.href;
        const Icon = link.Icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-item ${active ? "active" : ""}`}
            prefetch={link.href !== "/report"}
          >
            <span className="nav-item-icon flex items-center justify-center [&_svg]:w-[18px] [&_svg]:h-[18px]">
              <NavIcon
                src={`/nav/${encodeURIComponent(link.pngFile)}`}
                Icon={Icon}
                active={active}
              />
            </span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
});
