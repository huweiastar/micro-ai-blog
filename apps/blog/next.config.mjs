import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// monorepo：blog 运行于 apps/blog，content/ 与 data/ 在仓库根（共享）。
// 为运行时（dev / build SSG / start）注入默认共享根路径；
// prebuild 的独立 tsx 脚本另在 package.json 里设置同样的 env。
const __dir = path.dirname(fileURLToPath(import.meta.url));
process.env.CONTENT_DIR ||= path.resolve(__dir, "../../content");
process.env.DATA_DIR ||= path.resolve(__dir, "../../data");

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
  // monorepo 共享 TS 包需 Next 转译。
  transpilePackages: ["@pkg/auth", "@pkg/content"],
  // Next 15 起从 experimental 转正为顶层配置。
  serverExternalPackages: ["better-sqlite3"],
  // 构建输出目录可通过 NEXT_DIST_DIR 覆盖，用于蓝绿部署（先构建到 staging 目录，
  // 再原子切换），避免在"线上正在使用的 .next"上原地重建导致页面崩坏。
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // StrictMode 仅影响 dev（双调用 effect 以暴露副作用问题），生产构建中无此行为。
  // 之前因 PV 被重复计数而关闭；现 usePageView 已加模块级时间窗去重，可安全开启，
  // 恢复 dev 期的副作用检查（利于后续 React/Next 升级）。
  reactStrictMode: true,
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
    // CSP 已正式启用（enforced）：经代码层审计确认各 *-src 覆盖站点全部加载资源
    // （字体自托管、脚本仅 theme-init+giscus、连接全同源、文章无外部 iframe）。
    // script-src 暂保留 'unsafe-inline'：App Router 自身会注入内联 RSC 数据脚本，
    // 去掉它需要 nonce 方案，留待后续硬化。
    // 注意：未来若在文章中嵌入外部 iframe/脚本，需把对应域名加入 frame-src/script-src。
    const isDev = process.env.NODE_ENV === "development";
    const csp = [
      "default-src 'self'",
      // dev 模式下 Next.js webpack HMR 需要 unsafe-eval（react-refresh runtime）
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://giscus.app`,
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
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
