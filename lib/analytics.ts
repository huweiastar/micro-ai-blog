import { getDb } from "./db";

// 全站汇总复用 path_stats 表，用伪路径一行存储，读写逻辑与普通路径一致。
const GLOBAL_PATH = "__global__";

export type PathAnalytics = {
  pv: number;
  uv: number;
  updatedAt: string;
};

export type AnalyticsSummary = {
  pv: number;
  uv: number;
  updatedAt: string;
  paths: Array<{ path: string; pv: number; uv: number; updatedAt: string }>;
};

type StatsRow = { pv: number; uv: number; updated_at: string };

function readStats(p: string): StatsRow | undefined {
  return getDb()
    .prepare("SELECT pv, uv, updated_at FROM path_stats WHERE path = ?")
    .get(p) as StatsRow | undefined;
}

export function getAnalytics(): { pv: number; uv: number } {
  const row = readStats(GLOBAL_PATH);
  return { pv: row?.pv ?? 0, uv: row?.uv ?? 0 };
}

export function getPathAnalytics(pagePath: string): PathAnalytics {
  const row = readStats(pagePath);
  return {
    pv: row?.pv ?? 0,
    uv: row?.uv ?? 0,
    updatedAt: row?.updated_at ?? new Date().toISOString(),
  };
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const db = getDb();
  const globalRow = readStats(GLOBAL_PATH);
  const rows = db
    .prepare(
      "SELECT path, pv, uv, updated_at FROM path_stats WHERE path != ? ORDER BY pv DESC"
    )
    .all(GLOBAL_PATH) as Array<{
    path: string;
    pv: number;
    uv: number;
    updated_at: string;
  }>;
  return {
    pv: globalRow?.pv ?? 0,
    uv: globalRow?.uv ?? 0,
    updatedAt: globalRow?.updated_at ?? new Date().toISOString(),
    paths: rows.map((r) => ({
      path: r.path,
      pv: r.pv,
      uv: r.uv,
      updatedAt: r.updated_at,
    })),
  };
}

function bumpPath(pagePath: string, visitorId: string, now: string): void {
  const db = getDb();
  const inserted = db
    .prepare("INSERT OR IGNORE INTO path_visitors (path, visitor_id) VALUES (?, ?)")
    .run(pagePath, visitorId);
  const uvDelta = inserted.changes > 0 ? 1 : 0;
  db.prepare(
    `INSERT INTO path_stats (path, pv, uv, updated_at) VALUES (?, 1, ?, ?)
     ON CONFLICT(path) DO UPDATE SET pv = pv + 1, uv = uv + ?, updated_at = ?`
  ).run(pagePath, uvDelta, now, uvDelta, now);
}

export function recordPageView(
  visitorId: string,
  pagePath: string
): { global: { pv: number; uv: number }; path: PathAnalytics } {
  const db = getDb();
  const now = new Date().toISOString();
  const txn = db.transaction(() => {
    db.prepare(
      "INSERT INTO page_view_events (path, visitor_id, viewed_at) VALUES (?, ?, ?)"
    ).run(pagePath, visitorId, now);
    bumpPath(GLOBAL_PATH, visitorId, now);
    bumpPath(pagePath, visitorId, now);
  });
  txn();
  return { global: getAnalytics(), path: getPathAnalytics(pagePath) };
}
