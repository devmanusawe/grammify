import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer'],
  ...(process.env.NODE_ENV !== 'production' && {
    allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok.io'],
  }),
};

export default nextConfig;
