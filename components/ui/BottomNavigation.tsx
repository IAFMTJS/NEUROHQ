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
      className="bottom-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 flex items-center justify-around safe-area-pb"
      aria-label="Main navigation"
    >
      <ul className="flex w-full h-full items-center justify-around px-2">
        {navLinks.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <li key={link.href} className="flex-1 min-w-0 flex justify-center">
              <Link
                href={link.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[44px] min-w-[44px] ${
                  active ? "nav-item-active text-[#00E5FF]" : ""
                }`}
              >
                <span className="nav-item-inner flex flex-col items-center justify-center gap-0.5 rounded-xl">
                  <span className="nav-icon-wrap inline-flex items-center justify-center w-9 h-9 rounded-xl">
                    <Icon active={active} />
                  </span>
                  <span className="text-[11px] font-medium">{link.label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
