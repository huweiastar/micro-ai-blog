import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 生成 slug：保留中文与字母数字。空白折叠为连字符，删除其余非法字符。
// 用于知识库锚点 id / url（与 rehype-slug 渲染的标题锚点对齐）。
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w一-龥-]/g, "");
}

// 生成 slug（折叠+去边）：保留中文，连续非法字符（含空白/标点）折叠为单个连字符，
// 并去除首尾连字符。用于文章/项目文件名与 URL slug。
export function slugifyCjk(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
