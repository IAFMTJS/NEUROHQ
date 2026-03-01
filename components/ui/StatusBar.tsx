"use client";

import { useState, useEffect } from "react";

/** Reference: top status bar — time, signals, battery "27 ZP" (app metric). Cinematic UI 1:1. */
export function StatusBar() {
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const format = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    format();
    const id = setInterval(format, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return (
      <div className="status-bar fixed top-0 left-1/2 z-20 w-full max-w-[min(960px,100vw)] -translate-x-1/2 safe-area-pt flex items-center justify-between px-5 py-2.5 text-xs text-white/90">
        <span>--:--</span>
        <span aria-hidden>● ● ●</span>
        <span>— ZP</span>
      </div>
    );
  }

  return (
    <div
      className="status-bar fixed top-0 left-1/2 z-20 w-full max-w-[min(960px,100vw)] -translate-x-1/2 safe-area-pt flex items-center justify-between px-5 py-2.5 text-xs text-white/90"
      role="status"
      aria-label={`Time ${time}`}
    >
      <span className="tabular-nums">{time}</span>
      <span className="flex items-center gap-1" aria-hidden>
        <span className="opacity-80">▮</span>
        <span className="opacity-60">▮</span>
        <span className="opacity-100">▮</span>
      </span>
      <span className="tabular-nums">27 ZP</span>
    </div>
  );
}
