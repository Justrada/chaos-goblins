import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores stray lockfiles in parent dirs.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
