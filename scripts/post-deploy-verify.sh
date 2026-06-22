#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# 部署 + 验证一体化脚本
# 用途：代码 push 后在服务器上跑一次，完成部署并自动验证关键指标
# 用法：./scripts/post-deploy-verify.sh
# -----------------------------------------------------------------------------

set -euo pipefail

SITE="https://huweiastar.deepai.icu"
REPO="/home/ubuntu/projects/micro-ai-blog"
PASS=0
FAIL=0
WARN=0

# ---------- 彩色输出 ----------
green() { printf "\033[32m✓ %s\033[0m\n" "$*"; ((PASS++)) || true; }
red()   { printf "\033[31m✗ %s\033[0m\n" "$*"; ((FAIL++)) || true; }
yellow(){ printf "\033[33m⚠ %s\033[0m\n" "$*"; ((WARN++)) || true; }
info()  { printf "\033[36m→ %s\033[0m\n" "$*"; }

# ---------- 部署步骤 ----------
info "===== 步骤 1/4：拉代码 + 部署博客 ====="
cd "$REPO"
git pull --ff-only
./deploy.sh

info "===== 步骤 2/4：应用 nginx 配置 ====="
sudo cp scripts/nginx-micro-ai-blog.conf /etc/nginx/sites-available/micro-ai-blog
sudo nginx -t
sudo systemctl reload nginx

info "===== 步骤 3/4：应用 systemd 资源限制 ====="
sudo cp scripts/micro-ai-*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart micro-ai-blog micro-ai-manager micro-ai-api

info "===== 步骤 4/4：重装 API 依赖 ====="
npm install -w @app/api
sudo systemctl restart micro-ai-api

# 等待服务启动
info "等待服务启动（10s）..."
sleep 10

# ---------- 验证阶段 ----------
echo ""
info "===== 开始验证 ====="
echo ""

# 1. Server 头应隐藏版本号
info "[1/8] Server 头（应不含版本号）"
srv=$(curl -sI "$SITE/" | grep -i "^server:" | head -1)
if echo "$srv" | grep -qE "nginx/[0-9]"; then
  red "Server 仍暴露版本号：$srv"
else
  green "Server 头已隐藏版本号：$srv"
fi

# 2. 安全头齐全
info "[2/8] 安全响应头"
headers=$(curl -sI "$SITE/")
for h in "strict-transport-security" "x-frame-options" "content-security-policy" "referrer-policy" "x-content-type-options"; do
  if echo "$headers" | grep -qi "^$h:"; then
    green "存在 $h"
  else
    red "缺失 $h"
  fi
done

# 3. /health 返回 JSON
info "[3/8] /health 端点"
health=$(curl -s --max-time 5 "$SITE/health" 2>&1)
if echo "$health" | grep -q '"ok":true'; then
  green "/health 返回 JSON: $health"
else
  red "/health 异常: ${health:0:80}"
fi

# 4. Canonical URL 修复
info "[4/8] Canonical URL（子页面应指向自己）"
for path in about tags/LLM categories gallery; do
  canon=$(curl -s "$SITE/$path" | grep -oE 'canonical" href="[^"]*"' | head -1 | sed 's/.*href="//;s/"$//')
  expected="$SITE/$path"
  if [ "$canon" = "$expected" ]; then
    green "canonical /$path → $canon"
  else
    red "canonical /$path 错误：$canon（期望 $expected）"
  fi
done

# 5. 搜索页 noindex
info "[5/8] 搜索页 robots"
robots=$(curl -s "$SITE/search" | grep -oE 'robots" content="[^"]*"' | head -1)
if echo "$robots" | grep -q "noindex"; then
  green "搜索页 noindex: $robots"
else
  red "搜索页未 noindex: $robots"
fi

# 6. Sitemap URL 数量（应 ≥ 50）
info "[6/8] Sitemap URL 数量"
count=$(curl -s "$SITE/sitemap.xml" | grep -oE '<loc>[^<]+</loc>' | wc -l)
if [ "$count" -ge 50 ]; then
  green "sitemap 含 $count 条 URL"
else
  red "sitemap 仅 $count 条 URL（期望 ≥ 50）"
fi

# 7. CORS 白名单
info "[7/8] CORS 白名单"
evil=$(curl -sI -H "Origin: https://evil.com" "$SITE/api/posts" | grep -i "access-control-allow-origin:" | head -1)
friend=$(curl -sI -H "Origin: $SITE" "$SITE/api/posts" | grep -i "access-control-allow-origin:" | head -1)
if echo "$evil" | grep -q '"*"'; then
  red "CORS 仍允许任意 origin：$evil"
else
  green "CORS 拒绝恶意 origin：${evil:-（无 CORS 头）}"
fi
if echo "$friend" | grep -q "$SITE"; then
  green "CORS 允许本站 origin：$friend"
else
  yellow "CORS 未明确允许本站（可能影响跨域调用）：$friend"
fi

# 8. 博客后台可访问（不再 404）
info "[8/8] 博客后台可访问性"
admin_status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/admin/login" 2>&1)
if [ "$admin_status" = "200" ]; then
  green "博客后台 /admin/login 返回 200"
else
  red "博客后台 /admin/login 返回 $admin_status"
fi

# ---------- 汇总 ----------
echo ""
echo "======================================"
info "验证汇总：$PASS 通过 / $FAIL 失败 / $WARN 警告"
echo "======================================"

if [ "$FAIL" -gt 0 ]; then
  red "存在失败项，请检查部署"
  exit 1
else
  green "全部通过"
  exit 0
fi
