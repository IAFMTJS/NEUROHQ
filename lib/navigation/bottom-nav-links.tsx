"use client";

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
 * Order is fixed: globals.css `.bottom-nav-items` bow uses nth-child(1..7) — keep Dashboard at index 4.
 * PNGs under `public/nav/` (see public/nav/README.md); `iconSrc` overrides path.
 */
export const BOTTOM_NAV_LINKS = [
  { href: "/tasks", label: "Missions", Icon: IconMissions, pngFile: "Missions.png" },
  { href: "/budget", label: "Budget", Icon: IconBudget, pngFile: "Budget.png" },
  { href: "/learning", label: "Growth", Icon: IconGrowth, pngFile: "Growth.png" },
  { href: "/dashboard", label: "Dashboard", Icon: IconHQ, pngFile: "Dashboard.png", large: true },
  { href: "/strategy", label: "Strategy", Icon: IconStrategy, pngFile: "Strategy.png" },
  { href: "/profile", label: "User", Icon: IconUser, pngFile: "User.png", iconSrc: "/Icons/User.PNG" },
  { href: "/settings", label: "Settings", Icon: IconSettings, pngFile: "Settings.png" },
] as const;

export type BottomNavLink = (typeof BOTTOM_NAV_LINKS)[number];
