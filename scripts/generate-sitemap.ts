import fs from "fs";
import path from "path";
import { atomicWriteFile } from "../lib/atomic-file";
import { getAllPostsSync } from "../lib/posts";
import { getSiteUrl } from "../lib/seo";

function generateSitemap(): string {
  const posts = getAllPostsSync();
  const siteUrl = getSiteUrl();

  const urls = [
    { loc: siteUrl, changefreq: "daily", priority: "1.0" },
    { loc: `${siteUrl}/blog`, changefreq: "daily", priority: "0.8" },
    { loc: `${siteUrl}/tags`, changefreq: "weekly", priority: "0.7" },
    { loc: `${siteUrl}/categories`, changefreq: "weekly", priority: "0.7" },
    { loc: `${siteUrl}/archive`, changefreq: "weekly", priority: "0.6" },
    { loc: `${siteUrl}/projects`, changefreq: "monthly", priority: "0.7" },
    { loc: `${siteUrl}/about`, changefreq: "monthly", priority: "0.5" },
    ...posts.map((post) => ({
      loc: `${siteUrl}/blog/${post.slug}`,
      changefreq: "weekly" as const,
      priority: "0.8",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
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
