import fs from "fs";
import path from "path";
import { dataDir } from "./paths";
import { atomicWriteFile } from "./atomic-file";

const REV_ROOT = path.join(dataDir(), "revisions");
const MAX_REVISIONS = 20;
// 与 /api/posts 一致：仅允许字母数字、下划线、短横、中文，杜绝路径穿越。
const SLUG_OK = /^[\w一-龥-]+$/;

function safeSlugDir(slug: string): string | null {
  if (!slug || !SLUG_OK.test(slug)) return null;
  return path.join(REV_ROOT, slug);
}

/** 保存文章前调用：把被替换的旧版本完整存为一份快照（含 frontmatter）。 */
export function snapshotPost(slug: string, rawContent: string): void {
  const dir = safeSlugDir(slug);
  if (!dir || !rawContent) return;
  try {
    fs.mkdirSync(dir, { recursive: true });
    atomicWriteFile(path.join(dir, `${Date.now()}.md`), rawContent);
    prune(dir);
  } catch {
    /* 快照失败不应阻断保存主流程 */
  }
}

function prune(dir: string): void {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort(); // 文件名是时间戳，升序即从旧到新
  while (files.length > MAX_REVISIONS) {
    const oldest = files.shift();
    if (oldest) {
      try {
        fs.unlinkSync(path.join(dir, oldest));
      } catch {
        /* ignore */
      }
    }
  }
}

export type RevisionMeta = { id: string; savedAt: number; size: number };

export function listRevisions(slug: string): RevisionMeta[] {
  const dir = safeSlugDir(slug);
  if (!dir || !fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const id = f.replace(/\.md$/, "");
      const stat = fs.statSync(path.join(dir, f));
      return { id, savedAt: Number(id) || stat.mtimeMs, size: stat.size };
    })
    .sort((a, b) => b.savedAt - a.savedAt);
}

export function readRevision(slug: string, id: string): string | null {
  const dir = safeSlugDir(slug);
  if (!dir || !/^\d+$/.test(id)) return null;
  const file = path.join(dir, `${id}.md`);
  if (!fs.existsSync(file)) return null;
  try {
    return fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }
}
