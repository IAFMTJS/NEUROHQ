"use client";

import Image from "next/image";

const HERO_SRC = "/Homepagemascotte.png";
const FALLBACK_SRC = "/app-icon.png";

export function HeroMascotImage() {
  return (
    <Image
      src={HERO_SRC}
      alt=""
      fill
      sizes="200px"
      className="object-contain"
      priority
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        if (el?.src && !el.src.endsWith(FALLBACK_SRC)) el.src = FALLBACK_SRC;
      }}
    />
  );
}
