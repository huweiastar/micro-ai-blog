import fs from "fs";
import path from "path";

function loadRedirects() {
  const filePath = path.join(process.cwd(), "config", "redirects.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const redirects = JSON.parse(raw);
    return Array.isArray(redirects) ? redirects : [];
  } catch {
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  // 构建输出目录可通过 NEXT_DIST_DIR 覆盖，用于蓝绿部署（先构建到 staging 目录，
  // 再原子切换），避免在"线上正在使用的 .next"上原地重建导致页面崩坏。
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Disabled StrictMode to prevent double execution of useEffect in dev/production
  // which caused page views to be counted twice.
  reactStrictMode: false,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.feishucdn.com" },
      { protocol: "https", hostname: "**.larksuitecdn.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
    ],
  },
  // 文章 slug 改名后，旧链接 301 跳到新链接，避免已分享的链接失效。
  async redirects() {
    return loadRedirects();
  },
};

export default nextConfig;
