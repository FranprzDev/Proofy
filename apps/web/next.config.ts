import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The TesterArmy e2e runner (e2e/e2e.config.ts) opens the dev server at 127.0.0.1; without this,
  // Next blocks its dev assets for that origin and the page never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
