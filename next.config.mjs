/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    browserDebugInfoInTerminal: true,
    serverComponentsHmrCache: true,
    // Turbopack filesystem cache: 5–14x faster route compiles after first run. If you see
    // "Failed to restore task data" / corrupted DB, run: npm run dev:clean
    turbopackFileSystemCacheForDev: true,
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
