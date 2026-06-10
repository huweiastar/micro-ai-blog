/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // 中文路径以 percent-encoded 形式匹配（Next 收到的是编码后的 pathname）。
  async redirects() {
    return [
      {
        source:
          "/blog/%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%BC%94%E8%BF%9B%E5%8F%B2-%E4%BB%8E%E8%A7%84%E6%A8%A1%E6%B3%95%E5%88%99%E5%88%B0%E9%80%9A%E7%94%A8%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD%E7%9A%84%E7%A0%B4%E5%B1%80%E4%B9%8B%E8%B7%AF",
        destination: "/blog/llm-evolution-history",
        permanent: true,
      },
      {
        source: "/blog/大模型演进史-从规模法则到通用人工智能的破局之路",
        destination: "/blog/llm-evolution-history",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
