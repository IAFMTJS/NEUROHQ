/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    browserDebugInfoInTerminal: true,
    serverComponentsHmrCache: true,
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
