import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // ✅ Static export output (required for Render Static Site / GitHub Pages)
  output: "export",

  // ✅ Prevent next/image optimization errors during static export
  images: { unoptimized: true },
};

export default nextConfig;
