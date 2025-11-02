import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled cacheComponents due to conflicts with dynamic routes and API routes
  // Most routes in this app are authenticated and need to be dynamic anyway
  // cacheComponents: true,
  // Enable React 19 View Transitions (experimental)
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
