import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { findMediaReferences } from "../../../../lib/content-media";
import { s3Configured, listImages, deleteImage, keyFromUrl } from "../../../../lib/storage";

export const dynamic = "force-dynamic";

const IMAGES_ROOT = path.join(process.cwd(), "public", "images");
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp"]);

type MediaItem = {
  url: string;
  name: string;
  dir: string; // 相对 images 的子目录（如 blog/da-shu-ju/xxx）
  size: number;
  mtime: number;
};

function walk(dir: string, items: MediaItem[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, items);
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      const rel = path.relative(IMAGES_ROOT, full).split(path.sep).join("/");
      const stat = fs.statSync(full);
      items.push({
        url: `/images/${rel}`,
        name: entry.name,
        dir: path.dirname(rel) === "." ? "" : path.dirname(rel),
        size: stat.size,
        mtime: stat.mtimeMs,
      });
    }
  }
}

export async function GET() {
  const items: MediaItem[] = [];

  // 本地文件列出
  if (fs.existsSync(IMAGES_ROOT)) {
    walk(IMAGES_ROOT, items);
  }

  // S3 配置时追加对象存储列表
  if (s3Configured()) {
    try {
      const s3Items = await listImages();
      items.push(...s3Items);
    } catch {
      // S3 列表失败不阻断响应，仍返回本地列表
    }
  }

  // 去重（同一文件可能在两处）并按 mtime 排序
  const deduped = new Map<string, MediaItem>();
  for (const item of items) {
    const existing = deduped.get(item.url);
    if (!existing || item.mtime > existing.mtime) {
      deduped.set(item.url, item);
    }
  }

  const result = Array.from(deduped.values());
  result.sort((a, b) => b.mtime - a.mtime);
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  try {
    const { url, force } = await req.json();
    if (!url || typeof url !== "string" || !url.startsWith("/images/") || url.includes("..")) {
      return NextResponse.json({ error: "无效的图片路径" }, { status: 400 });
    }
    if (!IMAGE_EXTS.has(path.extname(url).toLowerCase())) {
      return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
    }

    // 引用检查：无论 S3 还是本地都需要
    const references = findMediaReferences(url);
    if (references.length > 0 && !force) {
      return NextResponse.json(
        {
          error: "图片仍被内容引用，不能直接删除",
          references,
        },
        { status: 409 }
      );
    }

    // 判断是 S3 还是本地
    const s3Key = keyFromUrl(url);
    if (s3Key) {
      // S3 删除
      await deleteImage(s3Key);
    } else {
      // 本地删除
      const target = path.resolve(process.cwd(), "public", "." + url);
      // 双重确认：解析后的真实路径必须仍在 images 根目录内，杜绝路径穿越。
      if (!target.startsWith(IMAGES_ROOT + path.sep)) {
        return NextResponse.json({ error: "非法路径" }, { status: 400 });
      }
      if (!fs.existsSync(target)) {
        return NextResponse.json({ error: "文件不存在" }, { status: 404 });
      }
      fs.unlinkSync(target);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
