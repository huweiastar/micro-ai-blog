# CLAUDE.md — ai-tech-blog

> 本文档为 Claude Code 在此仓库工作时提供上下文指引。

## 项目概览

- **类型**: 个人技术博客（Next.js 14 App Router）
- **框架**: Next.js 14.2, React 18, TypeScript
- **内容**: MDX + YAML（存放在 `content/` 目录）
- **样式**: Tailwind CSS 3 + @tailwindcss/typography
- **构建命令**:
  - `npm run dev` — 启动开发服务器
  - `npm run build` — 构建（自动 prebuild：生成知识索引/搜索索引/sitemap/RSS）
  - `npm run start` — 启动生产服务器
  - `npm run lint` — ESLint 检查
  - `npm run type-check` — TypeScript 类型检查
  - `npm run format` — Prettier 格式化
  - `npm run check:content` — 校验内容文件

## 目录结构

```
app/              — Next.js App Router 页面与布局
  api/            — API 路由
  blog/           — 博客列表与详情页
  admin/          — 管理后台
  about/          — 关于页
  archive/        — 归档页
  projects/       — 项目展示页
  search/         — 搜索页
  tags/           — 标签页
  categories/     — 分类页
  footprint/      — 足迹页
components/       — React 组件
  ui/             — 基础 UI 组件
  assistant/      — 助手相关组件
config/           — 站点配置（site.ts, nav.ts, theme.json, features.ts, comments.ts）
content/          — 内容文件（MDX 博客文章、YAML 分类、项目描述）
  blog/           — 博客 MDX 文章
  authors/        — 作者信息
  projects/       — 项目描述
  categories.yaml — 分类定义
hooks/            — 自定义 React Hooks
lib/              — 工具函数库
scripts/          — 构建脚本（生成 sitemap/RSS/搜索索引/知识索引）
types/            — TypeScript 类型定义（blog.ts, author.ts, project.ts）
middleware.ts     — Next.js 中间件
```

## 编码规范

### 通用规则

- 始终使用 **TypeScript**，禁止 `any` 类型，使用 `unknown` + 类型守卫代替
- 组件文件使用 `.tsx`，纯逻辑文件使用 `.ts`
- 命名：组件用 **PascalCase**，函数/变量用 **camelCase**，常量用 **UPPER_SNAKE_CASE**
- 优先使用 **函数组件 + React Hooks**，不使用 class 组件
- 使用 `async/await` 处理异步，避免 `.then()` 链

### 组件风格

- 使用 **Server Components** 作为默认，仅在需要交互时使用 `"use client"`
- Props 使用 `interface` 定义，命名为 `ComponentNameProps`
- 导出使用 `export default`，命名导出用于辅助组件
- 使用 `clsx` / `clsx` 管理条件 className
- 图标统一使用 `lucide-react`

### 样式

- 使用 **Tailwind CSS** 工具类，避免内联 style
- 响应式优先使用移动端优先策略（`md:`, `lg:` 断点）
- 暗色模式通过 `next-themes` + `dark:` 前缀实现
- 代码高亮使用 `rehype-pretty-code` + `shiki`

### 内容文件（MDX）

- 每篇文章顶部必须有 **frontmatter**（使用 `gray-matter` 解析）
- frontmatter 至少包含：`title`, `date`, `tags`, `summary`
- 图片引用使用相对路径或 `/public/` 下的绝对路径

## 架构要点

### 数据流

```
content/*.mdx → gray-matter/remark/rehype → React 组件 → HTML
```

- 内容读取在 **构建时** 完成（服务端），不依赖运行时 API
- 搜索使用 **Fuse.js** 客户端模糊搜索（索引在构建时生成）
- Sitemap/RSS 在 `prebuild` 阶段自动生成

### 关键文件

- [`app/layout.tsx`](app/layout.tsx) — 全局布局与 metadata
- [`app/page.tsx`](app/page.tsx) — 首页入口
- [`config/site.ts`](config/site.ts) — 站点元信息（标题、描述、URL）
- [`config/nav.ts`](config/nav.ts) — 导航菜单配置
- [`config/theme.json`](config/theme.json) — 主题配色
- [`middleware.ts`](middleware.ts) — 请求中间件

## 工作流约定

### 新增博客文章

1. 在 `content/blog/` 下创建 `.mdx` 文件
2. 填写 frontmatter（title, date, tags, summary, cover 等）
3. 运行 `npm run build` 验证索引更新

### 新增功能页面

1. 在 `app/` 下创建对应路由目录
2. 创建 `page.tsx`（默认 Server Component）
3. 需要交互时顶部加 `"use client"`
4. 在 `config/nav.ts` 中添加导航入口

### 修改配置

- 站点信息 → `config/site.ts`
- 导航菜单 → `config/nav.ts`
- 主题颜色 → `config/theme.json`
- 功能开关 → `config/features.ts`
- 评论系统 → `config/comments.ts`

## 注意事项

- **不要** 直接修改 `node_modules/` 下的文件
- **不要** 提交 `tsconfig.tsbuildinfo` 等构建产物
- 修改 Tailwind 配置后需重启 dev server
- 修改 MDX 处理插件后需重新 build 才能看到效果
- API 路由（`app/api/`）注意做好权限校验，不要暴露敏感数据

## 修改后验证

每次修改代码后，必须执行以下验证流程：

1. 运行 `npm run type-check` 确认无 TypeScript 类型错误
2. 运行 `npm run lint` 确认无 ESLint 错误
3. 运行 `npm run build` 确认构建成功（会触发 prebuild：知识索引/搜索索引/sitemap/RSS）
4. 如有必要，运行 `npm run dev` 并检查页面是否正常渲染

## 常见问题

### `Cannot find module './xxx.js'`（Next.js 启动报错）

遇到 `Server Error: Cannot find module './xxx.js'` 时，是 Next.js webpack 缓存损坏导致的，执行以下命令修复：

```bash
rm -rf .next && npm run dev
```

## 待办 / TODO

<!-- 在此记录正在进行的工作和待办事项 -->
- [ ] 示例：完善 admin 后台功能
- [ ] 示例：添加更多博客文章
