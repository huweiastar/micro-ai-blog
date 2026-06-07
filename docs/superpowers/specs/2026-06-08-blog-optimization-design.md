# 博客项目全面优化 — 设计文档

- 日期：2026-06-08
- 分支：`feat/blog-optimization`
- 范围：访客端 + 后台管理端的视觉/布局/组件/响应式/可用性/功能优化，并修复底部 giscus 评论。

## 1. 目标与非目标

### 目标
- 修复博客详情页 / 项目详情页底部"消失"的评论（giscus）。
- 收敛并固化设计系统（共享 UI 原语 + 设计令牌），消除重复内联样式与不一致。
- 系统性精修访客端各页面的视觉与布局。
- 补齐响应式与可用性边界（空/加载/错误态、长内容截断、a11y、降低动效）。
- 提升后台管理体验（统一保存反馈、表单、列表管理、移动端可用性）。
- 在不引入新运行时依赖的前提下，新增高性价比功能。

### 非目标
- 不重做整体视觉语言（保留现有玻璃拟态 + CSS 变量主题体系）。
- 不引入数据库或第三方 SaaS。评论沿用 giscus（免服务器、零运行时依赖）。
- 不做与本次目标无关的重构。

## 2. 实现策略

采用 **策略 B：先固化设计系统再精修**。
- 先抽出统一的设计令牌（间距/圆角/阴影/字阶）与共享 UI 原语（`Container`/`Section`/`Button`/`Card`/`Badge`/`PageHeader`），沉淀到 `components/ui/`。
- 在此基础上逐页精修，复用原语保证一致性。
- 契合 CLAUDE.md "拆成单一职责、接口清晰、可独立测试的小单元"。

**依赖约束**：评论修 giscus（零新增依赖）；其余优化全部纯前端/构建期，不引入数据库或第三方 SaaS。

## 3. 现状关键事实（已核查）

- 框架：Next.js 14.2 App Router + React 18 + TS + Tailwind 3 + @tailwindcss/typography。内容构建期生成。
- 已有设计系统雏形：`app/globals.css` 定义 CSS 变量（`--background/--card/--primary/--glow-*` 等）+ 工具类（`glass`/`btn-interactive`/`link-interactive`/`card-interactive`/`prose-custom`）。
- 评论：`components/Comment.tsx`（giscus）被 `app/blog/[slug]/page.tsx:163` 与 `app/projects/[slug]/page.tsx:192` 引用。`config/comments.ts` 配置 provider。`.env.local` 已填 `huweiastar/micro-ai-blog` 的 giscus 4 项变量。
- **评论不显示根因（候选）**：① 组件在 `isConfigured` 为假时 `return null`（静默无渲染）；② `NEXT_PUBLIC_*` 为构建期内联，若生产构建早于 env 配置则不生效；③ GitHub 仓库未开启 Discussions / 未安装 giscus App，导致 iframe 加载为空。阶段 0 先排查再修。
- 后台：`AdminShell` 已含桌面侧栏 + 移动端抽屉 + 主题背景；`MarkdownEditor` 功能完整。

## 4. 分阶段设计

每阶段独立可验证（`npm run type-check` → `npm run lint` → `npm run build`），按顺序推进。

### 阶段 0｜评论修复（giscus）
**排查**：临时脚本/dev 检查确认运行构建中 `NEXT_PUBLIC_GISCUS_*` 是否内联；确认 GitHub 端 Discussions + giscus App 状态。

**改动**：
- `components/Comment.tsx`
  - 未配置时渲染友好占位（"评论未配置"），不再静默 `return null`（仅在显式关闭时不渲染）。
  - 加载骨架 + 加载完成态；`IntersectionObserver` 懒加载脚本（滚动到评论区才注入）。
  - 主题切换改用 giscus 官方 `postMessage`（`giscus.setConfig`）更新主题，避免重建 iframe。
  - 包裹统一标题区「💬 评论」。
- `config/comments.ts`：补类型与注释，导出 `isCommentsEnabled` 帮助函数。
- `.env.example` 注释完善；新增 `docs/giscus-setup.md`（GitHub 端 3 步配置说明）。

**验收**：giscus 正确配置时评论区渲染并可发评论；未配置时显示明确占位而非空白；切换暗色不重载 iframe。

### 阶段 1｜设计系统固化（`components/ui/`）
新增原语（全部基于现有 CSS 变量，零新依赖）：
- `Container.tsx`：统一 `max-w-5xl mx-auto px-4 sm:px-6`。
- `Section.tsx`：区块容器 + 标题 + 可选 "查看全部" 链接。
- `Button.tsx`：`variant: primary | ghost | outline`，`size: sm | md`，整合 `btn-interactive`；支持 `as Link`/`button`。
- `Card.tsx`：统一圆角/边框/阴影/hover（整合 `glass` + `card-interactive`）。
- `Badge.tsx`：统一标签/分类徽章。
- `PageHeader.tsx`：列表页统一页头（标题 + 描述 + 计数 + 可选操作）。
- `globals.css`：补 `--radius`（及 sm/lg）、阴影层级令牌；统一 `:focus-visible` 焦点环；`prose` 暗色微调。

**验收**：原语有清晰 props 接口；至少在首页接入验证；构建通过。

### 阶段 2｜访客端视觉与布局精修
逐页接入阶段 1 原语并精修：
- `app/page.tsx` + `app/page.client.tsx`：Hero/统计区视觉、区块间距统一。
- `app/blog/[slug]/page.tsx`：文章头部元信息排版、`prose-custom` 间距/代码/引用、相关文章卡片、与评论区衔接。
- 列表/详情页：`app/blog`、`app/projects`、`app/categories(/[category])`、`app/tags(/[tag])`、`app/archive`、`app/search`、`app/about`、`app/footprint`——统一页头/卡片/间距/空态。
- `components/BlogCard.tsx`、`components/ProjectCard.tsx`：信息层级、hover、封面比例、`line-clamp`。
- `components/Footer.tsx`：栏目补齐、版权年份。

**验收**：各页面视觉一致（间距/圆角/阴影/字阶统一）；构建通过。

### 阶段 3｜响应式与可用性边界
- 断点核查（`sm/md/lg`）：移动端首页统计、卡片网格、详情页留白。
- 统一空/加载/错误态：扩展 `EmptyState`（支持图标/插画位）；搜索与列表加载骨架。
- 长内容：标题/摘要 `line-clamp`，长链接 `break-words`，表格/代码块横向滚动。
- a11y：统一 `:focus-visible` 焦点环、补 `aria-label`/`aria-current`、图片 `alt`、"跳到主内容"链接。
- `prefers-reduced-motion`：关闭 `ParticleNetwork`/`MouseFollow`/`ClickEffect` 等高频动效。

**验收**：移动端无横向溢出；键盘可达可见焦点；减少动效偏好生效。

### 阶段 4｜后台管理体验
- 统一保存反馈：新增轻量 `components/admin/Toast.tsx` + hook（零依赖），替换零散 `alert`。
- 表单：统一输入控件样式、必填校验、未保存离开提示。
- 列表管理（文章/项目/分类）：统一表格/卡片、搜索过滤、空态、加载态。
- 移动端后台：表单与 `MarkdownEditor` 工具栏窄屏可用性（换行/滚动/全屏）。

**验收**：保存有明确成功/失败反馈；窄屏后台可操作；构建通过。

### 阶段 5｜新功能（纯前端/构建期）
按性价比实现，★ 为优先：
- ★ TOC 增强：滚动高亮当前章节，与 `ReadingProgress` 联动（`components/Toc.tsx`）。
- ★ 文章元信息增强：字数/阅读时长/发布与更新时间统一展示。
- ★ 分享卡片：完善 `components/blog/ShareButtons.tsx`（复制链接、X/微博、微信二维码）。
- 系列/专栏：同 category 上下篇导航增强。
- 评论数/反应数展示（依赖 giscus，能则做）。

**验收**：★ 项实现并接入详情页；构建通过。

## 5. 风险与回滚
- giscus 依赖 GitHub 外部服务；若仓库端无法开 Discussions，则阶段 0 退化为"明确占位 + 配置文档"，不阻塞其余阶段。
- 设计系统原语接入是渐进式的：先新增原语，再逐页替换，旧工具类保留以防回归。
- 每阶段独立提交，便于按阶段回滚。

## 6. 验证流程（每阶段）
1. `npm run type-check`
2. `npm run lint`
3. `npm run build`
4. 必要时 `npm run dev` 人工核查页面渲染（含暗色 / 移动端）。
