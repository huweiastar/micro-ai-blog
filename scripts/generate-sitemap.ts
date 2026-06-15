import fs from "fs";
import path from "path";
import { atomicWriteFile } from "../lib/atomic-file";
import { getAllPostsSync } from "../lib/posts";
import { getSiteUrl, latestContentDate } from "../lib/seo";

function toLastmod(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function generateSitemap(): string {
  const posts = getAllPostsSync();
  const siteUrl = getSiteUrl();
  // 列表/静态页的 lastmod 取最新文章日期，比构建时间更贴近内容实际变更。
  const lastContent = toLastmod(latestContentDate(posts));

  const urls = [
    { loc: siteUrl, changefreq: "daily", priority: "1.0", lastmod: lastContent },
    { loc: `${siteUrl}/blog`, changefreq: "daily", priority: "0.8", lastmod: lastContent },
    { loc: `${siteUrl}/tags`, changefreq: "weekly", priority: "0.7", lastmod: lastContent },
    { loc: `${siteUrl}/categories`, changefreq: "weekly", priority: "0.7", lastmod: lastContent },
    { loc: `${siteUrl}/archive`, changefreq: "weekly", priority: "0.6", lastmod: lastContent },
    { loc: `${siteUrl}/projects`, changefreq: "monthly", priority: "0.7", lastmod: lastContent },
    { loc: `${siteUrl}/about`, changefreq: "monthly", priority: "0.5", lastmod: lastContent },
    ...posts.map((post) => ({
      loc: `${siteUrl}/blog/${post.slug}`,
      changefreq: "weekly" as const,
      priority: "0.8",
      lastmod: toLastmod(new Date(post.updated || post.date)),
    })),
  ];

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
console.log(`Sitemap generated: ${outputPath}`);
