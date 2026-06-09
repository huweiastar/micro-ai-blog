import { getAboutProfile } from "./about";
import { siteConfig } from "../config/site";

export function getSiteUrl(): string {
  return siteConfig.url;
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
  url?: string;
  image?: string;
  /** 文章/页面所属分类，用于动态 OG 图的配色与标签。 */
  category?: string;
  type?: "website" | "article";
}) {
  const profile = getAboutProfile();
  const url = meta.url || siteConfig.url;
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
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: profile.name,
      images: [ogImage],
      type: meta.type || "website",
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

export function getRssFeedUrl(): string {
  return `${siteConfig.url}/rss.xml`;
}
