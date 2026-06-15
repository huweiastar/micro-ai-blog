import { getAllPostsSync } from "../lib/posts";
import { getSiteUrl, latestContentDate } from "../lib/seo";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPostsSync();
  const siteUrl = getSiteUrl();
  // 列表/静态页的 lastModified 取最新文章日期，比"构建时间"更贴近实际内容变更。
  const lastContent = latestContentDate(posts);

  return [
    {
      url: siteUrl,
      lastModified: lastContent,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: lastContent,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/tags`,
      lastModified: lastContent,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/categories`,
      lastModified: lastContent,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/archive`,
      lastModified: lastContent,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: lastContent,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: lastContent,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated || post.date),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
