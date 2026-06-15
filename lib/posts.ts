import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";
import { rehypeCallouts } from "./rehype-callouts";
import { rehypeMark } from "./rehype-mark";
import { rehypeContentEnhance } from "./rehype-content-enhance";
import { rehypeCodeHeader } from "./rehype-code-header";
import readingTime from "reading-time";
import { countWords } from "./word-count";
import Slugger from "github-slugger";

export type BlogPost = {
  slug: string;
  /** 内容类型：article 正式文章（默认），note 随手记（短内容，时间线展示）。 */
  type: "article" | "note";
  title: string;
  date: string;
  updated?: string;
  summary: string;
  content: string;
  tags: string[];
  category: string;
  draft: boolean;
  /** 定时发布时间（ISO 字符串）。未到该时间则前台不可见；缺省时回退到 date。 */
  publish?: string;
  readingTime: string;
  wordCount: number;
  cover?: string;
  toc: TocItem[];
};

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export type SearchItem = {
  title: string;
  summary: string;
  tags: string[];
  category: string;
  content: string;
  slug: string;
  type: "post" | "project";
};

export type Tag = {
  name: string;
  count: number;
};

const postsDirectory = path.join(process.cwd(), "content/blog");

export function getSlug(filePath: string): string {
  return path.basename(filePath).replace(/\.(md|mdx)$/, "");
}

export function calculateReadingTime(content: string): string {
  const { minutes } = readingTime(content);
  if (minutes < 1) return "1 min read";
  return `${Math.round(minutes)} min read`;
}

export function calculateWordCount(content: string): number {
  return countWords(content);
}

export function generateToc(content: string): TocItem[] {
  const slugger = new Slugger();
  const headings = content.match(/^#{2,3}\s+.+$/gm) || [];
  return headings.map((heading) => {
    const level = heading.startsWith("###") ? 3 : 2;
    const text = heading.replace(/^#{2,3}\s+/, "");
    const id = slugger.slug(text);
    return { id, text, level };
  });
}

function parsePostFile(file: string): BlogPost {
  const filePath = path.join(postsDirectory, file);
  const source = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(source);

  return {
    // 优先使用 frontmatter 自定义 slug（让 URL 与文件名解耦，中文标题也能有干净链接）
    slug: (typeof data.slug === "string" && data.slug) || getSlug(file),
    type: data.type === "note" ? "note" : "article",
    title: data.title || "",
    date: data.date || "",
    updated: data.updated,
    publish: data.publish,
    summary: data.summary || "",
    tags: data.tags || [],
    category: data.category || "",
    draft: data.draft || false,
    content,
    readingTime: calculateReadingTime(content),
    wordCount: calculateWordCount(content),
    toc: generateToc(content),
    cover: data.cover,
  };
}

// 进程级缓存：解析全部文章是重活（读盘 + gray-matter + readingTime + toc），
// 而单次页面渲染/构建会反复调用（详情页一次渲染就触发 3~4 次）。以「目录 mtime +
// 文件名集合」为指纹：新增/删除/改名会改文件名集合，经 atomicWriteFile 的原子
// rename 覆盖编辑会改目录 mtime，二者任一变化都自动失效；写操作后
// refreshAfterContentChange 也会显式清空，双保险。
let postsCache: { signature: string; posts: BlogPost[] } | null = null;

function dirSignature(files: string[]): string {
  let mtime = 0;
  try {
    mtime = fs.statSync(postsDirectory).mtimeMs;
  } catch {
    /* 目录不存在：指纹退化为空集 */
  }
  return `${mtime}:${files.join(",")}`;
}

/** 读取并解析全部文章文件（不做任何可见性过滤），带进程级指纹缓存。 */
function readAllPostFiles(): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) return [];
  const files = fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));
  const signature = dirSignature(files);
  if (postsCache && postsCache.signature === signature) return postsCache.posts;
  const posts = files.map(parsePostFile);
  postsCache = { signature, posts };
  return posts;
}

/** 显式清空文章缓存。内容写操作（增删改）后调用，保证产物重建读到最新数据。 */
export function invalidatePostsCache(): void {
  postsCache = null;
}

/** 文章生效的发布时间（毫秒）：优先 publish 字段，否则回退 date；解析失败按 0。 */
export function getPublishTime(post: { publish?: string; date: string }): number {
  const raw = (post.publish || post.date || "").trim();
  // 纯日期（YYYY-MM-DD）按「服务器本地午夜」解释，与 todayDate() 生成日期的本地时区保持一致。
  // 否则 new Date("2026-06-13") 会被当成 UTC 午夜，在 UTC+N 时区的清晨被误判为「未来定时」而隐藏。
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw;
  const t = new Date(normalized).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** 是否已对访客可见：非草稿且已到发布时间。 */
export function isPublished(post: BlogPost, now: number = Date.now()): boolean {
  if (post.draft) return false;
  return getPublishTime(post) <= now;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  // 与 getAllPostsSync 逻辑一致，委托避免重复实现。
  return getAllPostsSync();
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  // URL may be encoded (e.g. Chinese characters), decode for matching
  const decodedSlug = decodeURIComponent(slug);
  return posts.find((post) => post.slug === decodedSlug) || null;
}

export function getAllTags(): Tag[] {
  const posts = getAllPostsSync();
  const tagMap = new Map<string, number>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllCategories(): { name: string; count: number }[] {
  const posts = getAllPostsSync();
  const categoryMap = new Map<string, number>();

  posts.forEach((post) => {
    if (post.category) {
      categoryMap.set(
        post.category,
        (categoryMap.get(post.category) || 0) + 1
      );
    }
  });

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllPostsSync(): BlogPost[] {
  const now = Date.now();
  return readAllPostFiles()
    .filter((post) => isPublished(post, now))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** 已发布的正式文章（排除随手记），用于博客列表/首页等。 */
export function getAllArticlesSync(): BlogPost[] {
  return getAllPostsSync().filter((post) => post.type === "article");
}

/** 已发布的随手记（时间线展示用）。 */
export function getAllNotesSync(): BlogPost[] {
  return getAllPostsSync().filter((post) => post.type === "note");
}

/**
 * 读取全部文章（含草稿与未到点的定时文章），并标注调度状态。
 * 仅供后台/作者视角使用，切勿用于前台渲染。
 */
export function getAllPostsForAdmin(): (BlogPost & {
  scheduled: boolean;
  publishTime: number;
})[] {
  const now = Date.now();
  return readAllPostFiles()
    .map((post) => ({
      ...post,
      publishTime: getPublishTime(post),
      scheduled: !post.draft && getPublishTime(post) > now,
    }))
    .sort((a, b) => b.publishTime - a.publishTime);
}

export function getPostsByTag(tag: string): BlogPost[] {
  const posts = getAllPostsSync();
  return posts.filter((post) => post.tags.includes(tag));
}

export function getPostsByCategory(category: string): BlogPost[] {
  const posts = getAllPostsSync();
  return posts.filter((post) => post.category === category);
}

function sanitizeMarkdownHtml(content: string): string {
  return content
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*javascript:[^\s>]+/gi, '$1="#"');
}

export async function renderMarkdownToHtml(content: string): Promise<string> {
  const safeContent = sanitizeMarkdownHtml(content);
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "prepend",
      properties: { className: ["heading-anchor"], ariaHidden: true, tabIndex: -1 },
      content: { type: "text", value: "#" },
    })
    .use(rehypeCallouts)
    .use(rehypeMark)
    .use(rehypeContentEnhance)
    .use(rehypePrettyCode, {
      theme: "github-dark",
      keepBackground: false,
    })
    // 在 pretty-code 之后预渲染代码块工具条，保证 SSR 与客户端 DOM 一致（消除水合不匹配）
    .use(rehypeCodeHeader)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(safeContent);

  return result.toString();
}

export function getAdjacentPosts(
  posts: BlogPost[],
  slug: string
): { prev?: BlogPost; next?: BlogPost } {
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return {};
  return {
    prev: index < posts.length - 1 ? posts[index + 1] : undefined,
    next: index > 0 ? posts[index - 1] : undefined,
  };
}

export function getRelatedPosts(
  posts: BlogPost[],
  slug: string,
  limit: number = 3
): BlogPost[] {
  const current = posts.find((post) => post.slug === slug);
  if (!current) return [];

  return posts
    .filter((post) => post.slug !== slug)
    .map((post) => {
      const sharedTags = post.tags.filter((tag) =>
        current.tags.includes(tag)
      );
      const sameCategory = post.category === current.category;
      return {
        post,
        score: sharedTags.length * 2 + (sameCategory ? 1 : 0),
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
}

export type SeriesContext = {
  category: string;
  position: number; // 1-based 在本专栏中的序号（按发布时间升序）
  total: number;
  prev?: BlogPost; // 专栏内上一篇（更早发布）
  next?: BlogPost; // 专栏内下一篇（更晚发布）
};

/**
 * 计算文章在其所属分类（专栏）中的连载上下文。
 * 阅读顺序按发布时间升序：第 1 篇为最早发布。
 * 仅当分类存在且专栏内至少有 2 篇文章时返回，否则返回 null。
 */
export function getSeriesContext(
  posts: BlogPost[],
  slug: string
): SeriesContext | null {
  const current = posts.find((post) => post.slug === slug);
  if (!current || !current.category) return null;

  const series = posts
    .filter((post) => post.category === current.category)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 即便专栏内只有 1 篇，也展示专栏归属框（无上一/下一篇）。
  const index = series.findIndex((post) => post.slug === slug);
  if (index === -1) return null;

  return {
    category: current.category,
    position: index + 1,
    total: series.length,
    prev: index > 0 ? series[index - 1] : undefined,
    next: index < series.length - 1 ? series[index + 1] : undefined,
  };
}

export function generateSearchIndex(): SearchItem[] {
  const posts = getAllPostsSync();
  const postItems: SearchItem[] = posts.map((post) => ({
    title: post.title,
    summary: post.summary,
    tags: post.tags,
    category: post.category,
    content: post.content.replace(/[#*`>\-_]/g, ""),
    slug: post.slug,
    type: "post",
  }));

  // 把项目也纳入站内搜索（延迟 require 避免与 projects 模块的循环引用风险）
  const { getProjects } = require("./projects") as typeof import("./projects");
  const projectItems: SearchItem[] = getProjects().map((p) => ({
    title: p.name,
    summary: p.description,
    tags: p.techStack || [],
    category: "项目",
    content: [p.content || "", ...(p.highlights || [])].join(" ").replace(/[#*`>\-_]/g, ""),
    slug: p.slug,
    type: "project",
  }));

  return [...postItems, ...projectItems];
}
