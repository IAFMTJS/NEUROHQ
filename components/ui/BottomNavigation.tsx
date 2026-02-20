"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { memo } from "react";

const navLinks = [
  { href: "/dashboard", label: "HQ", iconFile: "Dashboard.png" },
  { href: "/assistant", label: "Assistant", iconFile: "Assistent.png" },
  { href: "/tasks", label: "Missions", iconFile: "Missions.png" },
  { href: "/budget", label: "Budget", iconFile: "Budget.png" },
  { href: "/learning", label: "Growth", iconFile: "Growth.png" },
  { href: "/strategy", label: "Strategy", iconFile: "Strategy.png" },
  { href: "/report", label: "Insight", iconFile: "Insights.png" },
  { href: "/design", label: "Design", iconFile: "Strategy.png" },
  { href: "/settings", label: "Settings", iconFile: "Settings.png" },
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
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-item ${active ? "active" : ""}`}
            prefetch={true}
          >
            <Image
              src={`/icons/${link.iconFile}`}
              alt=""
              width={20}
              height={20}
              className="nav-item-icon"
            />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
});
