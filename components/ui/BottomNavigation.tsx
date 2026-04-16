"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect, useState } from "react";
import { BottomNavIcon } from "@/components/ui/BottomNavIcon";
import { usePriorityNavClick } from "@/lib/navigation/use-priority-nav-click";
import { BRAIN_QUEUE_UPDATED_EVENT, getBrainPendingXpTotal } from "@/lib/brain-training/store";
import {
  BOTTOM_NAV_HUB,
  BOTTOM_NAV_LEFT,
  BOTTOM_NAV_RIGHT,
  type BottomNavLink,
} from "@/lib/navigation/bottom-nav-links";

export default memo(function BottomNavigation() {
  const pathname = usePathname();
  const onPriorityNavClick = usePriorityNavClick();
  const [brainPendingXp, setBrainPendingXp] = useState(0);

  const hubLink = BOTTOM_NAV_HUB;

  useEffect(() => {
    let cancelled = false;
    const refreshPending = async () => {
      const total = await getBrainPendingXpTotal();
      if (!cancelled) setBrainPendingXp(total);
    };
    const onQueueUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ pendingXp?: number }>).detail;
      if (typeof detail?.pendingXp === "number") {
        setBrainPendingXp(Math.max(0, Math.floor(detail.pendingXp)));
      } else {
        void refreshPending();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshPending();
      }
    };
    void refreshPending();
    window.addEventListener(BRAIN_QUEUE_UPDATED_EVENT, onQueueUpdated as EventListener);
    window.addEventListener("focus", onVisibility);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener(BRAIN_QUEUE_UPDATED_EVENT, onQueueUpdated as EventListener);
      window.removeEventListener("focus", onVisibility);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function RailLink({ link }: { link: BottomNavLink }) {
    const active = pathname === link.href;
    const prefetchHeavyRoute = link.href === "/tasks" || link.href === "/budget";
    const isBrain = link.href === "/brain";
    const showPendingBadge = isBrain && brainPendingXp > 0;
    const badgeValue = brainPendingXp > 99 ? "99+" : String(brainPendingXp);
    return (
      <Link
        href={link.href}
        className={`nav-item nav-item-fab-rail ${active ? "active" : ""}`}
        prefetch={prefetchHeavyRoute}
        aria-label={showPendingBadge ? `${link.label}, ${badgeValue} XP pending sync` : link.label}
        onClick={(e) => onPriorityNavClick(link.href, e)}
      >
        <span className="nav-item-icon flex items-center justify-center [&_svg]:h-[18px] [&_svg]:w-[18px]">
          <BottomNavIcon link={link} active={active} />
          {showPendingBadge ? (
            <span className="bottom-nav-brain-badge" aria-hidden>
              {badgeValue}
            </span>
          ) : null}
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
                aria-label={hubLink.label}
                aria-current={hubActive ? "page" : undefined}
                onClick={(e) => onPriorityNavClick(hubLink.href, e)}
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
