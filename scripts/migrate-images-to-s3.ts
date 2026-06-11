/**
 * 存量图片迁移：public/images/{uploads,blog,column-bg} → 对象存储，
 * 并重写 content/ 下所有 .md/.mdx/.yaml 中的 /images/... 引用为 CDN URL。
 * 默认 dry-run 只打印计划；加 --apply 才真正执行。本地原文件保留，人工验证后再删。
 * 用法：npm run migrate:images [-- --apply]
 */
import fs from "fs";
import path from "path";
import { putImage, s3Configured } from "../lib/storage";

const MIGRATE_DIRS = ["uploads", "blog", "column-bg"];
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp"]);
const CONTENT_EXTS = new Set([".md", ".mdx", ".yaml", ".yml"]);
const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
};

const apply = process.argv.includes("--apply");
const root = process.cwd();
const imagesRoot = path.join(root, "public", "images");

function walkFiles(dir: string, filter: (f: string) => boolean, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, filter, out);
    else if (filter(full)) out.push(full);
  }
}

async function main(): Promise<void> {
  if (!s3Configured()) {
    console.error("S3 环境变量未配置完整，中止。");
    process.exit(1);
  }
  const base = (process.env.S3_PUBLIC_BASE_URL as string).replace(/\/$/, "");

  // 1. 收集并上传图片
  const files: string[] = [];
  for (const d of MIGRATE_DIRS) {
    walkFiles(
      path.join(imagesRoot, d),
      (f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()),
      files
    );
  }
  const mapping = new Map<string, string>(); // 旧本地 URL → 新 CDN URL
  for (const file of files) {
    const rel = path.relative(imagesRoot, file).split(path.sep).join("/");
    const key = `images/${rel}`;
    const newUrl = `${base}/${key}`;
    mapping.set(`/images/${rel}`, newUrl);
    if (apply) {
      const ext = path.extname(file).toLowerCase();
      await putImage(key, fs.readFileSync(file), CONTENT_TYPES[ext] || "application/octet-stream");
      console.log(`上传: ${key}`);
    } else {
      console.log(`[dry-run] 将上传: ${key} → ${newUrl}`);
    }
  }

  // 2. 重写 content/ 内引用
  const contentFiles: string[] = [];
  walkFiles(
    path.join(root, "content"),
    (f) => CONTENT_EXTS.has(path.extname(f).toLowerCase()),
    contentFiles
  );
  for (const file of contentFiles) {
    let text = fs.readFileSync(file, "utf-8");
    let hits = 0;
    for (const [oldUrl, newUrl] of Array.from(mapping.entries())) {
      if (text.includes(oldUrl)) {
        hits += text.split(oldUrl).length - 1;
        text = text.split(oldUrl).join(newUrl);
      }
    }
    if (hits > 0) {
      if (apply) fs.writeFileSync(file, text, "utf-8");
      console.log(`${apply ? "改写" : "[dry-run] 将改写"}: ${path.relative(root, file)}（${hits} 处）`);
    }
  }

  console.log(`\n共 ${files.length} 个文件${apply ? "已迁移" : "待迁移（加 --apply 执行）"}。本地原文件未删除。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
