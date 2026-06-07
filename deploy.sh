#!/usr/bin/env bash
#
# micro-ai-blog 蓝绿部署脚本
#
# 设计目标：修改源码后一条命令安全发布，绝不出现"页面崩坏"。
#   1. 先把生产构建输出到独立的 staging 目录（.next.build），
#      整个构建过程中线上正在使用的 .next 完全不受影响。
#   2. 只有构建“完全成功”才停服务 → 原子切换目录 → 启服务。
#   3. 切换前先做 `rm -rf` 清理，避免 webpack 缓存损坏。
#   4. 新版本若 30s 内起不来，自动回滚到上一个版本（保存在 .next.old）。
#   5. 构建失败则直接退出，线上原封不动。
#
# 用法：  ./deploy.sh
#
set -euo pipefail

APP_DIR="/home/ubuntu/projects/micro-ai-blog"
SERVICE="micro-ai-blog"
SITE_URL="https://huweiastar.deepai.icu"
PORT=3000

BUILD_DIR=".next.build"   # staging：本次构建输出
LIVE_DIR=".next"          # 线上正在使用
OLD_DIR=".next.old"       # 上一个版本，用于回滚

cd "$APP_DIR"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m✗  %s\033[0m\n' "$*" >&2; }

# --- 1. 依赖 ---
log "安装依赖（如有变化）..."
npm install --no-audit --no-fund

# --- 2. 构建到 staging 目录（线上不受影响）---
log "清理旧的 staging 构建..."
rm -rf "$BUILD_DIR"

log "生产构建 → $BUILD_DIR（线上 $SITE_URL 全程正常）..."
if ! NEXT_DIST_DIR="$BUILD_DIR" NEXT_PUBLIC_SITE_URL="$SITE_URL" NODE_ENV=production npm run build; then
  err "构建失败，线上站点未做任何改动。请修复后重试。"
  rm -rf "$BUILD_DIR"
  exit 1
fi

# --- 3. 原子切换 + 重启 ---
log "构建成功，切换到新版本..."
sudo systemctl stop "$SERVICE"
rm -rf "$OLD_DIR"
[ -d "$LIVE_DIR" ] && mv "$LIVE_DIR" "$OLD_DIR"
mv "$BUILD_DIR" "$LIVE_DIR"
sudo systemctl start "$SERVICE"

# --- 4. 健康检查，失败则回滚 ---
log "等待服务就绪..."
ok=0
for _ in $(seq 1 30); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT" || true)" = "200" ]; then
    ok=1; break
  fi
  sleep 1
done

if [ "$ok" = 1 ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL" || echo "???")
  log "部署成功 ✅  $SITE_URL  (公网 HTTPS -> HTTP $code)"
else
  err "新版本 30s 内未返回 200，自动回滚到上一个版本..."
  sudo systemctl stop "$SERVICE"
  rm -rf "$LIVE_DIR"
  if [ -d "$OLD_DIR" ]; then
    mv "$OLD_DIR" "$LIVE_DIR"
    sudo systemctl start "$SERVICE"
    err "已回滚到上一个版本。排查：sudo journalctl -u $SERVICE -n 50"
  else
    err "没有可回滚的旧版本！服务未启动，请手动检查。"
  fi
  exit 1
fi
