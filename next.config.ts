import type { NextConfig } from "next";

// Applied to every response. Defense-in-depth for an app that renders
// authenticated financial data and proxies untrusted email attachments.
const securityHeaders = [
  // Clickjacking + XSS backstop. object-src/base-uri locked down; frame-ancestors
  // 'none' is the modern X-Frame-Options: DENY. Kept conservative so it doesn't
  // break the app: scripts/styles still allow 'unsafe-inline' (Next injects inline
  // bootstrap). Tighten to nonces later if the CSP is hardened further.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for the Cloud Run web container.
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
