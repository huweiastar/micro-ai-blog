import fs from "fs";
import path from "path";
import { atomicWriteFile } from "./atomic-file";
import { commitContentChange } from "./git-sync";
import RSS from "rss";
import { revalidatePath } from "next/cache";
import { getAllPostsSync, generateSearchIndex, invalidatePostsCache } from "./posts";
import { getSiteUrl } from "./seo";
import { getAboutProfile } from "./about";
import { saveKnowledgeIndex } from "./assistant/indexer";

/**
 * 重新生成所有「构建期产物」：搜索索引 / sitemap / RSS / AI 知识库索引。
 *
 * 这些产物原本只在 `prebuild` 阶段生成。后台增删改文章后若不重建，
 * 新内容不会出现在站内搜索、sitemap、RSS 和 AI 助手中。此函数把脚本里
 * 的逻辑抽出来，供写接口在运行时调用，实现「发布即生效」。
 */
function writeSearchIndex() {
  const searchIndex = generateSearchIndex();
  atomicWriteFile(
    path.join(process.cwd(), "public/search-index.json"),
    JSON.stringify(searchIndex, null, 2)
  );
}

function writeSitemap() {
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

  atomicWriteFile(path.join(process.cwd(), "public/sitemap.xml"), xml);
}

function writeRss() {
  const posts = getAllPostsSync();
  const siteUrl = getSiteUrl();
  const profile = getAboutProfile();

  const feed = new RSS({
    title: profile.name,
    description: "个人技术博客",
    site_url: siteUrl,
    feed_url: `${siteUrl}/rss.xml`,
    language: "zh-CN",
    pubDate: new Date(),
  });

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.summary,
      url: `${siteUrl}/blog/${post.slug}`,
      date: new Date(post.date),
      categories: [post.category, ...post.tags],
    });
  });

  atomicWriteFile(
    path.join(process.cwd(), "public/rss.xml"),
    feed.xml({ indent: true })
  );
}

/**
 * 重建所有静态产物。任一步骤失败都不应让写操作整体失败，
 * 因此每步独立 try/catch 并收集错误。
 */
export function regenerateContentArtifacts(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const steps: Array<[string, () => void]> = [
    ["search-index", writeSearchIndex],
    ["sitemap", writeSitemap],
    ["rss", writeRss],
    ["knowledge-index", () => saveKnowledgeIndex()],
  ];

  for (const [name, fn] of steps) {
    try {
      fn();
    } catch (err) {
      console.error(`[regenerate] ${name} 失败:`, err);
      errors.push(name);
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * 失效所有依赖文章数据的页面缓存，使 `next start` 下静态生成的页面
 * 在下次访问时重新渲染，新文章立即可见。
 */
export function revalidateContentPaths(slug?: string) {
  const paths: Array<[string, "page" | "layout"]> = [
    ["/", "page"],
    ["/blog", "page"],
    ["/blog/[slug]", "page"],
    ["/notes", "page"],
    ["/archive", "page"],
    ["/tags", "page"],
    ["/tags/[tag]", "page"],
    ["/categories", "page"],
    ["/categories/[category]", "page"],
    ["/projects", "page"],
    ["/projects/[slug]", "page"],
  ];
  for (const [p, type] of paths) {
    try {
      revalidatePath(p, type);
    } catch (err) {
      console.error(`[revalidate] ${p} 失败:`, err);
    }
  }
  if (slug) {
    try {
      revalidatePath(`/blog/${slug}`);
    } catch {
      /* ignore */
    }
  }
}

/** 内容变更后的统一刷新入口：重建产物 + 失效页面缓存 + git 自动提交。 */
export function refreshAfterContentChange(slug?: string) {
  // 先失效文章缓存，确保下面重建搜索索引/sitemap/RSS 时读到的是刚写入的新内容。
  invalidatePostsCache();
  const result = regenerateContentArtifacts();
  revalidateContentPaths(slug);
  commitContentChange(`chore(content): 后台更新 ${slug ?? "内容"}`);
  return result;
}
