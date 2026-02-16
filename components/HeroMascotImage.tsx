"use client";

import Image from "next/image";

const HERO_SRC = "/Homepage%20Mascotte.png";
const FALLBACK_SRC = "/app-icon.png";

export function HeroMascotImage() {
  return (
    <Image
      src={HERO_SRC}
      alt=""
      fill
      sizes="(max-width: 768px) 85vw, 80vh"
      className="object-contain"
      priority
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        if (el?.src && !el.src.endsWith(FALLBACK_SRC)) el.src = FALLBACK_SRC;
      }}
    />
  );
}
