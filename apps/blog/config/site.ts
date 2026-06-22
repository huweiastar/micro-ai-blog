// 确保 URL 始终包含协议前缀。
// 缺失 NEXT_PUBLIC_SITE_URL 时抛出错误，避免 RSS / canonical / OG 等静默回退到占位域名。
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
if (!rawUrl && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL 未配置。请在 .env.local 中设置（如 https://huweiastar.deepai.icu），" +
      "否则 RSS、canonical、OG 等将回退到占位域名。"
  );
}
const normalizedUrl = rawUrl
  ? rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
  : "https://your-domain.com"; // 仅开发环境允许回退

export const siteConfig = {
  name: "微观AI",
  title: "微观AI | 微观AI的个人技术博客",
  description:
    "微观AI的个人技术博客，专注大数据开发、大模型数据工程、大模型基础架构与应用工程。",
  url: normalizedUrl,
  author: "微观AI",
  email: "huweiastar@163.com",
  github: "https://github.com/huweiastar",
  locale: "zh-CN",
  avatar: "/images/avatar/avatar.webp",
  social: {
    github: "https://github.com/huweiastar",
    email: "mailto:huweiastar@163.com",
    juejin: "",
    zhihu: "",
    linkedin: "",
  },
};
