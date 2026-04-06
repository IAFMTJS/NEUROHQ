"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { isNativeCapacitorRuntime } from "@/lib/mobile/feature-flags";
import { resolveNativeCachedWebSrc } from "@/lib/mobile/native-fs-cache";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

/**
 * On Capacitor, resolves `src` through the native Filesystem registry when warmed
 * (`warmNativeVisualAssetCache`); otherwise falls back to the original URL.
 */
export function NativeCachedImg({ src, ...rest }: Props) {
  const [resolved, setResolved] = useState(src);

  useEffect(() => {
    let alive = true;
    if (!isNativeCapacitorRuntime()) {
      setResolved(src);
      return () => {
        alive = false;
      };
    }
    void resolveNativeCachedWebSrc(src).then((next) => {
      if (alive) setResolved(next);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  return <img src={resolved} {...rest} />;
}
