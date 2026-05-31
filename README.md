# 微观 AI

个人技术博客系统，聚焦大数据开发与大模型数据工程方向。支持 Markdown 文章发布、分类管理、全文搜索、SEO 优化、评论互动，并内置管理后台和 AI 智能问答助手。

## 在线演示

<!-- 项目徽章（替换 huweiastar/micro-ai-blog 为你的仓库名） -->

<div align="center">

[![Stars](https://img.shields.io/github/stars/huweiastar/micro-ai-blog?style=flat\&logo=github\&labelColor=333\&color=blue)](https://github.com/huweiastar/micro-ai-blog/stargazers)
[![Forks](https://img.shields.io/github/forks/huweiastar/micro-ai-blog?style=flat\&logo=github\&labelColor=333\&color=blue)](https://github.com/huweiastar/micro-ai-blog/network/members)
[![Language](https://img.shields.io/badge/language-TypeScript-3178c6?style=flat\&labelColor=333)](https://github.com/huweiastar/micro-ai-blog)
[![License](https://img.shields.io/github/license/huweiastar/micro-ai-blog?style=flat\&labelColor=333)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat\&logo=next.js\&labelColor=000)](https://nextjs.org/)

</div>

### 快速上手

### 环境要求

| 工具                             | 版本要求              |
| ------------------------------ | ----------------- |
| [Node.js](https://nodejs.org/) | ≥ 18.17           |
| npm                            | ≥ 9（随 Node.js 自带） |

### 3 分钟启动

```bash
# 1. 克隆仓库
git clone https://github.com/huweiastar/micro-ai-blog.git
cd ai-tech-blog

# 2. 安装依赖
npm install

# 3. 复制环境变量文件（仅需 ADMIN_PASSWORD 即可跑起来）
cp .env.example .env.local

# 4. 启动开发服务器
npm run dev
```

打开 <http://localhost:3000> 即可看到博客首页。

> **最简配置**: `.env.local` 中只需填写 `ADMIN_PASSWORD=你的密码`，其余变量留空或保持默认值即可正常浏览和编写文章。AI 助手、评论系统、飞书导入等功能需额外配置，见 [环境变量](#环境变量) 章节。

### 常用命令

```bash
npm run dev          # 启动开发服务器（http://localhost:3000）
npm run build        # 构建生产版本（自动预生成搜索索引/sitemap/RSS）
npm start            # 启动生产服务器
npm run lint         # ESLint 检查
npm run type-check   # TypeScript 类型检查
npm run format       # Prettier 格式化代码
npm run check:content # 校验内容文件格式
```

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS
- **内容管理**: Markdown / MDX
- **内容解析**: gray-matter + remark + rehype + shiki (代码高亮)
- **搜索方案**: Fuse.js
- **评论系统**: Giscus
- **部署平台**: Vercel

## 功能特性

### 内容展示

- Markdown 文章发布，支持 frontmatter 元数据
- 文章分类、标签、归档、时间线
- 全文搜索（本地 Fuse.js 索引）
- 代码高亮（shiki，支持 Python、SQL、Shell、Java、Scala、JS/TS 等）
- 自动生成文章目录 TOC
- 阅读时间统计 & 字数统计
- 上一篇 / 下一篇导航 & 相关文章推荐
- 项目展示卡片（技术栈、亮点、GitHub/演示链接）

### 管理后台 (`/admin`)

- 个人信息管理（头像、简介、社交链接）
- 专栏管理（增删改、主题背景/渐变设置）
- 项目管理（增删改、封面、详情、技术栈）
- 主题设置（全局渐变、背景图、暗色模式）
- 写文章 / 发布文章

### AI 功能

- 站内知识问答助手（支持 DashScope / Anthropic / OpenAI / 自定义模型）
- 飞书文章导入（自动同步到博客）

### 工程化

- 响应式布局（桌面 / 平板 / 移动端）
- SEO 优化（sitemap、RSS、robots.txt、Open Graph）
- 自动生成搜索索引、站点地图、RSS 订阅

## 目录结构

```
blog/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx            # 首页
│   ├── page.client.tsx     # 首页客户端组件
│   ├── layout.tsx          # 根布局
│   ├── globals.css         # 全局样式
│   ├── admin/              # 管理后台（登录、仪表盘、写文章）
│   ├── api/                # API 路由
│   │   ├── admin/          # 管理接口（重建索引）
│   │   ├── assistant/      # AI 问答接口
│   │   ├── auth/           # 认证登录
│   │   ├── categories/     # 专栏管理
│   │   ├── config/         # 站点配置
│   │   ├── feishu/         # 飞书导入
│   │   ├── projects/       # 项目管理
│   │   ├── publish/        # 文章发布
│   │   ├── stats/          # 统计数据
│   │   ├── theme/          # 主题设置
│   │   └── upload/         # 文件上传
│   ├── blog/               # 博客列表和详情
│   ├── categories/         # 分类浏览
│   ├── tags/               # 标签浏览
│   ├── archive/            # 归档时间线
│   ├── projects/           # 项目展示
│   ├── search/             # 搜索页面
│   ├── about/              # 关于我
│   └── footprint/          # 足迹
├── components/             # 可复用组件
│   ── ui/                 # UI 组件（Avatar、ParticleNetwork 等）
── config/                 # 站点配置
├── content/                # 内容数据
│   ├── blog/               # 博客文章 (Markdown)
│   └── projects/           # 项目数据 (YAML)
├── hooks/                  # 自定义 Hooks
├── lib/                    # 工具函数
│   ├── assistant/          # AI 助手逻辑
│   └── ...
├── public/                 # 静态资源
│   └── images/             # 图片资源（头像、上传文件等）
├── scripts/                # 构建脚本
│   ├── generate-search-index.ts
│   ├── generate-sitemap.ts
│   ├── generate-rss.ts
│   └── generate-knowledge-index.ts
└── types/                  # TypeScript 类型定义
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填入配置：

```bash
cp .env.example .env.local
```

```env
# 站点配置
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=AI-Tech-Blog

# 管理后台密码
ADMIN_PASSWORD=your-password

# Giscus 评论系统
NEXT_PUBLIC_GISCUS_REPO=your-name/your-blog
NEXT_PUBLIC_GISCUS_REPO_ID=xxx
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=xxx

# AI 聊天机器人（可选）
AI_PROVIDER=dashscope          # dashscope | anthropic | openai | custom
AI_API_KEY=your-api-key
AI_API_BASE_URL=               # 留空自动匹配供应商
AI_MODEL=qwen-plus             # qwen-plus / claude-sonnet-4-6 / etc.

# 飞书开放平台（可选）
FEISHU_APP_ID=your-feishu-app-id
FEISHU_APP_SECRET=your-feishu-app-secret
```

> 所有带 **（可选）** 标记的变量不填也不影响项目运行，仅影响对应功能。

## 文章编写

1. 在 `content/blog/` 目录下创建 `.md` 或 `.mdx` 文件
2. 使用 frontmatter 定义元数据
3. 文件名使用英文短横线命名（如 `my-first-post.mdx`）

```yaml
---
title: "文章标题"
date: "2026-05-28"
updated: "2026-05-28"
summary: "文章摘要"
tags: ["标签1", "标签2"]
category: "分类名称"
draft: false
cover: "/images/blog/cover.png"
---
```

编写完成后运行 `npm run build` 验证索引是否正常更新。

## 部署

### Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 在 [Vercel](https://vercel.com) 导入仓库
3. 在 Settings → Environment Variables 中配置 `.env.local` 的变量
4. 点击 **Deploy**

Vercel 会在每次 push 到主分支时自动构建并部署。

### 其他平台

本项目为标准 Next.js 应用，可部署到任何支持 Node.js 的平台：

- **Docker**: 使用 `npm run build && npm start` 构建镜像
- **自建服务器**: `npm run build` 后用 `npm start` 或 PM2 管理进程
- **其他 VPS**: 参考 Next.js 官方[自托管文档](https://nextjs.org/docs/pages/building-your-application/deploying#self-hosting)

### Star History

<div align="center">
  <a href="https://star-history.com/#huweiastar/micro-ai-blog&Date">
    <img src="https://api.star-history.com/svg?repos=huweiastar/micro-ai-blog&type=Date" alt="Star History Chart" width="600" />
  </a>
</div>

## License

MIT
