import fs from "fs";
import path from "path";
import { contentDir } from "./paths";
import matter from "gray-matter";

const LOCAL_IMAGE_PREFIX = "/images/";
const SCAN_ROOTS = ["content", "config"];
const TEXT_EXTENSIONS = new Set([".md", ".mdx", ".yaml", ".yml", ".json", ".ts"]);

export type MediaReference = {
  file: string;
  field?: string;
  url: string;
};

function stripHashAndQuery(url: string): string {
  return url.split("#")[0].split("?")[0];
}

export function isLocalImageUrl(url: string): boolean {
  return stripHashAndQuery(url).startsWith(LOCAL_IMAGE_PREFIX);
}

export function localImagePath(url: string): string | null {
  const cleanUrl = stripHashAndQuery(url);
  if (!isLocalImageUrl(cleanUrl) || cleanUrl.includes("..")) return null;
  const resolved = path.resolve(process.cwd(), "public", "." + cleanUrl);
  const imagesRoot = path.resolve(process.cwd(), "public", "images");
  if (resolved !== imagesRoot && !resolved.startsWith(imagesRoot + path.sep)) return null;
  return resolved;
}

export function extractImageUrls(markdown: string): string[] {
  const urls = new Set<string>();
  const markdownImagePattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const htmlImagePattern = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null;
  while ((match = markdownImagePattern.exec(markdown)) !== null) {
    urls.add(match[1].trim());
  }
  while ((match = htmlImagePattern.exec(markdown)) !== null) {
    urls.add(match[1].trim());
  }

  return Array.from(urls);
}

export function getPostImageReferences(filePath: string): MediaReference[] {
  const source = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(source);
  const refs: MediaReference[] = [];
  const relativeFile = path.relative(process.cwd(), filePath);

  if (typeof data.cover === "string" && data.cover) {
    refs.push({ file: relativeFile, field: "cover", url: data.cover });
  }

  for (const url of extractImageUrls(content)) {
    refs.push({ file: relativeFile, field: "body", url });
  }

  return refs;
}

function walkTextFiles(dir: string, files: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTextFiles(full, files);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
}

export function findMediaReferences(url: string): MediaReference[] {
  const cleanUrl = stripHashAndQuery(url);
  const files: string[] = [];
  for (const root of SCAN_ROOTS) {
    const base = root === "content" ? contentDir() : path.join(process.cwd(), root);
    walkTextFiles(base, files);
  }

  const refs: MediaReference[] = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf-8");
    if (source.includes(cleanUrl)) {
      refs.push({
        file: path.relative(process.cwd(), file),
        url: cleanUrl,
      });
    }
  }
  return refs;
}

export type MissingPostImage = {
  slug: string;
  file: string;
  url: string;
  field?: string;
};

function canonicalPostSlug(data: Record<string, unknown>, filePath: string): string {
  if (typeof data.slug === "string" && data.slug) return data.slug;
  return path.basename(filePath).replace(/\.(md|mdx)$/, "");
}

export function findMissingPostImages(postsDir: string = path.join(contentDir(), "blog")): MissingPostImage[] {
  if (!fs.existsSync(postsDir)) return [];
  const missing: MissingPostImage[] = [];
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));

  for (const file of files) {
    const filePath = path.join(postsDir, file);
    const source = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(source);
    const slug = canonicalPostSlug(data, filePath);
    const refs: MediaReference[] = [];
    if (typeof data.cover === "string" && data.cover) {
      refs.push({ file: path.relative(process.cwd(), filePath), field: "cover", url: data.cover });
    }
    for (const url of extractImageUrls(content)) {
      refs.push({ file: path.relative(process.cwd(), filePath), field: "body", url });
    }

    for (const ref of refs) {
      if (!isLocalImageUrl(ref.url)) continue;
      const imagePath = localImagePath(ref.url);
      if (!imagePath || !fs.existsSync(imagePath)) {
        missing.push({ slug, file: ref.file, field: ref.field, url: ref.url });
      }
    }
  }

  return missing;
}
