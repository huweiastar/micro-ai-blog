# micro-ai-blog API 架构文档

## 架构概览

本项目已从单体 Next.js 应用重构为前后端分离架构：

```
┌─────────────────┐
│   Next.js Blog  │  (apps/blog)
│   前端渲染层     │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐      ┌──────────────┐
│   Hono API      │◄────►│  PostgreSQL  │
│   (apps/api)    │      │  数据库      │
└─────────────────┘      └──────────────┘
```

## 目录结构

```
micro-ai-blog/
├── apps/
│   ├── api/           # Hono API 服务（新增）
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── schema.ts    # Drizzle ORM schema
│   │   │   │   └── index.ts     # 数据库连接
│   │   │   ├── routes/
│   │   │   │   └── public/      # 公开 API 端点
│   │   │   └── index.ts         # Hono 应用入口
│   │   └── package.json
│   │
│   ├── blog/          # Next.js 前端（现有）
│   └── manager/       # 管理后台（现有）
│
├── packages/
│   └── shared/        # 共享类型 + API client（新增）
│       └── src/
│           ├── types/     # TypeScript 类型定义
│           ├── schemas/   # Zod 验证 schema
│           └── api/       # API client
│
├── data/
│   └── migrations/    # 数据库迁移脚本
│       └── 0001_initial.sql
│
└── scripts/
    ├── migrate-to-pg.ts       # 数据迁移脚本
    ├── micro-ai-api.service   # systemd 服务文件
    ├── nginx-api-proxy.conf   # nginx 配置片段
    └── DEPLOYMENT.md          # 部署文档
```

## API 端点

### 公开端点（无需认证）

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/posts` | GET | 文章列表（分页、筛选、搜索） |
| `/api/posts/:slug` | GET | 文章详情 |
| `/api/posts/:slug/related` | GET | 相关文章 |
| `/api/categories` | GET | 分类列表 |
| `/api/categories/:slug/posts` | GET | 分类下的文章 |
| `/api/tags` | GET | 标签列表 |
| `/api/tags/:name/posts` | GET | 标签下的文章 |
| `/api/notes` | GET | 说说列表 |
| `/api/archive` | GET | 归档树 |
| `/api/projects` | GET | 项目列表 |
| `/api/projects/:slug` | GET | 项目详情 |
| `/api/friends` | GET | 友链列表 |
| `/api/gallery` | GET | 相册照片 |
| `/api/about` | GET | 关于页信息 |
| `/api/search` | GET | 全文搜索 |
| `/api/analytics/pageview` | POST | 记录页面访问 |
| `/api/analytics/stats` | GET | 访问统计 |
| `/api/analytics/overview` | GET | 概览数据 |
| `/api/likes/toggle` | POST | 点赞/取消点赞 |
| `/api/likes/:slug` | GET | 点赞数 |
| `/api/barrage` | GET/POST | 弹幕列表/发送 |

### 响应格式

```typescript
// 成功响应
{
  "ok": true,
  "data": { ... }
}

// 错误响应
{
  "ok": false,
  "error": "错误信息"
}
```

## 数据库 Schema

### 核心表

- **posts**: 文章（kind: post/note/chatter）
- **categories**: 分类
- **tags**: 标签
- **post_tags**: 文章-标签关联
- **projects**: 项目
- **friends**: 友链
- **gallery_photos**: 相册照片
- **site_profile**: 关于页信息
- **barrages**: 弹幕

### 统计相关表

- **path_stats**: 路径访问统计（PV/UV）
- **path_visitors**: 访客去重
- **page_view_events**: 访问事件流水
- **likes**: 点赞统计
- **like_voters**: 点赞去重

### 管理相关表

- **auth_kv**: 认证配置（session_version）
- **login_attempts**: 登录尝试记录
- **revisions**: 内容修订历史
- **media**: 媒体文件记录

### 全文搜索

- **search_index**: 使用 PostgreSQL tsvector + GIN 索引
- 自动触发器：文章更新时自动更新搜索索引

## 前端集成

### 使用 API Client

```typescript
import { api } from '@pkg/shared/api';

// 获取文章列表
const posts = await api.posts.list({ page: 1, limit: 10 });

// 获取文章详情
const post = await api.posts.get('my-post-slug');

// 获取归档数据
const archive = await api.archive.get();

// 记录页面访问
await api.analytics.recordPageView({
  path: '/blog/my-post',
  visitorId: 'unique-visitor-id',
});
```

### 类型安全

```typescript
import type { Post, Category, Tag } from '@pkg/shared/types';

const post: Post = await api.posts.get('slug');
```

## 开发指南

### 本地开发

```bash
# 1. 启动 PostgreSQL（如未运行）
sudo systemctl start postgresql

# 2. 启动 API 服务
npm run dev -w @app/api

# 3. 启动前端（另一个终端）
npm run dev -w @app/blog
```

### 添加新 API 端点

1. 在 `apps/api/src/routes/public/` 创建路由文件
2. 使用 Drizzle ORM 查询数据库
3. 返回标准响应格式 `{ ok: true, data: ... }`
4. 在 `apps/api/src/index.ts` 注册路由

示例：
```typescript
// apps/api/src/routes/public/articles.ts
import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { posts } from '../../db/schema.js';

export const articlesRoutes = new Hono();

articlesRoutes.get('/', async (c) => {
  const list = await db.query.posts.findMany();
  return c.json({ ok: true, data: { items: list } });
});

// apps/api/src/index.ts
import { articlesRoutes } from './routes/public/articles.js';
app.route('/api/articles', articlesRoutes);
```

### 数据库迁移

```bash
# 添加新列或表
# 1. 编辑 data/migrations/0001_initial.sql
# 2. 重新运行迁移
psql -U blog -d micro_ai_blog -f data/migrations/0001_initial.sql
```

## 部署

详见 [DEPLOYMENT.md](./scripts/DEPLOYMENT.md)

## 性能优化

### API 层

- **数据库连接池**: Drizzle ORM 自动管理
- **查询优化**: 使用索引（posts.slug, posts.published_at, tags.name）
- **全文搜索**: PostgreSQL tsvector + GIN 索引

### 前端层

- **ISR**: Next.js 增量静态生成
- **缓存**: API 响应缓存 60 秒
- **动画**: framer-motion 使用 GPU 加速

## 监控

```bash
# 查看 API 服务状态
sudo systemctl status micro-ai-api

# 查看日志
sudo journalctl -u micro-ai-api -f

# 健康检查
curl http://localhost:3010/health

# 数据库连接测试
psql -U blog -d micro_ai_blog -c "SELECT COUNT(*) FROM posts;"
```

## 回滚计划

如需回滚到旧架构：

1. 停止 API 服务：`sudo systemctl stop micro-ai-api`
2. 从 nginx 移除 `/api/` 代理配置
3. 前端回退到使用 `@pkg/content` 读取文件
4. 数据库保留作为备份（可导出为 JSON）

## 未来计划

- [ ] 管理端点（auth + admin CRUD）
- [ ] WebSocket 实时通知
- [ ] 图片上传到 S3/OSS
- [ ] API 限流（rate limiting）
- [ ] GraphQL 支持（可选）
