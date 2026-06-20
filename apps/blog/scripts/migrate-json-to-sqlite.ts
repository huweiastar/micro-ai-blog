/**
 * 一次性迁移：data/analytics.json + data/likes.json → data/blog.db。
 * 幂等：path_stats 非空即认为已迁移，直接退出，可重复执行。
 * 用法：npm run migrate:db
 */
import fs from "fs";
import path from "path";
import { dataDir } from "../lib/paths";
import { getDb, closeDb } from "../lib/db";

const GLOBAL_PATH = "__global__";

type JsonPathStats = {
  pv: number;
  uv: number;
  visitorIds: string[];
  updatedAt: string;
};

type JsonAnalytics = JsonPathStats & { paths: Record<string, JsonPathStats> };

type JsonLikes = {
  slugs: Record<string, { count: number; voterIds: string[]; updatedAt: string }>;
};

function readJson<T>(file: string): T | null {
  const p = path.join(dataDir(), file);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

const db = getDb();

const existing = db.prepare("SELECT COUNT(*) AS c FROM path_stats").get() as {
  c: number;
};
if (existing.c > 0) {
  console.log("path_stats 非空，疑似已迁移，跳过。如需重迁请先删除 data/blog.db。");
  closeDb();
  process.exit(0);
}

const insertStats = db.prepare(
  "INSERT INTO path_stats (path, pv, uv, updated_at) VALUES (?, ?, ?, ?)"
);
const insertVisitor = db.prepare(
  "INSERT OR IGNORE INTO path_visitors (path, visitor_id) VALUES (?, ?)"
);
const insertLike = db.prepare(
  "INSERT INTO likes (slug, count, updated_at) VALUES (?, ?, ?)"
);
const insertVoter = db.prepare(
  "INSERT OR IGNORE INTO like_voters (slug, visitor_id) VALUES (?, ?)"
);

const migrateAll = db.transaction(() => {
  const analytics = readJson<JsonAnalytics>("analytics.json");
  let pathCount = 0;
  if (analytics) {
    insertStats.run(GLOBAL_PATH, analytics.pv, analytics.uv, analytics.updatedAt);
    for (const id of analytics.visitorIds || []) insertVisitor.run(GLOBAL_PATH, id);
    for (const [p, s] of Object.entries(analytics.paths || {})) {
      insertStats.run(p, s.pv, s.uv, s.updatedAt);
      for (const id of s.visitorIds || []) insertVisitor.run(p, id);
      pathCount++;
    }
  }

  const likes = readJson<JsonLikes>("likes.json");
  let likeCount = 0;
  if (likes) {
    for (const [slug, l] of Object.entries(likes.slugs || {})) {
      insertLike.run(slug, l.count, l.updatedAt || new Date().toISOString());
      for (const id of l.voterIds || []) insertVoter.run(slug, id);
      likeCount++;
    }
  }

  console.log(
    `迁移完成：analytics ${analytics ? `全站 pv=${analytics.pv} uv=${analytics.uv}，路径 ${pathCount} 条` : "无文件"}；likes ${likeCount} 篇`
  );
});

migrateAll();
closeDb();
