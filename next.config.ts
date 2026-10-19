import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. Next.js injects inline bootstrap scripts, so `script-src` needs 'unsafe-inline'
// (a nonce-based policy would force every page to be dynamically rendered). Everything else is locked down:
// no third-party origins, no framing, no plugins, forms only to ourselves. Stripe Checkout is a full-page
// redirect to checkout.stripe.com, so no Stripe script ever runs inside our pages.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

// Only the end-to-end build registers the sample games (tests/support); the product build keeps the empty module.
const samples = process.env.E2E_SAMPLES === "1" ? "./tests/support/register-samples.ts" : null;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(samples ? { turbopack: { resolveAlias: { "@/lib/game/sample-autoregister": samples } } } : {}),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
