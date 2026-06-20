// 确保 URL 始终包含协议前缀
const rawUrl =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "https://your-domain.com";
const normalizedUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

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
