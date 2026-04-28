import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Turbopack sometimes infers the wrong workspace root when multiple lockfiles exist.
  // Instruct Turbopack to use this package directory as the project root.
  // @ts-ignore - property is accepted by Next/Turbopack at runtime.
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
