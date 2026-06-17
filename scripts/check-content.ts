import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { extractImageUrls, localImagePath } from "../lib/content-media";

const postsDirectory = path.join(process.cwd(), "content/blog");
let hasError = false;

function error(msg: string) {
  console.error(`❌ ${msg}`);
  hasError = true;
}

function success(msg: string) {
  console.log(`✅ ${msg}`);
}

// Check posts directory exists
if (!fs.existsSync(postsDirectory)) {
  error("content/blog directory does not exist");
  process.exit(1);
}

const files = fs.readdirSync(postsDirectory).filter((file) => {
  return file.endsWith(".md") || file.endsWith(".mdx");
});

if (files.length === 0) {
  error("No blog posts found in content/blog");
  process.exit(1);
}

success(`Found ${files.length} blog post(s)`);

const slugs = new Set<string>();
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

files.forEach((file) => {
  const filePath = path.join(postsDirectory, file);
  const source = fs.readFileSync(filePath, "utf-8");

  try {
    const { data, content } = matter(source);

    // Check required fields
    if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
      error(`${file}: title is required and must be a non-empty string`);
    }

    if (!data.date || !dateRegex.test(data.date)) {
      error(`${file}: date is required and must be in YYYY-MM-DD format`);
    }

    if (data.updated && !dateRegex.test(data.updated)) {
      error(`${file}: updated must be in YYYY-MM-DD format`);
    }

    if (!data.summary || typeof data.summary !== "string" || data.summary.trim() === "") {
      error(`${file}: summary is required and must be a non-empty string`);
    }

    if (!Array.isArray(data.tags)) {
      error(`${file}: tags must be an array`);
    }

    // 随手记（type: note）没有分类，仅常规文章要求 category
    if (data.type !== "note" && (!data.category || typeof data.category !== "string" || data.category.trim() === "")) {
      error(`${file}: category is required and must be a non-empty string`);
    }

    if (data.draft !== undefined && typeof data.draft !== "boolean") {
      error(`${file}: draft must be a boolean`);
    }

    // Check slug uniqueness
    const slug = file.replace(/\.(md|mdx)$/, "");
    if (slugs.has(slug)) {
      error(`${file}: duplicate slug "${slug}"`);
    }
    slugs.add(slug);

    // Check cover image exists
    if (data.cover) {
      const coverPath = localImagePath(data.cover) ?? path.join(process.cwd(), "public", data.cover);
      if (!fs.existsSync(coverPath)) {
        error(`${file}: cover image not found at ${data.cover}`);
      }
    }

    // Check local images referenced in Markdown body.
    const bodyImages = extractImageUrls(content).filter((url) => url.startsWith("/images/"));
    bodyImages.forEach((url) => {
      const imagePath = localImagePath(url);
      if (!imagePath || !fs.existsSync(imagePath)) {
        error(`${file}: body image not found at ${url}`);
      }
    });
  } catch (e) {
    error(`${file}: failed to parse frontmatter - ${e}`);
  }
});

if (hasError) {
  process.exit(1);
}

success("All content checks passed");
