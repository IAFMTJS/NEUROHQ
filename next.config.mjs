/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    localPatterns: [
      {
        pathname: "/mascots/**",
        // search omitted so ?v=2 (cache-bust) and any other query string are allowed
      },
      { pathname: "/app-icon.png" },
      { pathname: "/logo-naam.png" },
      { pathname: "/2D Emotions PNGs/**" },
      // Percent-encoded form (some runtimes normalize paths before matching)
      { pathname: "/2D%20Emotions%20PNGs/**" },
      { pathname: "/Girly Theme/**" },
      { pathname: "/Girly%20Theme/**" },
      { pathname: "/Industrial Theme/**" },
      { pathname: "/Industrial%20Theme/**" },
    ],
  },
  experimental: {
    browserDebugInfoInTerminal: true,
    serverComponentsHmrCache: true,
    /* Disabled: can cause endless recompilation. Re-enable for faster dev after first compile. */
    turbopackFileSystemCacheForDev: false,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // PWA: uncomment when using next-pwa
  // ...(require('next-pwa')({ dest: 'public', disable: process.env.NODE_ENV === 'development' })),
};

export default nextConfig;
