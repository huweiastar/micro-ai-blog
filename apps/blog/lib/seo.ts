import { getAboutProfile } from "./about";
import { siteConfig } from "../config/site";

export function getSiteUrl(): string {
  return siteConfig.url;
}

/** 把站内路径（如 "/about"、"/blog/hello"）拼成完整 URL。自动处理首尾斜杠。 */
export function pageUrl(path: string): string {
  const base = siteConfig.url.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

/**
 * 构建动态 OG 分享图地址（由 /og 路由用 next/og 实时渲染品牌化卡片）。
 */
export function buildOgImageUrl(opts: {
  title: string;
  category?: string;
  label?: string;
}): string {
  const params = new URLSearchParams({ title: opts.title });
  if (opts.category) params.set("category", opts.category);
  if (opts.label) params.set("label", opts.label);
  return `${siteConfig.url}/og?${params.toString()}`;
}

export function generatePageMetadata(meta: {
  title: string;
  description: string;
  keywords?: string;
  /** 页面完整 URL 或站内路径（如 "/about"）。必填，避免 canonical 静默回退到首页。 */
  url: string;
  image?: string;
  /** 文章/页面所属分类，用于动态 OG 图的配色与标签。 */
  category?: string;
  type?: "website" | "article";
  /** type="article" 时附带的文章元数据（OG article:* 标签）。 */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
    section?: string;
  };
}) {
  const profile = getAboutProfile();
  // 兼容相对路径：以 "/" 开头视为站内 path，拼到 siteConfig.url 上。
  const url = meta.url.startsWith("/") ? pageUrl(meta.url) : meta.url;
  // 优先使用显式封面，否则回退到动态生成的品牌化 OG 图。
  const image =
    meta.image || buildOgImageUrl({ title: meta.title, category: meta.category });
  const ogImage = { url: image, width: 1200, height: 630 };

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords ? meta.keywords.split(",").map((k) => k.trim()) : [],
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
      // 与 layout 一致地暴露 RSS（页面级 metadata 会整体替换 layout 的 alternates，
      // 故这里需重复声明，否则使用本函数的页面会丢失 feed 自动发现）。
      types: {
        "application/rss+xml": `${siteConfig.url}/rss.xml`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: profile.name,
      images: [ogImage],
      type: meta.type || "website",
      ...(meta.type === "article" &&
        meta.article && {
          ...meta.article,
          authors: meta.article.authors?.map((name) => ({ name })),
        }),
    } as OpenGraphMeta,
    twitter: {
      card: "summary_large_image" as const,
      title: meta.title,
      description: meta.description,
      images: [image],
    },
  };
}

type OpenGraphMeta = {
  title: string;
  description: string;
  url: string;
  siteName: string;
  images: { url: string; width: number; height: number }[];
  type: "website" | "article";
};

/**
 * Generate JSON-LD structured data for search engines.
 * Supports Article (blog posts) and WebSite (homepage).
 */
export function generateArticleStructuredData(
  post: {
    title: string;
    summary: string;
    date: string;
    updated?: string;
    tags: string[];
    category: string;
    cover?: string;
    wordCount: number;
    readingTime: string;
  },
  postUrl: string
): Record<string, unknown> {
  const profile = getAboutProfile();
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    keywords: post.tags.join(", "),
    articleSection: post.category,
    wordCount: post.wordCount,
    timeRequired: post.readingTime,
    datePublished: post.date,
    ...(post.updated && { dateModified: post.updated }),
    url: postUrl,
    ...(post.cover && {
      image: {
        "@type": "ImageObject",
        url: `${siteConfig.url}${post.cover}`,
      },
    }),
    author: {
      "@type": "Person",
      name: profile.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: profile.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}${profile.avatar}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };
}

/**
 * 生成面包屑（BreadcrumbList）结构化数据，帮助搜索引擎展示层级导航。
 * items 按从根到当前页的顺序排列。
 */
export function generateBreadcrumbStructuredData(
  items: { name: string; url: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Website structured data for the homepage.
 */
export function generateWebsiteStructuredData(): Record<string, unknown> {
  const profile = getAboutProfile();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: profile.name,
    description: siteConfig.description,
    url: siteConfig.url,
    publisher: {
      "@type": "Person",
      name: profile.name,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * 关于页 Person JSON-LD —— 帮助搜索引擎构建作者知识面板（Knowledge Panel）。
 */
export function generatePersonStructuredData(profile: {
  name: string;
  title?: string;
  bio?: string;
  avatar?: string;
  email?: string;
  github?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    ...(profile.title && { jobTitle: profile.title }),
    ...(profile.bio && { description: profile.bio }),
    url: siteConfig.url,
    ...(profile.avatar && { image: `${siteConfig.url}${profile.avatar}` }),
    ...(profile.email && { email: `mailto:${profile.email}` }),
    sameAs: [
      ...(profile.github ? [profile.github] : []),
      siteConfig.social.juejin || "",
      siteConfig.social.zhihu || "",
      siteConfig.social.linkedin || "",
    ].filter(Boolean),
  };
}

export function getRssFeedUrl(): string {
  return `${siteConfig.url}/rss.xml`;
}

/** 取文章集合中最新的 updated/date，用于站点级 lastModified；空集合回退到传入的当前时间。 */
export function latestContentDate(
  posts: { date: string; updated?: string }[],
  fallback: Date = new Date(),
): Date {
  const times = posts
    .map((p) => new Date(p.updated || p.date).getTime())
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return fallback;
  return new Date(Math.max(...times));
}
