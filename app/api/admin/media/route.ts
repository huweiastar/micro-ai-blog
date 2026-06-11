import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { findMediaReferences } from "../../../../lib/content-media";

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
  if (!fs.existsSync(IMAGES_ROOT)) return NextResponse.json([]);
  const items: MediaItem[] = [];
  walk(IMAGES_ROOT, items);
  items.sort((a, b) => b.mtime - a.mtime);
  return NextResponse.json(items);
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
    const target = path.resolve(process.cwd(), "public", "." + url);
    // 双重确认：解析后的真实路径必须仍在 images 根目录内，杜绝路径穿越。
    if (!target.startsWith(IMAGES_ROOT + path.sep)) {
      return NextResponse.json({ error: "非法路径" }, { status: 400 });
    }
    if (!fs.existsSync(target)) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }
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
    fs.unlinkSync(target);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
