"use client";

const DEFAULT_PER_IMAGE_MS = 8_000;

/**
 * Loads shell raster URLs and waits for decode where supported so assets are in the image cache.
 */
export async function preloadShellImagesDecoded(
  urls: readonly string[],
  perImageTimeoutMs = DEFAULT_PER_IMAGE_MS
): Promise<{ loaded: number; total: number; failedUrls: string[] }> {
  if (typeof window === "undefined" || urls.length === 0) {
    return { loaded: 0, total: urls.length, failedUrls: [] };
  }

  const failedUrls: string[] = [];

  const decodeOne = (src: string): Promise<boolean> =>
    new Promise((resolve) => {
      const img = new Image();
      const timer = window.setTimeout(() => resolve(false), perImageTimeoutMs);
      const done = (ok: boolean) => {
        window.clearTimeout(timer);
        resolve(ok);
      };

      img.onload = () => {
        if (typeof img.decode === "function") {
          img
            .decode()
            .then(() => done(true))
            .catch(() => done(true));
        } else {
          done(true);
        }
      };
      img.onerror = () => done(false);
      try {
        img.src = src;
      } catch {
        done(false);
      }
    });

  const results = await Promise.all(
    urls.map(async (src) => {
      const ok = await decodeOne(src);
      if (!ok) failedUrls.push(src);
      return ok;
    })
  );

  const loaded = results.filter(Boolean).length;
  return { loaded, total: urls.length, failedUrls };
}
