import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { dataDir } from "./paths";

// 缓存挂在 globalThis 上：next dev 热重载会重新执行模块，模块级变量会丢失旧连接
// 导致句柄泄漏，globalThis 跨热重载存活（与 Prisma 官方推荐的单例模式一致）。
const globalForDb = globalThis as typeof globalThis & {
  __blogDb?: Database.Database;
};

/**
 * SQLite 单例连接。所有运行时可变数据（PV/UV、点赞）存放于 data/blog.db，
 * 替代原先整文件读写的 analytics.json / likes.json：事务原子、无并发丢写。
 * 测试可通过 BLOG_DB_PATH 指向临时库。
 */
export function getDb(): Database.Database {
  if (globalForDb.__blogDb) return globalForDb.__blogDb;
  const dbPath =
    process.env.BLOG_DB_PATH || path.join(dataDir(), "blog.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  migrate(db);
  globalForDb.__blogDb = db;
  return db;
}

export function closeDb(): void {
  if (globalForDb.__blogDb) {
    globalForDb.__blogDb.close();
    globalForDb.__blogDb = undefined;
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
    -- 趋势查询按「路径 + 时间窗」过滤，复合索引避免全表扫描
    CREATE INDEX IF NOT EXISTS idx_events_path_time ON page_view_events (path, viewed_at);
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
    -- 会话版本号等认证状态（key-value）。版本号 +1 = 吊销所有已签发会话
    CREATE TABLE IF NOT EXISTS auth_kv (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    -- 登录失败计数与锁定（ip='__global__' 行为全局滑动窗口计数）
    CREATE TABLE IF NOT EXISTS login_attempts (
      ip           TEXT PRIMARY KEY,
      fail_count   INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0,
      window_start INTEGER NOT NULL DEFAULT 0
    );
  `);
}
