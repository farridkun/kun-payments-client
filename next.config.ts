import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '*', 'http://159.89.204.161:3000'],
};

export default nextConfig;
