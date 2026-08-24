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
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
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
  // @napi-rs/canvas ships a native .node addon (used by pdf-parse and our
  // pdf-polyfill). Turbopack can't place a native binary in an ESM chunk
  // ("asset is not placeable in ESM chunks"), so keep these as runtime
  // requires instead of bundling them into the server output.
  serverExternalPackages: ["@napi-rs/canvas", "pdf-parse"],
  // The PDF export builder embeds vendored Heebo TTFs (for Hebrew receipts) via
  // readFileSync. On self-hosted (non-cloudrun) deployments POST /api/exports
  // runs that builder inline, so trace the font files into the standalone output
  // — dependency tracing doesn't follow a runtime file read on its own.
  outputFileTracingIncludes: {
    "/api/exports": ["src/lib/fonts/*.ttf"],
  },
  // `next dev --webpack` traces the server-only PDF chain (@napi-rs/canvas — a
  // native .node addon, reached via the worker modules) into the client
  // compilation and fails its browser-binary guard, even though it only ever
  // runs server-side. Drop @napi-rs/canvas (and its platform subpackages) from
  // the client build entirely. Turbopack (the default) ignores this and relies
  // on serverExternalPackages above.
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^@napi-rs\/canvas/ })
      )
    }
    return config
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
