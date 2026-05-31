# 微观 AI

<p align="center">
  <em>一个聚焦大数据与大模型方向的个人技术博客</em>
</p>

<p align="center">
  <a href="http://39.106.209.251:3000/">
    <img src="https://img.shields.io/badge/blog-39.106.209.251:3000-2563eb?style=flat&labelColor=1e293b" alt="Online Demo" />
  </a>
  <a href="https://github.com/huweiastar/micro-ai-blog/stargazers">
    <img src="https://img.shields.io/github/stars/huweiastar/micro-ai-blog.svg?style=flat&logo=github&label=Stars" alt="Stars" />
  </a>
  <a href="https://github.com/huweiastar/micro-ai-blog/network/members">
    <img src="https://img.shields.io/github/forks/huweiastar/micro-ai-blog.svg?style=flat&logo=github&label=Forks" alt="Forks" />
  </a>
  <a href="https://github.com/huweiastar/micro-ai-blog">
    <img src="https://img.shields.io/badge/TypeScript-3178c6?style=flat&logo=typescript&logoColor=white" alt="Language" />
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white" alt="Next.js" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/huweiastar/micro-ai-blog.svg?style=flat" alt="License" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/全文搜索-✅-blue?style=flat&labelColor=333" />
  <img src="https://img.shields.io/badge/SEO优化-✅-green?style=flat&labelColor=333" />
  <img src="https://img.shields.io/badge/AI问答-✅-purple?style=flat&labelColor=333" />
  <img src="https://img.shields.io/badge/管理后台-✅-orange?style=flat&labelColor=333" />
  <img src="https://img.shields.io/badge/暗色模式-✅-yellow?style=flat&labelColor=333" />
  <img src="https://img.shields.io/badge/飞书导入-✅-red?style=flat&labelColor=333" />
</p>

---

## 🌐 在线预览

> **访问我的个人博客**：[http://39.106.209.251:3000](http://39.106.209.251:3000)

<div align="center">
  <table>
    <tr>
      <td align="center">
        <b> 首页</b><br/>
        <em>粒子背景 · 渐变主题 · 最新文章</em>
      </td>
      <td align="center">
        <b>📝 文章详情</b><br/>
        <em>代码高亮 · 目录导航 · 相关推荐</em>
      </td>
      <td align="center">
        <b> AI 助手</b><br/>
        <em>知识问答 · 来源引用 · 多模型支持</em>
      </td>
    </tr>
    <tr>
      <td align="center">
        <em>暗色/亮色自动切换，响应式适配移动端</em>
      </td>
      <td align="center">
        <em>支持 Python/SQL/Java/Scala/JS/TS 等代码高亮</em>
      </td>
      <td align="center">
        <em>基于站内文章构建知识索引，支持千问/Claude/OpenAI</em>
      </td>
    </tr>
  </table>
</div>

---

## 📖 关于本项目

本项目既是 **我的个人技术博客**（运行于 [39.106.209.251:3000](http://39.106.209.251:3000)），也是一个 **开源的博客框架**，你可以直接 Fork 并部署属于自己的技术博客。

### 核心特色

| 特性 | 说明 |
|:---|:---|
|  **精美 UI** | 粒子动画背景 · 渐变主题 · 暗色模式 · 阅读进度条 · 鼠标跟随特效 |
| 📝 **内容驱动** | Markdown/MDX 写作 · Frontmatter 元数据 · 分类/标签/归档/时间线 |
| 🔍 **全文搜索** | 基于 Fuse.js 的客户端模糊搜索，构建时自动生成索引 |
| 🤖 **AI 问答** | 站内知识助手，支持 DashScope/Claude/OpenAI，回答附带来源引用 |
| 📱 **飞书导入** | 通过飞书开放平台 API，一键将飞书文档同步为博客文章 |
| ⚙️ **管理后台** | 在线管理个人信息/专栏/项目/主题/文章，无需改代码 |
| 🔎 **SEO 优化** | Sitemap · RSS · Open Graph · robots.txt · JSON-LD 结构化数据 |
|  **一键部署** | 支持 Vercel / Docker / 自建服务器，3 分钟即可上线 |

---

## 📑 目录

### 🌐 个人博客预览
- [在线访问](#-在线预览)
- [我的博客介绍](#我的博客介绍)

### 🛠️ 搭建你自己的博客
- [快速上手](#-快速上手)
- [技术栈](#-技术栈)
- [功能特性详解](#-功能特性详解)
- [项目结构](#-项目结构)
- [配置指南](#-配置指南)
- [部署指南](#-部署指南)
- [项目更新与维护](#-项目更新与维护)- [文章编写](#-文章编写指南)
- [故障排查](#-故障排查)

### 🤝 其他
- [贡献指南](#-贡献指南)
- [License](#-license)

---

## 我的博客介绍

[微观 AI](http://39.106.209.251:3000) 是我个人的技术博客，主要聚焦以下方向：

- **大数据开发**：Spark 性能调优、数据倾斜处理、Flink 实时计算
- **大模型数据工程**：数据清洗、指令微调数据集构建、评估体系
- **大模型基础架构**：Transformer 原理、注意力机制、MoE 架构
- **大模型应用工程**：RAG 系统设计、Agent 开发、Prompt 工程

博客采用 **Next.js 14 + TypeScript + Tailwind CSS** 构建，内容以 **Markdown/MDX** 格式编写，支持在线管理后台和 AI 智能问答。

> 如果你对大数据或大模型感兴趣，欢迎 [访问博客](http://39.106.209.251:3000) 交流讨论！

---

## ⚡ 快速上手

### 环境要求

| 工具 | 版本要求 |
|:---|:---|
| [Node.js](https://nodejs.org/) | ≥ 18.17 |
| npm | ≥ 9（随 Node.js 自带） |
| Git | ≥ 2.0 |

### 3 分钟启动

```bash
# 1. 克隆仓库
git clone https://github.com/huweiastar/micro-ai-blog.git
cd micro-ai-blog

# 2. 安装依赖
npm install

# 3. 配置环境变量（最简只需设置管理员密码）
cp .env.example .env.local
# 编辑 .env.local，设置 ADMIN_PASSWORD=你的密码

# 4. 启动开发服务器
npm run dev
```

打开 **http://localhost:3000** 即可看到博客首页。

> **💡 提示**: 仅需设置 `ADMIN_PASSWORD` 即可跑起来。AI 助手、评论系统、飞书导入等功能为可选配置，详见 [环境变量](#环境变量) 章节。

### 常用命令

| 命令 | 说明 |
|:---|:---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本（自动生成搜索索引/sitemap/RSS/知识索引） |
| `npm start` | 启动生产服务器 |
| `npm run lint` | ESLint 代码检查 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run format` | Prettier 格式化代码 |
| `npm run check:content` | 校验内容文件格式 |

---

## 🛠️ 技术栈

| 类别 | 技术选型 |
|:---|:---|
| **前端框架** | [Next.js](https://nextjs.org/) 14 (App Router) |
| **开发语言** | [TypeScript](https://www.typescriptlang.org/) 5.4 |
| **UI 库** | [React](https://react.dev/) 18 |
| **样式方案** | [Tailwind CSS](https://tailwindcss.com/) 3 |
| **图标库** | [lucide-react](https://lucide.dev/) |
| **内容格式** | Markdown / MDX |
| **内容解析** | gray-matter + remark + rehype + [shiki](https://shiki.style/) |
| **全文搜索** | [Fuse.js](https://fusejs.io/) 7 |
| **评论系统** | [Giscus](https://giscus.app/) |
| **数据分析** | [@vercel/analytics](https://vercel.com/docs/analytics) |
| **暗色模式** | [next-themes](https://github.com/pacocoursey/next-themes) |
| **CI/CD** | GitHub Actions |
| **部署平台** | [Vercel](https://vercel.com) |

---

## 🎯 功能特性详解

### 📖 内容展示

- ✅ Markdown / MDX 文章发布，支持 frontmatter 元数据
- ✅ 文章分类、标签、归档、时间线
- ✅ 全文搜索（本地 Fuse.js 索引，构建时生成）
- ✅ 代码高亮（shiki，支持 Python、SQL、Shell、Java、Scala、JS/TS 等）
- ✅ 自动生成文章目录 TOC
- ✅ 阅读时间统计 & 字数统计
- ✅ 上一篇 / 下一篇导航 & 相关文章推荐
- ✅ 项目展示卡片（技术栈、GitHub / 演示链接）
- ✅ 响应式布局（桌面 / 平板 / 移动端）
- ✅ 暗色 / 亮色模式自动检测 + 手动切换

### ⚙️ 管理后台 (`/admin`)

-  登录保护（`ADMIN_PASSWORD` 环境变量）
- 👤 个人信息管理（头像、简介、技能标签、社交链接）
-  专栏管理（增删改、主题背景/渐变设置）
- 📁 项目管理（增删改、封面、详情、技术栈）
- 🎨 主题设置（全局渐变、背景图、暗色模式开关）
- ️ 在线写文章 / 发布文章

### 🤖 AI 功能

| 功能 | 说明 |
|:---|:---|
| **站内知识问答** | 基于站内文章构建知识索引，支持语义级问答检索 |
| **多 AI 后端** | 支持 DashScope（千问）、Anthropic（Claude）、OpenAI、自定义 OpenAI 兼容 API |
| **来源引用** | 回答附带知识来源引用，方便追溯原文 |
| **飞书文章导入** | 通过飞书开放平台 API，将飞书文档自动转换为博客文章 |

### 🏗️ 工程化

- TypeScript 全栈类型安全
- ESLint + Prettier 代码规范
- GitHub Actions CI 自动检查（lint + type-check + build）
- SEO 优化：sitemap.xml、rss.xml、robots.txt、Open Graph 标签
- 构建时自动生成搜索索引、站点地图、RSS 订阅、知识索引

---

## 📁 项目结构

```
micro-ai-blog/
├── app/                          # Next.js App Router 页面
│   ├── page.tsx                  # 首页（粒子背景 + 最新文章）
│   ├── page.client.tsx           # 首页客户端组件
│   ├── layout.tsx                # 根布局（Metadata + 全局 Provider）
│   ├── globals.css               # 全局样式（Tailwind + 自定义主题）
│   ├── not-found.tsx             # 404 页面
│   ├── robots.ts                 # robots.txt
│   ├── sitemap.ts                # sitemap.xml（动态生成）
│   │
│   ├── blog/                     # 博客列表 + 详情页
│   │   ├── page.tsx              # 博客列表（分页 + 筛选）
│   │   └── [slug]/page.tsx       # 文章详情（TOC + 代码高亮 + 评论）
│   │
│   ├── admin/                    # 管理后台
│   │   ├── login/page.tsx        # 登录页
│   │   ├── page.tsx              # 仪表盘
│   │   ├── write/page.tsx        # 写文章
│   │   └── project/page.tsx      # 项目管理
│   │
│   ├── api/                      # API 路由（服务端接口）
│   │   ├── assistant/chat/       # AI 问答接口
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
│   └── footprint/                # 足迹
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
│   ── ...
│
├── types/                        # TypeScript 类型定义
├── scripts/                      # 构建脚本
│   ├── generate-search-index.ts  # 搜索索引生成
│   ├── generate-sitemap.ts       # Sitemap 生成
│   ├── generate-rss.ts           # RSS 生成
│   ├── generate-knowledge-index.ts # 知识索引生成（AI 问答用）
│   └── check-content.ts          # 内容校验
│
── public/                       # 静态资源
│   ├── images/                   # 图片资源
│   ├── search-index.json         # 搜索索引（构建时生成）
│   ├── knowledge-index.json      # 知识索引（构建时生成）
│   ├── sitemap.xml               # 站点地图（构建时生成）
│   └── rss.xml                   # RSS 订阅（构建时生成）
│
├── .github/workflows/ci.yml      # GitHub Actions CI
├── middleware.ts                 # Next.js 中间件（路由守卫等）
├── next.config.mjs               # Next.js 配置（ESM 格式）
├── tailwind.config.ts            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
├── .env.example                  # 环境变量模板
└── package.json                  # 项目依赖与脚本
```

---

## ⚙️ 配置指南

### 站点配置

| 文件 | 用途 |
|:---|:---|
| [`config/site.ts`](config/site.ts) | 站点名称、标题、描述、作者信息、社交链接 |
| [`config/nav.ts`](config/nav.ts) | 导航菜单配置 |
| [`config/features.ts`](config/features.ts) | 功能开关（搜索/评论/暗色模式等） |
| [`config/comments.ts`](config/comments.ts) | 评论系统配置 |
| [`config/theme.json`](config/theme.json) | 主题配色定义 |

### 环境变量

复制 `.env.example` 为 `.env.local` 并填入配置：

```bash
cp .env.example .env.local
```

```env
# ========== 站点配置 ==========
NEXT_PUBLIC_SITE_URL=http://39.106.209.251:3000
NEXT_PUBLIC_SITE_NAME=微观AI

# ========== 管理后台密码 ==========
ADMIN_PASSWORD=your-password

# ========== Giscus 评论系统（可选）==========
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

| 变量名 | 必填 | 说明 |
|:---|:---|:---|
| `NEXT_PUBLIC_SITE_URL` | 否 | 站点 URL，影响 SEO 和 RSS |
| `ADMIN_PASSWORD` | **是** | 管理后台密码，不设则无法访问 `/admin` |
| `NEXT_PUBLIC_GISCUS_*` | 否 | Giscus 评论系统凭证 |
| `AI_PROVIDER` | 否 | AI 后端类型 |
| `AI_API_KEY` | 否 | 对应 AI 后端的 API Key |
| `AI_MODEL` | 否 | 模型名称 |
| `FEISHU_APP_ID/SECRET` | 否 | 飞书导入功能凭证 |

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

---

##  部署指南

### Vercel 部署（推荐）

**适合人群**：想快速上线、不想折腾服务器的用户

1. Fork 或推送代码到 GitHub
2. 在 [Vercel](https://vercel.com/new) 导入该仓库
3. 在 **Settings → Environment Variables** 中配置环境变量
4. 点击 **Deploy**

Vercel 会在每次 push 到主分支时自动构建并部署，默认提供免费的 HTTPS 域名。

### Docker 部署

**适合人群**：已有 Docker 环境，希望一键部署的用户

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

**适合人群**：有 VPS，希望完全控制部署环境的用户

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

**Nginx 反向代理配置**：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # HTTP 自动跳转 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔄 项目更新与维护

### Vercel 部署

Vercel 会在每次 push 到 `main` 分支时**自动构建并部署**，无需任何手动操作。

### 自建服务器部署

当你向 GitHub 推送新代码后，登录服务器执行以下命令更新：

```bash
# 1. SSH 登录服务器
ssh root@39.106.209.251

# 2. 进入项目目录
cd /root/micro-ai-blog

# 3. 拉取最新代码
git pull origin main

# 4. 安装依赖（如有新增依赖）
npm ci

# 5. 重新构建并重启
npm run build && pm2 restart micro-ai-blog
```

### 懒人模式：设置一键更新别名

如果不想每次都输入多条命令，可以设置一个快捷别名：

```bash
# 添加别名到 ~/.bashrc
echo 'alias update-blog="cd /root/micro-ai-blog && git pull origin main && npm ci && npm run build && pm2 restart micro-ai-blog"' >> ~/.bashrc

# 使别名生效
source ~/.bashrc
```

以后只需运行：

```bash
update-blog
```

### 常用维护命令

| 命令 | 说明 |
|:---|:---|
| `pm2 status` | 查看服务运行状态 |
| `pm2 logs micro-ai-blog` | 查看实时日志 |
| `pm2 restart micro-ai-blog` | 重启服务 |
| `pm2 stop micro-ai-blog` | 停止服务 |
| `pm2 delete micro-ai-blog` | 删除服务 |
| `pm2 monit` | 监控面板（CPU/内存实时图表） |
| `git log --oneline -5` | 查看最近 5 条提交记录 |

### 更新注意事项

- **构建时间**：Next.js 构建大约需要 30-60 秒，期间旧版本仍可正常访问
- **无缝更新**：`pm2 restart` 会平滑重启，不会丢失正在处理的请求
- **故障排查**：如果更新后出现问题，运行 `pm2 logs micro-ai-blog --lines 50` 查看详细日志
- **回滚操作**：如需回滚到上一个版本：
  ```bash
  git log --oneline        # 找到要回退的 commit hash
  git reset --hard <hash>  # 回退代码
  npm run build && pm2 restart micro-ai-blog  # 重新构建
  ```

## ✍️ 文章编写指南

### 1. 创建文章

在 `content/blog/` 目录下创建 `.md` 或 `.mdx` 文件，文件名使用英文短横线命名（如 `my-first-post.mdx`）。

### 2. 填写 Frontmatter

每篇文章顶部必须有 frontmatter 元数据：

```yaml
---
title: "文章标题"
date: "2026-05-28"
updated: "2026-05-28"        # 可选，更新时间会显示
summary: "文章摘要（100字以内最佳）"
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
tags: ["Next.js", "React"]
category: "前端开发"
---

这是一段普通文本，支持 **加粗**、*斜体*、[链接](https://example.com) 等 Markdown 语法。

## 代码块

支持多种语言的语法高亮：

```python
def hello():
    print("Hello, World!")
```

```sql
SELECT * FROM users WHERE age > 18;
```

## 嵌入 React 组件

<SomeComponent />
```

编写完成后运行 `npm run build` 验证索引是否正常更新。

---

## 🔧 故障排查

| 问题 | 解决方案 |
|:---|:---|
| **`Cannot find module './xxx.js'`** | Next.js webpack 缓存损坏，运行 `rm -rf .next && npm run dev` |
| **搜索结果为空** | 确保已运行 `npm run build`（搜索索引在构建时生成） |
| **AI 助手不回复** | 检查 `AI_API_KEY` 是否正确；确保已生成知识索引；在管理后台点击"重建索引" |
| **管理后台无法登录** | 确保 `.env.local` 中设置了 `ADMIN_PASSWORD` |
| **Tailwind 样式不生效** | 修改 Tailwind 配置后需重启 dev server |
| **CI 构建失败** | 运行 `npm run type-check && npm run lint` 检查错误；运行 `npm run check:content` 校验 frontmatter |
| **Vercel 部署 404** | 检查构建日志；确保 `next.config.mjs` 使用 ESM 格式 |

---

##  Star History

<div align="center">
  <a href="https://star-history.com/#huweiastar/micro-ai-blog&Date">
    <img src="https://api.star-history.com/svg?repos=huweiastar/micro-ai-blog&type=Date" alt="Star History Chart" width="600" />
  </a>
  <p>⭐ 如果这个项目对你有帮助，欢迎 Star 支持一下！</p>
</div>

---

##  贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

**提交前请确保**：

- ✅ 运行 `npm run type-check && npm run lint && npm run build` 全部通过
- ✅ 遵循现有代码风格（Prettier 配置已内置）
- ✅ Commit 信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范

---

## 📜 License

[MIT](LICENSE) — 可自由使用和修改，请保留原作者信息。

---

<div align="center">
  <p>如果这个项目对你有帮助，欢迎 ⭐ Star 支持一下！</p>
  <p>
    <a href="http://39.106.209.251:3000">🌐 访问我的博客</a> · 
    <a href="https://github.com/huweiastar/micro-ai-blog/issues">💬 提交 Issue</a> · 
    <a href="https://github.com/huweiastar/micro-ai-blog/pulls">🔧 提交 PR</a>
  </p>
</div>
