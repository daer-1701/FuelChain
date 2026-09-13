import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Demo/feria: no bloquear imagen Docker por warnings de lint
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
