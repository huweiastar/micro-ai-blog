#!/usr/bin/env bash
#
# micro-ai-blog 每日备份：content/（文章）、data/（点赞/统计/快照）、public/images/（图片）。
# 本机保留 14 天；若配置了 rclone remote `blog-backup:` 则同步到异地。
# 注册 cron：0 3 * * * /home/ubuntu/projects/micro-ai-blog/scripts/backup.sh >> /home/ubuntu/backups/micro-ai-blog/backup.log 2>&1
#
set -euo pipefail

APP_DIR="/home/ubuntu/projects/micro-ai-blog"
BACKUP_DIR="/home/ubuntu/backups/micro-ai-blog"
KEEP_DAYS=14
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# SQLite 正在写入时直接 tar 可能拿到不一致快照，先用 .backup 导出一致副本（文件不存在则跳过）。
# sqlite3 CLI 缺失时退而求其次直接 cp（可能不一致，但好过备份里完全没有数据库）。
if [ -f "$APP_DIR/data/blog.db" ]; then
  if command -v sqlite3 >/dev/null; then
    sqlite3 "$APP_DIR/data/blog.db" ".backup '$APP_DIR/data/blog.db.bak'"
  else
    echo "[$(date -Is)] WARNING: sqlite3 CLI 缺失，降级为直接复制 db（快照可能不一致）" >&2
    cp "$APP_DIR/data/blog.db" "$APP_DIR/data/blog.db.bak"
  fi
fi

tar czf "$BACKUP_DIR/blog-$STAMP.tar.gz" \
  --exclude='data/blog.db' --exclude='data/blog.db-wal' --exclude='data/blog.db-shm' \
  -C "$APP_DIR" content data public/images

# 本机轮转
find "$BACKUP_DIR" -name 'blog-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

# 异地同步（可选）：rclone config 里存在名为 blog-backup 的 remote 才执行
if command -v rclone >/dev/null && rclone listremotes 2>/dev/null | grep -q '^blog-backup:'; then
  rclone copy "$BACKUP_DIR" blog-backup:micro-ai-blog-backups --max-age 48h
fi

echo "[$(date -Is)] backup ok: blog-$STAMP.tar.gz ($(du -h "$BACKUP_DIR/blog-$STAMP.tar.gz" | cut -f1))"
