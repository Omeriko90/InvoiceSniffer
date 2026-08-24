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
  // instrumentation.ts (compiled for edge because middleware runs on edge) and
  // client code never run the server-only worker chain, but its NEXT_RUNTIME-
  // guarded dynamic imports still get traced into the browser + edge builds.
  // `next dev --webpack` doesn't dead-code-eliminate the guard, so it tries to
  // bundle native/Node-only deps (@napi-rs/canvas, @google-cloud/run → node
  // "path", the workers, posthog-node) and fails. None run off Node, so drop the
  // whole chain from every non-Node build. Turbopack (the default) is unaffected;
  // serverExternalPackages keeps them external in the Node build.
  webpack: (config, { nextRuntime, webpack }) => {
    if (nextRuntime !== "nodejs") {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp:
            /(^@napi-rs\/canvas)|(^@google-cloud\/run)|([/\\](worker-trigger|posthog-server)$)|([/\\]workers[/\\])/,
        })
      )
    }
    return config
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
