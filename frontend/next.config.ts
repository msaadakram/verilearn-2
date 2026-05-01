import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '*.github.dev',
    '*.app.github.dev',
  ],
  turbopack: {
    // Ensure module/CSS resolution stays scoped to the frontend app directory.
    root: process.cwd(),
  },
};

export default nextConfig;
