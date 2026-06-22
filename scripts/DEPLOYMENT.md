# API 服务环境变量配置

## 必需的环境变量

### 数据库连接
```bash
# ⚠️ 请勿在仓库内提交真实密码。配置到 .env.local（已 gitignore）：
# apps/api/.env.local 中设置：
DATABASE_URL=postgresql://blog:<替换为强密码>@localhost:5432/micro_ai_blog
```

### API 服务端口
```bash
API_PORT=3010
```

## 部署步骤

### 1. 创建 PostgreSQL 数据库
```bash
# 在生产环境用强密码替换 <STRONG_PASSWORD>
sudo -u postgres psql -c "CREATE USER blog WITH PASSWORD '<STRONG_PASSWORD>';"
sudo -u postgres psql -c "CREATE DATABASE micro_ai_blog OWNER blog;"
sudo -u postgres psql -d micro_ai_blog -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# 把密码写入 apps/api/.env.local（不要提交到 git）
echo "DATABASE_URL=postgresql://blog:<STRONG_PASSWORD>@localhost:5432/micro_ai_blog" >> apps/api/.env.local
```

### 2. 运行数据库迁移
```bash
# 确保 apps/api/.env.local 中已配置 DATABASE_URL
npm run migrate -w @app/api
```

### 3. 启动 API 服务
```bash
# 开发模式
npm run dev -w @app/api

# 生产模式
npm run build -w @app/api
npm run start -w @app/api
```

### 4. 配置 systemd 服务（生产环境）
```bash
# 复制 service 文件
sudo cp scripts/micro-ai-api.service /etc/systemd/system/

# 重载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start micro-ai-api
sudo systemctl enable micro-ai-api

# 查看状态
sudo systemctl status micro-ai-api
```

### 5. 配置 nginx 反向代理
```bash
# 编辑 nginx 配置
sudo vim /etc/nginx/sites-available/micro-ai-blog

# 在 server 块中添加 scripts/nginx-api-proxy.conf 的内容

# 测试配置
sudo nginx -t

# 重载 nginx
sudo systemctl reload nginx
```

### 6. 验证部署
```bash
# 测试健康检查
curl http://localhost:3010/health

# 测试 API 端点
curl http://localhost:3010/api/posts | jq
curl http://localhost:3010/api/categories | jq
curl http://localhost:3010/api/archive | jq

# 通过 nginx 测试
curl https://yourdomain.com/api/posts | jq
```

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DATABASE_URL | PostgreSQL 连接字符串 | 无（必需） |
| API_PORT | API 服务监听端口 | 3010 |
| NODE_ENV | 运行环境 | development |

## 日志查看

```bash
# 查看 systemd 服务日志
sudo journalctl -u micro-ai-api -f

# 查看应用日志文件
tail -f /var/log/micro-ai-api.log
```

## 常见问题

### 数据库连接失败
检查 PostgreSQL 是否运行：
```bash
sudo systemctl status postgresql
```

### 端口被占用
修改 API_PORT 环境变量，或停止占用端口的服务：
```bash
sudo lsof -i :3010
sudo kill <PID>
```

### nginx 502 Bad Gateway
检查 API 服务是否运行：
```bash
sudo systemctl status micro-ai-api
curl http://localhost:3010/health
```
