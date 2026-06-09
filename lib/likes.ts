import fs from "fs";
import path from "path";

const likesPath = path.join(process.cwd(), "data", "likes.json");

type SlugLikes = {
  count: number;
  voterIds: string[];
  updatedAt: string;
};

type LikesData = {
  slugs: Record<string, SlugLikes>;
};

function ensureDataDir() {
  const dir = path.dirname(likesPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function read(): LikesData {
  ensureDataDir();
  if (!fs.existsSync(likesPath)) return { slugs: {} };
  try {
    const data = JSON.parse(fs.readFileSync(likesPath, "utf-8")) as LikesData;
    if (!data.slugs) data.slugs = {};
    return data;
  } catch {
    return { slugs: {} };
  }
}

function write(data: LikesData) {
  ensureDataDir();
  fs.writeFileSync(likesPath, JSON.stringify(data, null, 2), "utf-8");
}

/** 读取某篇文章的点赞数，以及指定访客是否已点赞。 */
export function getLikes(slug: string, visitorId?: string): { count: number; liked: boolean } {
  const entry = read().slugs[slug];
  if (!entry) return { count: 0, liked: false };
  return {
    count: entry.count,
    liked: visitorId ? entry.voterIds.includes(visitorId) : false,
  };
}

/** 切换点赞状态（同一访客点赞/取消）。返回最新计数与状态。 */
export function toggleLike(slug: string, visitorId: string): { count: number; liked: boolean } {
  const data = read();
  const entry =
    data.slugs[slug] ?? (data.slugs[slug] = { count: 0, voterIds: [], updatedAt: "" });

  const idx = entry.voterIds.indexOf(visitorId);
  let liked: boolean;
  if (idx >= 0) {
    entry.voterIds.splice(idx, 1);
    entry.count = Math.max(0, entry.count - 1);
    liked = false;
  } else {
    entry.voterIds.push(visitorId);
    entry.count += 1;
    liked = true;
    // 防止单篇 voterIds 无限膨胀（极端情况下截断旧记录）。
    if (entry.voterIds.length > 50000) {
      entry.voterIds = entry.voterIds.slice(-50000);
    }
  }
  entry.updatedAt = new Date().toISOString();
  write(data);
  return { count: entry.count, liked };
}
