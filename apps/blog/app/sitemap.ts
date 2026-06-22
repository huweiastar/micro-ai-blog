import { getAllPostsSync, getAllNotesSync, getAllTags } from "../lib/posts";
import { getAllChattersSync } from "../lib/chatters";
import { getAllCategories } from "../lib/categories";
import { getProjects } from "../lib/projects";
import { getGalleryPhotos } from "../lib/gallery";
import { getSiteUrl, latestContentDate } from "../lib/seo";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPostsSync();
  const notes = getAllNotesSync();
  const chatters = getAllChattersSync();
  const categories = getAllCategories();
  const tags = getAllTags();
  const projects = getProjects();
  const photos = getGalleryPhotos();
  const siteUrl = getSiteUrl();
  // 列表/静态页的 lastModified 取最新文章日期，比"构建时间"更贴近实际内容变更。
  const lastContent = latestContentDate(posts);
  const lastNote = notes.length > 0 ? latestContentDate(notes) : lastContent;
  const lastChatter = chatters.length > 0 ? latestContentDate(chatters) : lastContent;

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
    {
      url: `${siteUrl}/chatters`,
      lastModified: lastChatter,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    {
      url: `${siteUrl}/friends`,
      lastModified: lastContent,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    // —— 随手记 ——
    {
      url: `${siteUrl}/notes`,
      lastModified: lastNote,
      changeFrequency: "daily",
      priority: 0.6,
    },
    // —— 相册 ——
    {
      url: `${siteUrl}/gallery`,
      lastModified: photos.length > 0
        ? latestContentDate(photos.filter((p) => p.date).map((p) => ({ date: p.date as string })))
        : lastContent,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    // —— 留言板 / 统计 / 知识图谱 / 足迹 ——
    {
      url: `${siteUrl}/guestbook`,
      lastModified: lastContent,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/stats`,
      lastModified: lastContent,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/graph`,
      lastModified: lastContent,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/footprint`,
      lastModified: lastContent,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    // —— 动态列表页（分类/标签） ——
    ...categories.map((cat) => ({
      url: `${siteUrl}/categories/${encodeURIComponent(cat.name)}`,
      lastModified: lastContent,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...tags.map((tag) => ({
      url: `${siteUrl}/tags/${encodeURIComponent(tag.name)}`,
      lastModified: lastContent,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    // —— 详情页（随手记/杂谈/项目） ——
    ...notes.map((n) => ({
      url: `${siteUrl}/notes/${n.slug}`,
      lastModified: new Date(n.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...chatters.map((c) => ({
      url: `${siteUrl}/chatters/${c.slug}`,
      lastModified: new Date(c.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...projects.filter((p) => !p.draft).map((p) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: lastContent,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // —— 博客文章 ——
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated || post.date),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
