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

// 生成 slug（保留中文）：用于 rehype-slug 对齐的知识库锚点 id / url。
// 注意：与 app/api/upload/route.ts 内的 slugify 不同 —— 后者需要 ASCII 文件名，
// 用汉字拼音映射；本版本保留中文，服务于站点内部锚点，无需 ASCII 化。
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

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / 超过一天显示 年.月.日。 */
export function timeAgo(dateStr: string, nowMs: number = Date.now()): string {
  const t = new Date(dateStr).getTime();
  const diff = Math.floor((nowMs - t) / 1000);
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  const d = new Date(dateStr);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
