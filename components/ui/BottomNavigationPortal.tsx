"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import BottomNavigation from "@/components/ui/BottomNavigation";

const noop = () => () => {};

function subscribeToNothing() {
  return noop;
}

/**
 * Renders the dock outside `#app-shell`. `.hq-app-shell` uses `backdrop-filter`, which creates a
 * containing block for `position: fixed` in WebKit/Blink — the bar then scrolls away with the shell
 * on mobile. Porting to `document.body` restores viewport-fixed behavior.
 */
export function BottomNavigationPortal() {
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const chrome = (
    <>
      <div className="bottom-nav-underlay" aria-hidden />
      <BottomNavigation />
    </>
  );

  if (!mounted || typeof document === "undefined") {
    return chrome;
  }

  return createPortal(chrome, document.body);
}
