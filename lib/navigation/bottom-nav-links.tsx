"use client";

import {
  IconHQ,
  IconMissions,
  IconBudget,
  IconGrowth,
  IconStrategy,
  IconUser,
  IconSettings,
  IconXP,
} from "@/components/hq/NavIcons";

/**
 * Order is fixed: Dashboard stays at index 3 — FAB layout uses left (0–2) · hub (3) · right (4–6).
 * PNGs under `public/nav/` (see public/nav/README.md); `iconSrc` overrides path.
 */
export const BOTTOM_NAV_LINKS = [
  { href: "/tasks", label: "Missions", Icon: IconMissions, pngFile: "Missions.png" },
  { href: "/budget", label: "Budget", Icon: IconBudget, pngFile: "Budget.png" },
  { href: "/learning", label: "Growth", Icon: IconGrowth, pngFile: "Growth.png" },
  { href: "/dashboard", label: "Dashboard", Icon: IconHQ, pngFile: "Dashboard.png", large: true },
  { href: "/brain", label: "Brain", Icon: IconXP, pngFile: "Brain.png", svgOnly: true },
  { href: "/strategy", label: "Strategy", Icon: IconStrategy, pngFile: "Strategy.png" },
  { href: "/profile", label: "User", Icon: IconUser, pngFile: "User.png", iconSrc: "/Icons/User.PNG" },
  { href: "/settings", label: "Settings", Icon: IconSettings, pngFile: "Settings.png" },
] as const;

export type BottomNavLink = (typeof BOTTOM_NAV_LINKS)[number];

export const BOTTOM_NAV_LEFT = BOTTOM_NAV_LINKS.slice(0, 3);
export const BOTTOM_NAV_HUB = BOTTOM_NAV_LINKS[3]!;
export const BOTTOM_NAV_RIGHT = BOTTOM_NAV_LINKS.slice(4);
