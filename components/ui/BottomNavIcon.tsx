"use client";

import { useState } from "react";
import { NativeCachedImg } from "@/components/NativeCachedImg";
import type { BottomNavLink } from "@/lib/navigation/bottom-nav-links";

type Props = {
  link: BottomNavLink;
  active: boolean;
};

/** Same as production bottom nav: PNG from `public/nav` when present, else SVG from `NavIcons`. */
export function BottomNavIcon({ link, active }: Props) {
  const [useSvg, setUseSvg] = useState(false);
  const Icon = link.Icon;
  const large = "large" in link && link.large === true;
  const svgOnly = "svgOnly" in link && link.svgOnly === true;
  if (svgOnly) return <Icon active={active} />;
  if (useSvg) return <Icon active={active} />;
  const px = large ? 32 : 22;
  const src =
    "iconSrc" in link && link.iconSrc ? link.iconSrc : `/nav/${encodeURIComponent(link.pngFile)}`;
  return (
    <NativeCachedImg
      src={src}
      alt=""
      width={px}
      height={px}
      className={`object-contain ${large ? "h-8 w-8" : "h-[22px] w-[22px]"}`}
      onError={() => setUseSvg(true)}
    />
  );
}
