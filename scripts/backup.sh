#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# micro-ai-blog PostgreSQL 每日备份脚本
#
# 由 cron 调用（示例）：
#   0 3 * * * /home/ubuntu/projects/micro-ai-blog/scripts/backup.sh
#
# 行为：
#   1. 从仓库根 .env.local 读取 DATABASE_URL
#   2. 用 pg_dump -Fc (custom format) 导出 PostgreSQL
#   3. gzip 压缩后落到 BACKUP_DIR（默认 ~/backups/micro-ai-blog）
#   4. 保留最近 BACKUP_RETENTION_DAYS 天，自动清理旧文件
#   5. 追加日志到 BACKUP_DIR/backup.log
#
# 可选环境变量：
#   DATABASE_URL        数据库连接串（优先，来自 .env.local）
#   BACKUP_DIR          备份存放目录（默认 ~/backups/micro-ai-blog）
#   BACKUP_RETENTION_DAYS 保留天数（默认 7）
#   BACKUP_RCLONE_REMOTE 若设置，备份后自动 rclone 推送到远端（如 qiniu:micro-ai-backups）
# -----------------------------------------------------------------------------

set -euo pipefail

REPO_ROOT="/home/ubuntu/projects/micro-ai-blog"
ENV_FILE="${REPO_ROOT}/.env.local"

# ---------- 读取 DATABASE_URL ----------
if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a
    # 只提取 DATABASE_URL 行，忽略其它变量（避免 source 整个 .env.local 副作用）
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d'=' -f2- | sed 's/^["'\''"]//;s/["'\''"]$//')"
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[ERROR] DATABASE_URL 未配置（不在环境中，也未在 $ENV_FILE 找到）" >&2
  exit 1
fi

# ---------- 目录 / 保留策略 ----------
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/micro-ai-blog}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/pg-${TIMESTAMP}.dump.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "$BACKUP_DIR"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE"
}

# ---------- 执行备份 ----------
log "=== backup start ==="
log "DATABASE_URL = $(echo "$DATABASE_URL" | sed -E 's#://[^@]+@#://***@#;s#:[0-9]+/#:/#')"

if pg_dump -Fc -Z 0 "$DATABASE_URL" | gzip > "$BACKUP_FILE"; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log "✓ dump 成功 → $BACKUP_FILE ($SIZE)"
else
  log "✗ pg_dump 失败，退出码 $?"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# ---------- 异地推送（可选） ----------
if [[ -n "${BACKUP_RCLONE_REMOTE:-}" ]]; then
  if command -v rclone >/dev/null 2>&1; then
    if rclone copy "$BACKUP_FILE" "$BACKUP_RCLONE_REMOTE"; then
      log "✓ rclone 推送成功 → $BACKUP_RCLONE_REMOTE"
    else
      log "✗ rclone 推送失败（本地备份仍保留）"
    fi
  else
    log "⚠ rclone 未安装，跳过异地推送"
  fi
fi

# ---------- 清理旧备份 ----------
DELETED=$(find "$BACKUP_DIR" -maxdepth 1 -name 'pg-*.dump.gz' -type f -mtime +"$BACKUP_RETENTION_DAYS" -print -delete | wc -l)
log "清理 ${DELETED} 个超过 ${BACKUP_RETENTION_DAYS} 天的旧备份"

log "=== backup done ==="
