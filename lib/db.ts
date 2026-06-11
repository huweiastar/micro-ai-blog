import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db: Database.Database | null = null;

/**
 * SQLite 单例连接。所有运行时可变数据（PV/UV、点赞）存放于 data/blog.db，
 * 替代原先整文件读写的 analytics.json / likes.json：事务原子、无并发丢写。
 * 测试可通过 BLOG_DB_PATH 指向临时库。
 */
export function getDb(): Database.Database {
  if (db) return db;
  const dbPath =
    process.env.BLOG_DB_PATH || path.join(process.cwd(), "data", "blog.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function migrate(d: Database.Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS path_stats (
      path       TEXT PRIMARY KEY,
      pv         INTEGER NOT NULL DEFAULT 0,
      uv         INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS path_visitors (
      path       TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      PRIMARY KEY (path, visitor_id)
    );
    -- 带时间戳的明细事件：为后台「最近 N 天趋势」预留，当前只写不读
    CREATE TABLE IF NOT EXISTS page_view_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      path       TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      viewed_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_viewed_at ON page_view_events (viewed_at);
    CREATE TABLE IF NOT EXISTS likes (
      slug       TEXT PRIMARY KEY,
      count      INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS like_voters (
      slug       TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      PRIMARY KEY (slug, visitor_id)
    );
  `);
}
