/**
 * 站点数据库备份：对 data/blog.db 做在线一致性快照（自动合并 WAL，不阻塞读写），
 * 本地轮转保留最近 N 份；若配置了 rclone 远端则推送到异地，补齐"服务器损坏不丢数据"。
 *
 * 用法：
 *   npm run backup:db                 # 仅本地快照到 data/backups/
 *   BACKUP_RCLONE_REMOTE=qiniu:bucket/blog npm run backup:db   # 同时推送异地
 *
 * 环境变量：
 *   BLOG_DB_PATH           数据库路径（默认 data/blog.db）
 *   BACKUP_DIR             本地快照目录（默认 data/backups）
 *   BACKUP_KEEP            本地保留份数（默认 14）
 *   BACKUP_RCLONE_REMOTE   rclone 远端，如 "qiniu:my-bucket/blog-db"；不设则跳过异地
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const DB_PATH =
  process.env.BLOG_DB_PATH || path.join(process.cwd(), "data", "blog.db");
const OUT_DIR =
  process.env.BACKUP_DIR || path.join(process.cwd(), "data", "backups");
const KEEP = Number(process.env.BACKUP_KEEP || 14);
const REMOTE = process.env.BACKUP_RCLONE_REMOTE;

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`[backup] 数据库不存在: ${DB_PATH}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(OUT_DIR, `blog-${stamp}.db`);

  const db = new Database(DB_PATH);
  await db.backup(dest); // 在线一致性快照（含 WAL）
  db.close();

  const sizeKb = (fs.statSync(dest).size / 1024).toFixed(0);
  console.log(`[backup] 本地快照 -> ${dest} (${sizeKb} KB)`);

  // 轮转：仅保留最近 KEEP 份
  const files = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.startsWith("blog-") && f.endsWith(".db"))
    .sort();
  for (const f of files.slice(0, Math.max(0, files.length - KEEP))) {
    fs.unlinkSync(path.join(OUT_DIR, f));
    console.log(`[backup] 清理旧快照 ${f}`);
  }

  if (REMOTE) {
    try {
      execFileSync("rclone", ["copy", dest, REMOTE, "--no-traverse"], {
        stdio: "inherit",
      });
      console.log(`[backup] 已推送异地 -> ${REMOTE}`);
    } catch (e) {
      console.error(`[backup] 异地推送失败:`, (e as Error).message);
      process.exit(2);
    }
  } else {
    console.log(
      "[backup] 未配置 BACKUP_RCLONE_REMOTE，仅本地快照（异地备份建议配置 rclone）"
    );
  }
}

main().catch((e) => {
  console.error("[backup] 失败:", e);
  process.exit(1);
});
