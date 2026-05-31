import { getAllPostsSync } from "../lib/posts";
import { getSiteUrl } from "../lib/seo";
import type { MetadataRoute } from "next";

// Build date — only changes when the site is rebuilt
const BUILD_DATE = new Date().toISOString();

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPostsSync();
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      lastModified: BUILD_DATE,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: BUILD_DATE,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/tags`,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/categories`,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/archive`,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: BUILD_DATE,
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
