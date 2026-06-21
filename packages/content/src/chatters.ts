import fs from "fs";
import path from "path";
import { contentDir } from "./paths";
import matter from "gray-matter";

const dir = path.join(contentDir(), "chatters");

export interface Chatter {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  mood?: string;
  cover?: string;
  summary: string;
  content: string;
}

function parse(file: string): Chatter {
  const raw = fs.readFileSync(path.join(dir, file), "utf-8");
  const { data, content } = matter(raw);
  return {
    slug: (typeof data.slug === "string" && data.slug) || file.replace(/\.mdx?$/, ""),
    title: typeof data.title === "string" ? data.title : "无题",
    date: typeof data.date === "string" ? data.date : "",
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    mood: typeof data.mood === "string" ? data.mood : undefined,
    cover: typeof data.cover === "string" && data.cover ? data.cover : undefined,
    summary: typeof data.summary === "string" ? data.summary : "",
    content,
  };
}

function readAll(): Chatter[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map(parse)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function getAllChattersSync(): Chatter[] {
  return readAll();
}

export function getChatterBySlug(slug: string): Chatter | null {
  return readAll().find((c) => c.slug === slug) ?? null;
}
