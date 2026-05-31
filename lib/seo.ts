import { getAboutProfile } from "./about";
import { siteConfig } from "../config/site";

export function getSiteUrl(): string {
  return siteConfig.url;
}

export function generatePageMetadata(meta: {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  type?: "website" | "article";
}) {
  const profile = getAboutProfile();
  const url = meta.url || siteConfig.url;
  const image = meta.image || undefined;

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
      ...(image && { images: [image] }),
      type: meta.type || "website",
    } as any,
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      ...(image && { images: [image] }),
    },
  };
}

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
