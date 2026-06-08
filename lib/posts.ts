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
import readingTime from "reading-time";
import Slugger from "github-slugger";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  summary: string;
  content: string;
  tags: string[];
  category: string;
  draft: boolean;
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
  // Count Chinese characters individually + English words
  const chineseChars = (content.match(/[一-鿿]/g) || []).length;
  const englishWords = content
    .replace(/[一-鿿]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return chineseChars + englishWords;
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

export async function getAllPosts(): Promise<BlogPost[]> {
  const files = fs.readdirSync(postsDirectory).filter((file) => {
    return file.endsWith(".md") || file.endsWith(".mdx");
  });

  const posts = files.map((file) => {
    const filePath = path.join(postsDirectory, file);
    const source = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(source);

    return {
      slug: getSlug(file),
      title: data.title || "",
      date: data.date || "",
      updated: data.updated,
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
  });

  return posts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  const files = fs.readdirSync(postsDirectory).filter((file) => {
    return file.endsWith(".md") || file.endsWith(".mdx");
  });

  const posts = files.map((file) => {
    const filePath = path.join(postsDirectory, file);
    const source = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(source);

    return {
      slug: getSlug(file),
      title: data.title || "",
      date: data.date || "",
      updated: data.updated,
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
  });

  return posts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostsByTag(tag: string): BlogPost[] {
  const posts = getAllPostsSync();
  return posts.filter((post) => post.tags.includes(tag));
}

export function getPostsByCategory(category: string): BlogPost[] {
  const posts = getAllPostsSync();
  return posts.filter((post) => post.category === category);
}

export async function renderMarkdownToHtml(content: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypePrettyCode, {
      theme: "github-dark",
      keepBackground: false,
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

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
