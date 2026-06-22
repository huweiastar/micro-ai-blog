import fs from "fs";
import path from "path";
import { atomicWriteFile } from "../lib/atomic-file";
import { getAllPostsSync, getAllNotesSync, getAllTags } from "../lib/posts";
import { getAllChattersSync } from "../lib/chatters";
import { getAllCategories } from "../lib/categories";
import { getProjects } from "../lib/projects";
import { getGalleryPhotos } from "../lib/gallery";
import { getSiteUrl, latestContentDate } from "../lib/seo";

function toLastmod(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * 生成完整 sitemap（与 app/sitemap.ts 保持一致）。
 * 包括：首页 / 静态页 / 动态列表页 / 所有详情页。
 *
 * 注：本脚本产物写入 public/sitemap.xml，被 prebuild 调用。
 * Next.js 也有 app/sitemap.ts 动态路由，但 public/ 静态文件优先级更高。
 */
function generateSitemap(): string {
  const posts = getAllPostsSync();
  const notes = getAllNotesSync();
  const chatters = getAllChattersSync();
  const categories = getAllCategories();
  const tags = getAllTags();
  const projects = getProjects();
  const photos = getGalleryPhotos();
  const siteUrl = getSiteUrl();

  const lastContent = toLastmod(latestContentDate(posts));
  const lastNote = notes.length > 0 ? toLastmod(latestContentDate(notes)) : lastContent;
  const lastChatter = chatters.length > 0 ? toLastmod(latestContentDate(chatters)) : lastContent;
  const lastPhoto =
    photos.length > 0
      ? toLastmod(
          latestContentDate(
            photos.filter((p) => p.date).map((p) => ({ date: p.date as string }))
          )
        )
      : lastContent;

  type UrlEntry = { loc: string; changefreq: string; priority: string; lastmod: string };
  const urls: UrlEntry[] = [
    { loc: siteUrl, changefreq: "daily", priority: "1.0", lastmod: lastContent },
    { loc: `${siteUrl}/blog`, changefreq: "daily", priority: "0.8", lastmod: lastContent },
    { loc: `${siteUrl}/tags`, changefreq: "weekly", priority: "0.7", lastmod: lastContent },
    { loc: `${siteUrl}/categories`, changefreq: "weekly", priority: "0.7", lastmod: lastContent },
    { loc: `${siteUrl}/archive`, changefreq: "weekly", priority: "0.6", lastmod: lastContent },
    { loc: `${siteUrl}/projects`, changefreq: "monthly", priority: "0.7", lastmod: lastContent },
    { loc: `${siteUrl}/about`, changefreq: "monthly", priority: "0.5", lastmod: lastContent },
    { loc: `${siteUrl}/chatters`, changefreq: "weekly", priority: "0.6", lastmod: lastChatter },
    { loc: `${siteUrl}/friends`, changefreq: "monthly", priority: "0.4", lastmod: lastContent },
    { loc: `${siteUrl}/notes`, changefreq: "daily", priority: "0.6", lastmod: lastNote },
    { loc: `${siteUrl}/gallery`, changefreq: "weekly", priority: "0.5", lastmod: lastPhoto },
    { loc: `${siteUrl}/guestbook`, changefreq: "monthly", priority: "0.4", lastmod: lastContent },
    { loc: `${siteUrl}/stats`, changefreq: "weekly", priority: "0.5", lastmod: lastContent },
    { loc: `${siteUrl}/graph`, changefreq: "weekly", priority: "0.5", lastmod: lastContent },
    { loc: `${siteUrl}/footprint`, changefreq: "weekly", priority: "0.5", lastmod: lastContent },
  ];

  for (const cat of categories) {
    urls.push({
      loc: `${siteUrl}/categories/${encodeURIComponent(cat.name)}`,
      changefreq: "weekly",
      priority: "0.6",
      lastmod: lastContent,
    });
  }
  for (const tag of tags) {
    urls.push({
      loc: `${siteUrl}/tags/${encodeURIComponent(tag.name)}`,
      changefreq: "weekly",
      priority: "0.6",
      lastmod: lastContent,
    });
  }

  for (const n of notes) {
    urls.push({
      loc: `${siteUrl}/notes/${n.slug}`,
      changefreq: "monthly",
      priority: "0.5",
      lastmod: toLastmod(new Date(n.date)),
    });
  }
  for (const c of chatters) {
    urls.push({
      loc: `${siteUrl}/chatters/${c.slug}`,
      changefreq: "monthly",
      priority: "0.5",
      lastmod: toLastmod(new Date(c.date)),
    });
  }
  for (const p of projects.filter((p) => !p.draft)) {
    urls.push({
      loc: `${siteUrl}/projects/${p.slug}`,
      changefreq: "monthly",
      priority: "0.6",
      lastmod: lastContent,
    });
  }
  for (const post of posts) {
    urls.push({
      loc: `${siteUrl}/blog/${post.slug}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: toLastmod(new Date(post.updated || post.date)),
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return xml;
}

const sitemap = generateSitemap();
const outputPath = path.join(process.cwd(), "public/sitemap.xml");

atomicWriteFile(outputPath, sitemap);
console.log(`Sitemap generated: ${outputPath} (${sitemap.split("<url>").length - 1} URLs)`);
