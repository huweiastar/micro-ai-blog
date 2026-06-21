/** @type {import('next').NextConfig} */
const nextConfig = {
  // 共享 TS 包需 Next 转译。
  transpilePackages: ["@pkg/auth"],
  // 蓝绿部署用：构建输出目录可经 NEXT_DIST_DIR 覆盖（与 blog 同手法）。
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
