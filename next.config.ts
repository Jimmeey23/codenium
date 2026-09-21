import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in the home directory otherwise
  // makes Turbopack infer ~/ as the root and warn on every boot.
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
