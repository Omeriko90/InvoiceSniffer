import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for the Cloud Run web container.
  output: "standalone",
};

export default nextConfig;
