# 微观 AI

<p align="center">
  <em>个人技术博客系统，聚焦大数据开发与大模型数据工程方向</em>
</p>

<p align="center">
  <a href="https://github.com/huweiastar/micro-ai-blog/stargazers">
    <img src="https://img.shields.io/github/stars/huweiastar/micro-ai-blog?style=flat&logo=github&labelColor=333&color=blue" alt="Stars" />
  </a>
  <a href="https://github.com/huweiastar/micro-ai-blog/network/members">
    <img src="https://img.shields.io/github/forks/huweiastar/micro-ai-blog?style=flat&logo=github&labelColor=333&color=blue" alt="Forks" />
  </a>
  <a href="https://github.com/huweiastar/micro-ai-blog">
    <img src="https://img.shields.io/badge/language-TypeScript-3178c6?style=flat&labelColor=333" alt="Language" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/huweiastar/micro-ai-blog?style=flat&labelColor=333" alt="License" />
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js&labelColor=000" alt="Next.js" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/支持-全文搜索-blue?style=flat&labelColor=333" />
  <img src="https://img.shields.io/badge/支持-SEO优化-green?style=flat&labelColor=333" />
  <img src="https://img.shields.io/badge/支持-AI问答-purple?style=flat&labelColor=333" />
  <img src="https://img.shields.io/badge/支持-管理后台-orange?style=flat&labelColor=333" />
  <img src="https://img.shields.io/badge/支持-暗色模式-yellow?style=flat&labelColor=333" />
</p>

---

## 项目简介

微观 AI 是一个使用 **Next.js 14 App Router** 构建的个人技术博客系统，面向大数据开发与大模型数据工程方向的技术分享。

核心亮点：

- 基于 **Markdown / MDX** 的内容驱动架构，文章管理简单
- 内置 **AI 智能问答助手**，可基于站内知识回答技术问题
- 支持 **飞书文章一键导入**，从飞书文档自动同步到博客
- 完整的管理后台：个人信息 / 专栏 / 项目 / 主题均可在线配置
- 开箱即用的 SEO（sitemap、RSS、Open Graph、robots.txt）
- 暗色 / 亮色模式自动切换 + 手动切换

> 本项目可作为 Next.js 博客系统的学习参考，也可以直接 Fork 作为你自己的博客模板。

## 目录

- [在线演示](#在线演示)
- [技术栈](#技术栈)
- [快速上手](#快速上手)
  - [环境要求](#环境要求)
  - [3 分钟启动](#3-分钟启动)
  - [常用命令](#常用命令)
- [功能特性](#功能特性)
  - [内容展示](#内容展示)
  - [管理后台](#管理后台-admin)
  - [AI 功能](#ai-功能)
  - [工程化](#工程化)
- [项目结构](#项目结构)
- [配置说明](#配置说明)
  - [站点配置](#站点配置)
  - [环境变量](#环境变量)
  - [功能开关](#功能开关)
- [文章编写指南](#文章编写指南)
- [部署指南](#部署指南)
  - [Vercel 部署（推荐）](#vercel-部署推荐)
  - [Docker 部署](#docker-部署)
  - [自建服务器部署](#自建服务器部署)
- [故障排查](#故障排查)
- [贡献指南](#贡献指南)
- [License](#license)

## 技术栈

| 类别         | 技术选型                                                         |
| ------------ | ---------------------------------------------------------------- |
| 前端框架     | [Next.js](https://nextjs.org/) 14 (App Router)                   |
| 开发语言     | [TypeScript](https://www.typescriptlang.org/) 5.4                |
| UI 库        | [React](https://react.dev/) 18                                   |
| 样式方案     | [Tailwind CSS](https://tailwindcss.com/) 3                       |
| 图标库       | [lucide-react](https://lucide.dev/)                              |
| 内容格式     | Markdown / MDX                                                   |
| 内容解析     | gray-matter + remark + rehype + [shiki](https://shiki.style/)    |
| 全文搜索     | [Fuse.js](https://fusejs.io/) 7                                  |
| 评论系统     | [Giscus](https://giscus.app/)                                    |
| 数据分析     | [@vercel/analytics](https://vercel.com/docs/analytics)           |
| 暗色模式     | [next-themes](https://github.com/pacocoursey/next-themes)        |
| CI/CD        | GitHub Actions                                                   |
| 推荐部署平台 | [Vercel](https://vercel.com)                                     |

## 快速上手

### 环境要求

| 工具                             | 版本要求              |
| -------------------------------- | --------------------- |
| [Node.js](https://nodejs.org/)   | ≥ 18.17               |
| npm                              | ≥ 9（随 Node.js 自带） |
| Git                              | ≥ 2.0                 |

### 3 分钟启动

```bash
# 1. 克隆仓库
git clone https://github.com/huweiastar/micro-ai-blog.git
cd micro-ai-blog

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
npm run dev           # 启动开发服务器（http://localhost:3000）
npm run build         # 构建生产版本（自动预生成搜索索引/sitemap/RSS/知识索引）
npm start             # 启动生产服务器
npm run lint          # ESLint 检查
npm run type-check    # TypeScript 类型检查
npm run format        # Prettier 格式化代码
npm run check:content # 校验内容文件格式
```

## 功能特性

### 内容展示

- Markdown / MDX 文章发布，支持 frontmatter 元数据
- 文章分类、标签、归档、时间线
- 全文搜索（本地 Fuse.js 索引，构建时生成）
- 代码高亮（shiki，支持 Python、SQL、Shell、Java、Scala、JS/TS 等）
- 自动生成文章目录 TOC
- 阅读时间统计 & 字数统计
- 上一篇 / 下一篇导航 & 相关文章推荐
- 项目展示卡片（技术栈、GitHub / 演示链接）
- 响应式布局（桌面 / 平板 / 移动端）
- 暗色 / 亮色模式自动检测 + 手动切换

### 管理后台 (`/admin`)

- 登录保护（`ADMIN_PASSWORD` 环境变量）
- 个人信息管理（头像、简介、技能标签、社交链接）
- 专栏管理（增删改、主题背景/渐变设置）
- 项目管理（增删改、封面、详情、技术栈）
- 主题设置（全局渐变、背景图、暗色模式开关）
- 在线写文章 / 发布文章

### AI 功能

- **站内知识问答助手**：基于站内文章构建知识索引，支持语义级问答检索
  - 支持多种 AI 后端：DashScope（千问）、Anthropic（Claude）、OpenAI、自定义 OpenAI 兼容 API
  - 回答附带知识来源引用，方便追溯原文
- **飞书文章导入**：通过飞书开放平台 API，将飞书文档自动转换为博客文章

### 工程化

- TypeScript 全栈类型安全
- ESLint + Prettier 代码规范
- GitHub Actions CI 自动检查（lint + type-check + build）
- SEO 优化：sitemap.xml、rss.xml、robots.txt、Open Graph 标签
- 构建时自动生成搜索索引、站点地图、RSS 订阅、知识索引

## 项目结构

```
micro-ai-blog/
├── app/                          # Next.js App Router 页面
│   ├── page.tsx                  # 首页
│   ├── page.client.tsx           # 首页客户端组件
│   ├── layout.tsx                # 根布局（Metadata + 全局 Provider）
│   ├── globals.css               # 全局样式（Tailwind + 自定义主题）
│   ├── not-found.tsx             # 404 页面
│   ├── robots.ts                 # robots.txt
│   ├── sitemap.ts                # sitemap.xml（动态生成）
│   │
│   ├── blog/                     # 博客列表 + 详情页
│   │   ├── page.tsx              # 博客列表
│   │   └── [slug]/page.tsx       # 文章详情
│   │
│   ├── admin/                    # 管理后台
│   │   ├── login/page.tsx        # 登录页
│   │   ├── page.tsx              # 仪表盘
│   │   ├── write/page.tsx        # 写文章
│   │   └── project/page.tsx      # 项目管理
│   │
│   ├── api/                      # API 路由（服务端接口）
│   │   ├── assistant/chat/       # AI 问答
│   │   ├── auth/                 # 登录 / 登出
│   │   ├── admin/                # 管理接口（重建索引）
│   │   ├── categories/           # 专栏 CRUD
│   │   ├── feishu/               # 飞书导入回调
│   │   ├── projects/             # 项目 CRUD
│   │   ├── publish/              # 文章发布
│   │   ├── stats/                # 访问统计
│   │   ├── theme/                # 主题设置
│   │   └── upload/               # 文件上传
│   │
│   ├── categories/               # 分类浏览
│   ├── tags/                     # 标签浏览
│   ├── archive/                  # 归档时间线
│   ├── projects/                 # 项目展示
│   ├── search/                   # 搜索页面
│   ├── about/                    # 关于我
│   ├── footprint/                # 足迹
│   └── search/                   # 搜索
│
├── components/                   # 可复用 React 组件
│   ├── ui/                       # 基础 UI（Avatar、BackToTop、ParticleNetwork 等）
│   ├── blog/                     # 博客相关（CategoryBadge、ShareButtons 等）
│   ├── assistant/                # AI 助手面板 / 消息列表 / 输入框
│   └── profile/                  # 个人展示（ContactCard、SkillGroup）
│
├── config/                       # 站点配置
│   ├── site.ts                   # 站点元信息（标题、描述、社交链接）
│   ├── nav.ts                    # 导航菜单
│   ├── features.ts               # 功能开关
│   ├── comments.ts               # 评论系统配置
│   └── theme.json                # 主题配色
│
├── content/                      # 内容数据（Markdown / YAML）
│   ├── blog/                     # 博客文章（.md / .mdx）
│   ├── authors/                  # 作者信息
│   ├── projects/                 # 项目描述
│   ├── categories.yaml           # 分类定义
│   └── about/                    # 关于页数据
│
├── hooks/                        # 自定义 React Hooks
├── lib/                          # 工具函数库
│   ├── assistant/                # AI 助手逻辑（indexer / retriever / generator）
│   ├── posts.ts                  # 文章读取 / 解析
│   ├── projects.ts               # 项目读取
│   ├── categories.ts             # 分类处理
│   ├── auth.ts                   # 认证逻辑
│   └── ...
│
├── types/                        # TypeScript 类型定义
├── scripts/                      # 构建脚本
│   ├── generate-search-index.ts  # 搜索索引生成
│   ├── generate-sitemap.ts       # Sitemap 生成
│   ├── generate-rss.ts           # RSS 生成
│   ├── generate-knowledge-index.ts # 知识索引生成（AI 问答用）
│   └── check-content.ts          # 内容校验
│
├── public/                       # 静态资源
│   ├── images/                   # 图片资源
│   ├── search-index.json         # 搜索索引（构建时生成）
│   ├── knowledge-index.json      # 知识索引（构建时生成）
│   ├── sitemap.xml               # 站点地图（构建时生成）
│   └── rss.xml                   # RSS 订阅（构建时生成）
│
├── .github/workflows/ci.yml      # GitHub Actions CI
├── middleware.ts                 # Next.js 中间件（路由守卫等）
├── next.config.js                # Next.js 配置
├── tailwind.config.ts            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
├── .env.example                  # 环境变量模板
└── package.json                  # 项目依赖与脚本
```

## 配置说明

### 站点配置

主要配置文件为 [`config/site.ts`](config/site.ts)，包含：

- 站点名称、标题、描述
- 作者信息（邮箱、GitHub、头像）
- 社交链接（GitHub、邮箱、掘金、知乎、LinkedIn）

导航菜单在 [`config/nav.ts`](config/nav.ts) 中配置。

### 环境变量

复制 `.env.example` 为 `.env.local` 并填入：

```bash
cp .env.example .env.local
```

```env
# ========== 站点配置 ==========
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=AI-Tech-Blog

# ========== 管理后台密码 ==========
ADMIN_PASSWORD=your-password

# ========== Giscus 评论系统 ==========
NEXT_PUBLIC_GISCUS_REPO=your-name/your-blog
NEXT_PUBLIC_GISCUS_REPO_ID=xxx
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=xxx

# ========== AI 聊天机器人（可选）==========
# 选择 AI 供应商：dashscope | anthropic | openai | custom
AI_PROVIDER=dashscope
AI_API_KEY=your-api-key
AI_API_BASE_URL=                        # 留空自动匹配供应商
AI_MODEL=qwen-plus                      # qwen-plus / claude-sonnet-4-6 / etc.

# ========== 飞书开放平台（可选）==========
FEISHU_APP_ID=your-feishu-app-id
FEISHU_APP_SECRET=your-feishu-app-secret
```

| 变量名                     | 必填 | 说明                                    |
| -------------------------- | ---- | --------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`     | 否   | 站点 URL，影响 SEO 和 RSS               |
| `ADMIN_PASSWORD`           | **是** | 管理后台密码，不设则无法访问 `/admin`   |
| `NEXT_PUBLIC_GISCUS_*`     | 否   | Giscus 评论系统凭证                     |
| `AI_PROVIDER`              | 否   | AI 后端类型                             |
| `AI_API_KEY`               | 否   | 对应 AI 后端的 API Key                  |
| `AI_MODEL`                 | 否   | 模型名称                                |
| `FEISHU_APP_ID/SECRET`     | 否   | 飞书导入功能凭证                        |

> 所有标注为"可选"的变量不填也不影响项目运行，仅影响对应功能。

### 功能开关

[`config/features.ts`](config/features.ts) 控制各项功能的启用状态：

```ts
export const featureConfig: FeatureConfig = {
  enableSearch: true,       // 全文搜索
  enableComments: true,     // 评论系统
  enableAnalytics: true,    // 访问统计
  enableRss: true,          // RSS 订阅
  enableDarkMode: true,     // 暗色模式
  enableReadingTime: true,  // 阅读时间统计
  enableToc: true,          // 文章目录
};
```

将某个值设为 `false` 即可在页面上隐藏对应功能。

## 文章编写指南

### 1. 创建文章

在 `content/blog/` 目录下创建 `.md` 或 `.mdx` 文件，文件名使用英文短横线命名（如 `my-first-post.mdx`）。

### 2. 填写 Frontmatter

每篇文章顶部必须有 frontmatter 元数据：

```yaml
---
title: "文章标题"
date: "2026-05-28"
updated: "2026-05-28"        # 可选，更新时间会显示
summary: "文章摘要"
tags: ["标签1", "标签2"]
category: "分类名称"
draft: false                 # true 时构建时会被排除
cover: "/images/blog/cover.png"  # 封面图，可选
---
```

### 3. 编写内容

支持标准 Markdown 语法 + MDX（可在 Markdown 中嵌入 React 组件）：

```mdx
---
title: "示例文章"
date: "2026-05-28"
tags: ["Next.js"]
---

这是一段普通文本。

## 代码块

\`\`\`python
print("Hello, World!")
\`\`\`

## 嵌入 React 组件

<SomeComponent />
```

编写完成后运行 `npm run build` 验证索引是否正常更新。

## 部署指南

### Vercel 部署（推荐）

1. Fork 或推送代码到 GitHub
2. 在 [Vercel](https://vercel.com) 导入该仓库
3. 在 **Settings → Environment Variables** 中配置 `.env.local` 中的变量
4. 点击 **Deploy**

Vercel 会在每次 push 到主分支时自动构建并部署，默认提供免费的 HTTPS 域名。

### Docker 部署

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

构建并运行：

```bash
docker build -t micro-ai-blog .
docker run -p 3000:3000 --env-file .env.local micro-ai-blog
```

### 自建服务器部署

```bash
# 安装依赖并构建
npm ci
npm run build

# 使用 PM2 守护进程
npm install -g pm2
pm2 start npm --name "micro-ai-blog" -- start
pm2 save
pm2 startup
```

建议搭配 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 故障排查

### `Cannot find module './xxx.js'`（Next.js 启动报错）

遇到 `Server Error: Cannot find module './xxx.js'` 时，是 Next.js webpack 缓存损坏导致的：

```bash
rm -rf .next && npm run dev
```

### 搜索结果为空

确保已运行 `npm run build`（搜索索引在构建时生成），或手动运行：

```bash
npm run generate:search
```

### AI 助手不回复

1. 检查 `.env.local` 中 `AI_API_KEY` 是否正确
2. 确保已运行 `npm run build` 生成知识索引
3. 在管理后台点击"重建知识索引"

### 管理后台无法登录

确保 `.env.local` 中设置了 `ADMIN_PASSWORD` 且密码不为空。

### Tailwind 样式不生效

修改 Tailwind 配置后需要重启开发服务器：

```bash
# Ctrl+C 停止后重新启动
npm run dev
```

### CI 构建失败

检查 TypeScript 类型错误：

```bash
npm run type-check
npm run lint
```

确保所有 `.mdx` 文件的 frontmatter 格式正确：

```bash
npm run check:content
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

请确保：

- 运行 `npm run type-check && npm run lint && npm run build` 全部通过
- 遵循现有代码风格（Prettier 配置已内置）
- Commit 信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范

## License

[MIT](LICENSE) — 可自由使用和修改，请保留原作者信息。

---

<p align="center">如果这个项目对你有帮助，欢迎 ⭐ Star 支持一下！</p>
