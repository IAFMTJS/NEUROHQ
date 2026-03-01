/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [420, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    localPatterns: [
      {
        pathname: "/mascots/**",
        // search omitted so ?v=2 (cache-bust) and any other query string are allowed
      },
      { pathname: "/icons/**" },
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
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'recharts'],
    /* Disabled: can cause endless recompilation. Re-enable for faster dev after first compile. */
    turbopackFileSystemCacheForDev: false,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // PWA: uncomment when using next-pwa
  // ...(require('next-pwa')({ dest: 'public', disable: process.env.NODE_ENV === 'development' })),
};

export default nextConfig;
