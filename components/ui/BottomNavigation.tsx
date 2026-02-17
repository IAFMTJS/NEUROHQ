"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHQ,
  IconMissions,
  IconGrowth,
  IconInsights,
  IconSettings,
  IconBudget,
  IconStrategy,
  IconAssistant,
} from "@/components/hq/NavIcons";

const navLinks = [
  { href: "/dashboard", label: "HQ", icon: IconHQ },
  { href: "/assistant", label: "Assistant", icon: IconAssistant },
  { href: "/tasks", label: "Missions", icon: IconMissions },
  { href: "/budget", label: "Budget", icon: IconBudget },
  { href: "/learning", label: "Growth", icon: IconGrowth },
  { href: "/strategy", label: "Strategy", icon: IconStrategy },
  { href: "/report", label: "Insight", icon: IconInsights },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav"
      aria-label="Main navigation"
    >
      {navLinks.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-item ${active ? "active" : ""}`}
          >
            <Icon active={active} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
