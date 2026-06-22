/** @type {import('next').NextConfig} */
const nextConfig = {
  // 共享 TS 包需 Next 转译。
  transpilePackages: ["@pkg/auth"],
  // 蓝绿部署用：构建输出目录可经 NEXT_DIST_DIR 覆盖（与 blog 同手法）。
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.feishucdn.com" },
      { protocol: "https", hostname: "**.larksuitecdn.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    // admin 域是钓鱼高价值目标 —— 安全头与 blog 保持同等强度：
    //   - CSP enforced：禁止外部脚本 / 内联样式放行（与 blog 一致）/ 禁止 frame 嵌入
    //   - HSTS：180 天 + includeSubDomains
    //   - X-Frame-Options DENY：兜底老浏览器（CSP frame-ancestors 不被 IE 识别）
    //   - Referrer-Policy / X-Content-Type-Options / Permissions-Policy：与 blog 对齐
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
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
          { key: "X-Frame-Options", value: "DENY" },
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
