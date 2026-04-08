"use client";

import { NativeCachedImg } from "@/components/NativeCachedImg";

type Props = {
  className?: string;
  width?: number;
  height?: number;
};

/** Small app tile; uses native disk cache when warmed. */
export function WarmedAppIcon({ className, width = 56, height = 56 }: Props) {
  return <NativeCachedImg src="/icon-192.png" alt="" width={width} height={height} className={className} />;
}
