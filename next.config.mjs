/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
