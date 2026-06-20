#!/bin/bash
# 部署脚本 - 在服务器上执行
set -e

echo "🚀 开始部署 micro-ai-blog..."

# 1. 安装 Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 2. 安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo " 安装 PM2..."
    npm install -g pm2
fi

# 3. 克隆或更新代码
if [ -d "micro-ai-blog" ]; then
    echo "📥 更新代码..."
    cd micro-ai-blog
    git pull origin main
else
    echo "📥 克隆代码..."
    git clone https://github.com/huweiastar/micro-ai-blog.git
    cd micro-ai-blog
fi

# 4. 安装依赖
echo "📦 安装依赖..."
npm ci

# 5. 设置环境变量（如果 .env.local 不存在）
if [ ! -f ".env.local" ]; then
    echo "⚙️ 创建 .env.local..."
    cp .env.example .env.local
    echo "请编辑 .env.local 设置 ADMIN_PASSWORD 等变量"
fi

# 6. 构建项目
echo " 构建项目..."
npm run build

# 7. 启动/重启服务
echo "🔄 启动服务..."
pm2 stop micro-ai-blog 2>/dev/null || true
pm2 delete micro-ai-blog 2>/dev/null || true
pm2 start npm --name "micro-ai-blog" -- start
pm2 save
pm2 startup

echo "✅ 部署完成！"
echo "📊 查看状态: pm2 status"
echo "📝 查看日志: pm2 logs micro-ai-blog"
