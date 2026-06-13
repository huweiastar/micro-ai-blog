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

// 对象存储 CDN 域名（Next 加载配置前已注入 .env.local；未配置时为 null，不影响本地模式）
const s3Host = process.env.S3_PUBLIC_BASE_URL
  ? new URL(process.env.S3_PUBLIC_BASE_URL).hostname
  : null;

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
      ...(s3Host ? [{ protocol: "https", hostname: s3Host }] : []),
    ],
  },
  // 文章 slug 改名后，旧链接 301 跳到新链接，避免已分享的链接失效。
  async redirects() {
    return loadRedirects();
  },
  async headers() {
    // CSP 先以 Report-Only 观察（违规仅在浏览器控制台报告，不拦截），
    // 稳定一周后把 key 切换为 Content-Security-Policy 正式启用。
    // script-src 暂保留 'unsafe-inline'：App Router 自身会注入内联 RSC 数据脚本，
    // 去掉它需要 nonce 方案，留待后续。
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://giscus.app",
      "style-src 'self' 'unsafe-inline' https://giscus.app",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://giscus.app",
      "frame-src https://giscus.app",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
