import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 明确项目根目录，避免父目录存在 lockfile 时 Turbopack 误判工作区。
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
