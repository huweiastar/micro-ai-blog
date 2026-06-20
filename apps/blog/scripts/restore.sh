#!/usr/bin/env bash
#
# micro-ai-blog 备份恢复：与 scripts/backup.sh 配对。
# 把某个备份 tar 包还原到目标目录的 content/ data/ public/images/。
#
# 用法：
#   scripts/restore.sh                      # 还原最新一份备份到 APP_DIR（交互确认）
#   scripts/restore.sh <tar 路径>           # 还原指定备份
#   scripts/restore.sh <tar 路径> <目标目录> # 还原到指定目录（如全新机器演练）
#   FORCE=1 scripts/restore.sh ...          # 跳过覆盖确认
#
# 关键点：backup.sh 排除了正在写入的 data/blog.db，改为打包一致性副本
# data/blog.db.bak。本脚本在还原后把 blog.db.bak 落位成 blog.db。
#
set -euo pipefail

APP_DIR="/home/ubuntu/projects/micro-ai-blog"
BACKUP_DIR="/home/ubuntu/backups/micro-ai-blog"

ARCHIVE="${1:-}"
TARGET="${2:-$APP_DIR}"

# 未指定归档：取 BACKUP_DIR 下最新的 blog-*.tar.gz
if [ -z "$ARCHIVE" ]; then
  ARCHIVE="$(ls -1t "$BACKUP_DIR"/blog-*.tar.gz 2>/dev/null | head -1 || true)"
  if [ -z "$ARCHIVE" ]; then
    echo "错误：未指定备份且 $BACKUP_DIR 下没有 blog-*.tar.gz" >&2
    exit 1
  fi
  echo "使用最新备份：$ARCHIVE"
fi

if [ ! -f "$ARCHIVE" ]; then
  echo "错误：备份文件不存在：$ARCHIVE" >&2
  exit 1
fi

# 校验 tar 完整性
if ! tar tzf "$ARCHIVE" >/dev/null 2>&1; then
  echo "错误：备份文件损坏或不是有效的 tar.gz：$ARCHIVE" >&2
  exit 1
fi

mkdir -p "$TARGET"

# 目标已有数据时确认（避免误覆盖线上）
if [ "${FORCE:-0}" != "1" ] && [ -e "$TARGET/data/blog.db" ]; then
  echo "警告：$TARGET/data/blog.db 已存在，恢复会覆盖 content/ data/ public/images/。"
  read -r -p "确认继续？输入 yes 继续：" ans
  [ "$ans" = "yes" ] || { echo "已取消。"; exit 1; }
fi

echo "[$(date -Is)] 解包 $ARCHIVE → $TARGET"
tar xzf "$ARCHIVE" -C "$TARGET"

# blog.db.bak 落位成 blog.db（仅当备份里确有 .bak）
if [ -f "$TARGET/data/blog.db.bak" ]; then
  mv -f "$TARGET/data/blog.db.bak" "$TARGET/data/blog.db"
  # 清理可能残留的 WAL/SHM，避免与新还原的 db 不匹配
  rm -f "$TARGET/data/blog.db-wal" "$TARGET/data/blog.db-shm"
  echo "已从 blog.db.bak 还原 SQLite 数据库。"
else
  echo "提示：备份内未含 blog.db.bak，数据库未还原（仅文件内容已还原）。" >&2
fi

echo "[$(date -Is)] 恢复完成。建议接着执行：npm install --no-audit --no-fund && ./deploy.sh"
