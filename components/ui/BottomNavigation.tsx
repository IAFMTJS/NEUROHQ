"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import {
  IconHQ,
  IconAssistant,
  IconMissions,
  IconBudget,
  IconGrowth,
  IconStrategy,
  IconInsights,
  IconSettings,
} from "@/components/hq/NavIcons";

const navLinks = [
  { href: "/dashboard", label: "HQ", Icon: IconHQ },
  { href: "/assistant", label: "Assistant", Icon: IconAssistant },
  { href: "/tasks", label: "Missions", Icon: IconMissions },
  { href: "/budget", label: "Budget", Icon: IconBudget },
  { href: "/learning", label: "Growth", Icon: IconGrowth },
  { href: "/strategy", label: "Strategy", Icon: IconStrategy },
  { href: "/report", label: "Insight", Icon: IconInsights },
  { href: "/design", label: "Design", Icon: IconStrategy },
  { href: "/settings", label: "Settings", Icon: IconSettings },
] as const;

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
            prefetch={true}
          >
            <span className="nav-item-icon flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5">
              <Icon active={active} />
            </span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
});
