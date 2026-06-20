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
#   6. 用 `npm ci` 按 lockfile 精确安装，避免分支间依赖漂移（如 Next14/16 混装）。
#   7. build 前清理跨版本残留的类型产物（.next.dev、.next/types），
#      防止 tsconfig include 把旧版本（如 Next16）的 validator.ts 拖进类型检查。
#      （2026-06-17 线上「排版乱了」事故的根因，见 incident 记忆）
#
# 用法：  ./deploy.sh
#
set -euo pipefail

APP_DIR="/home/ubuntu/projects/micro-ai-blog"
SERVICE="micro-ai-blog"
SITE_URL="https://huweiastar.deepai.icu"
PORT=3000

# monorepo：博客在 apps/blog；content/ data/ 在仓库根（共享，生产 SQLite 不动）。
# .next* 构建目录位于 apps/blog 下。
BLOG_DIR="apps/blog"
DIST_BUILD=".next.build"          # staging 目录名（相对 apps/blog 传给 next）
BUILD_DIR="$BLOG_DIR/$DIST_BUILD" # staging：本次构建输出
LIVE_DIR="$BLOG_DIR/.next"        # 线上正在使用
OLD_DIR="$BLOG_DIR/.next.old"     # 上一个版本，用于回滚

# ⚠️ 一次性：systemd 单元需指向 apps/blog 才能让 next start 找到 .next。
#   将 micro-ai-blog.service 改为以下之一（改后 sudo systemctl daemon-reload）：
#     A) WorkingDirectory=/home/ubuntu/projects/micro-ai-blog/apps/blog + ExecStart=.../next start -p 3000
#     B) WorkingDirectory=/home/ubuntu/projects/micro-ai-blog + ExecStart=npm run start -w @app/blog
#   运行时 CONTENT_DIR/DATA_DIR 由 apps/blog/next.config.mjs 自动注入（绝对路径），systemd 无需再设。

cd "$APP_DIR"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m✗  %s\033[0m\n' "$*" >&2; }

# --- 0. 部署前提示：明确这次发布的是哪个分支/提交（防止误发其它分支）---
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo '?')"
log "准备部署：分支 $BRANCH @ $COMMIT"

# --- 0.5 确保 apps/blog 能读到根 .env.local ---
# monorepo 下 Next 从 app 目录（apps/blog）加载 .env.local，而密钥文件在仓库根。
# 缺它会导致 ADMIN_PASSWORD/SESSION_SECRET/NEXT_PUBLIC_GISCUS 等在构建+运行时丢失。
if [ -f "$APP_DIR/.env.local" ] && [ ! -e "$BLOG_DIR/.env.local" ]; then
  ln -sf ../../.env.local "$BLOG_DIR/.env.local"
  log "已建 $BLOG_DIR/.env.local → 根 .env.local 符号链接"
fi

# --- 1. 依赖（按 lockfile 精确安装，避免分支间依赖漂移）---
log "按 lockfile 安装依赖（npm ci）..."
npm ci --no-audit --no-fund

# --- 2. 构建到 staging 目录（线上不受影响）---
log "清理旧的 staging 构建与跨版本残留类型产物..."
rm -rf "$BUILD_DIR"
# 删除可能由别的分支（如 Next16）构建/dev 留下的类型产物：tsconfig 的 include
# 会把这些目录里的 validator.ts 一起做类型检查，旧版本残留会让本次 build 失败。
# 这些目录仅用于构建/类型检查，运行时不依赖，删除对线上 .next 无影响。
rm -rf "$LIVE_DIR/types" "$BLOG_DIR/.next.dev"

log "生产构建 → $BUILD_DIR（线上 $SITE_URL 全程正常）..."
# NEXT_DIST_DIR 相对 apps/blog（next 以该目录为 cwd）；CONTENT_DIR/DATA_DIR 指向共享根，
# 供 prebuild 的独立 tsx 脚本读取（next 运行时另由 next.config 注入）。
if ! NEXT_DIST_DIR="$DIST_BUILD" CONTENT_DIR="$APP_DIR/content" DATA_DIR="$APP_DIR/data" \
     NEXT_PUBLIC_SITE_URL="$SITE_URL" NODE_ENV=production npm run build -w @app/blog; then
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
