import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Ensure module/CSS resolution stays scoped to the frontend app directory.
    root: process.cwd(),
  },
};

export default nextConfig;
