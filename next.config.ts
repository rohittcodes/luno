import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled cacheComponents due to conflicts with dynamic routes and API routes
  // Most routes in this app are authenticated and need to be dynamic anyway
  // cacheComponents: true,
  // Enable React 19 View Transitions (experimental)
  experimental: {
    viewTransition: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.lemonsqueezy.com https://api.resend.com https://generativelanguage.googleapis.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
        ],
      },
    ]
  },
};

export default nextConfig;
