# 设计稿：四板块毛玻璃重构（说说 / 杂谈 / 友链 / 关于）

- 日期：2026-06-20
- 状态：待用户评审
- 参考：xinghuisama 博客（仓库 heiehiehi/XinghuisamaBlogs，XHBlogs 展示端）

## 背景与范围

参考站把博客拆成「展示端 XHBlogs + 本地管理端 my-blog-manager」。用户决定整体走**独立管理后台**式前后端分离，但按「展示与编辑解耦」分两期推进：

- **本期（B，本设计稿）**：四板块**展示端**毛玻璃重构。只读消费内容文件，架构无关，风险低，可独立上线。
- **后续（A，另写 spec）**：架构拆分——博客瘦身只读化、剥离 `/admin` 与写接口，新建独立管理端覆盖所有内容类型。**不在本稿范围**。

本期内容由内容文件驱动（我播种示例）；新内容类型（杂谈/友链）的可视化编辑器留给 A。说说的 mood/images 字段本期可由现有 notes 编辑器手填 frontmatter。

非目标：framer-motion 引入、管理端、杂谈接入搜索索引、Footer 备案/运行时长（属另一暂停任务）。

## 共享地基

### 毛玻璃卡片
固化参考站配方为一个可复用 `components/ui/GlassCard.tsx`（薄封装，props 控制圆角/内距/是否 hover 抬升），各页统一使用：
- 暗色 `bg-[var(--card)]/55 dark` 深蓝玻璃、亮色浅白玻璃 `bg-white/60`
- `backdrop-blur-xl`、半透明白边 `border-white/40 dark:border-white/10`
- 大圆角 `rounded-3xl`（卡）/ `rounded-2xl`（小卡）
- `shadow-lg`，hover `-translate-y-1` + `shadow-2xl`
- 强调色沿用站点 `--primary`（indigo 系），保留渐变头像环 / 在线脉冲点 / 主题色光晕等点缀

### 动效（决策，待评审）
**不引入 framer-motion**。入场交错复用现有 `RevealList`，hover/展开用 CSS transition。理由：避免 ~50kb 新依赖，与站点既有 CSS 动效一致。观感约 95% 接近参考站。

## 1. 说说（升级现有 `/notes`，路由不变）

- **数据**：notes frontmatter 新增**可选**字段 `mood`(string)、`images`(string[])、`location`(string)；旧笔记零改动兼容。需确认 `lib/posts` 的 notes 读取透传这些字段（实现期验证，必要时扩展类型）。
- **组件**：`components/notes/NoteCard` 升级为朋友圈式 **MomentCard**：
  - 头部：渐变方块头像 + 昵称（取站点 profile）+「N 小时前」相对时间 + 心情胶囊
  - 正文：渲染后的 markdown（保留 `whitespace-pre-wrap` 观感）
  - 配图：1 张居中 / 2×2 / 3 列九宫格，复用现有 `ImageZoom`（`data-zoomable`）灯箱，>9 张显示 +N
  - 底部：`📍位置` 胶囊 + `💬` 内联评论（复用现有 giscus，保持 commentsEnabled 逻辑）
- **页面**：从「左竖线时间线」改为**居中玻璃信息流**（prose 宽度），新增客户端搜索 + 时间正/倒序。空态保留。
- **导航**：「随手记」改名「说说」，href 仍 `/notes`（不破坏既有链接/RSS）。

## 2. 杂谈（新建 `/chatters`）

- **内容**：`content/chatters/*.mdx`，frontmatter `{title, date, tags, mood, cover, summary}`，**复用博客 MDX 渲染管线**（remark/rehype，与 blog 一致）。
- **lib**：新增 `lib/chatters.ts`（仿 `lib/posts`/`lib/gallery`），提供 `getAllChattersSync()` / `getChatterBySlug()`。
- **页面**：
  - `/chatters`：玻璃卡列表（封面 + 心情 + 标题 + 日期 + 摘要 + 标签），`RevealList` 入场
  - `/chatters/[slug]`：详情，复用文章排版（`prose-custom`）+ giscus 评论；轻量，不接相关文章
- **集成**：接入 `sitemap.ts`；prebuild 不强制改。先播种 1～2 篇示例。
- **导航**：新增「杂谈」→ `/chatters`。

## 3. 友链（新建 `/friends`）

- **数据**：`content/friends.yaml`（仿 `content/gallery.yaml`）：`{name, url, description, avatar, themeColor?}` 列表。
- **lib**：新增 `lib/friends.ts` 读取器。
- **config**：新增 `config/friends.ts` 导出 `friendLinkApplyFormat` 申请格式字符串（与站点配置解耦，便于 A 期管理端接管）。
- **页面** `/friends`：
  - 标题「友链」+ 诗意副标题；玻璃卡网格（`grid-cols-2 lg:grid-cols-3`）
  - 卡片：渐变环头像（hover 旋转）、ONLINE 脉冲点、`themeColor` 角落光晕（hover 显现）
  - 底部「申请友链」区：一键复制申请格式 + 引导到**现有 `/guestbook`**（不引入 gitalk）
  - 空数据时给占位提示（同相册空态）
- **导航**：新增「友链」→ `/friends`。

## 4. 关于（增强现有 `/about`）

- 顶部加**头图氛围区**：大头像 + 名字 + tagline，柔和渐变玻璃背板
- 下方「个人简介 / 技术栈 / 联系方式」全部玻璃化 + emoji 人情味
- 沿用现有 `lib/about` 数据，不强加新字段（如需 interests/timeline 由 A 期管理端补）

## 5. 导航与全站轻量点缀

- **导航**（决策，待评审）：「随手记」→「说说」，新增「杂谈」「友链」；把冷门的「图谱」「统计」从顶栏挪入 **Footer**，顶栏维持 ~12 项不超载。
- **点缀**：玻璃 `PageHeader`、统计数字、emoji 暖色，仅作用于通用组件，**不大动首页**。

## 验证计划

每项改动遵循仓库规范：
1. `npm run type-check`、`npm run lint`
2. 隔离构建 `NEXT_DIST_DIR=.next.verify npm run build`（不污染生产 `.next`，见 incident 记忆）
3. Playwright 在 `:3001`（`.next.dev` 隔离）逐页亮/暗抽查：`/notes`、`/chatters`、`/chatters/[slug]`、`/friends`、`/about`
4. 完成后按用户指示提交/部署（`./deploy.sh`）

## 待评审决策点

1. 动效：CSS/RevealList（推荐）vs framer-motion
2. 导航：把「图谱/统计」挪进 Footer（推荐）vs 保留 14 项顶栏
3. 友链/杂谈本期由内容文件手写（编辑器留给 A 期），可接受否
```
