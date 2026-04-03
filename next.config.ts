import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ['puppeteer'],
  ...(process.env.NODE_ENV !== 'production' && {
    allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok.io'],
  }),
};

export default nextConfig;
