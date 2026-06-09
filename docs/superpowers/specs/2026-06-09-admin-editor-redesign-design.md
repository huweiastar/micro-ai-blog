# 后台编辑界面重构设计 — 检视器布局 + 分屏实时预览

> 日期：2026-06-09　状态：已与用户确认，待写实现计划

## 1. 背景与目标

当前后台文章编辑器（`app/admin/articles/page.tsx` + `components/admin/MarkdownEditor`）为单列竖排：
标题 → 摘要 → 封面 → 元信息(折叠) → OG 预览(折叠) → 反馈条 → 正文，写作区被挤到下方；
预览为「切换式」（渲染结果替换文本框，不能边写边看）；正文是纯 textarea；
预览渲染器是客户端正则实现，**不渲染本站 callout、无 shiki 代码高亮，预览 ≠ 成品**。

**目标**：把整个后台编辑界面重构为现代「三栏 + 检视器」布局，正文支持源码/分屏/预览，
分屏预览与正式站点**完全一致**，并将同套风格/组件推广到项目、关于、专栏编辑器，最后做移动端适配。

**保持**：现有紫色玻璃视觉风（`var(--card)`/`var(--card-border)`/`backdrop-blur`/`var(--primary)`、
`lucide-react`、暗/亮双模）；Markdown 作为正文唯一来源（不引入 WYSIWYG）；
各编辑页 React state 仍为编辑态唯一来源。

## 2. 整体布局

三栏（桌面 ≥ lg）：

```
┌ 列表 320px ┬──────── 写作区 ────────┬ 检视器 ~300px ┐
│ 新建/搜索   │ 标题________________    │ 发布(草稿/定时/  │
│ 筛选/排序   │ [编辑│分屏│预览] 工具栏 │   日期)          │
│ 文章行...   │ ┌─源码──────┬─预览───┐ │ 分类与标签       │
│             │ │# 标题      │ 渲染   │ │ 封面 [▣]         │
│             │ │正文        │ 效果   │ │ 摘要 …           │
│             │ └───────────┴────────┘ │ 质量与SEO ●●●○○  │
│             │                        │ OG 预览 [▣]      │
└─────────────┴────────────────────────┴──────────────────┘
```

- 列表 + 主区仍由现有 `SplitWorkspace` 负责；主区内部再拆成「写作区 + 检视器」两栏。
- **写作区**：标题输入 + 视图段控（编辑／分屏／预览）+ 精简工具栏 + 正文。
- **检视器**：可折叠分组容器，收纳全部元信息。

## 3. 预览保真（关键决策：服务端渲染）

采用**方案 A**：新增 `POST /api/admin/preview`，服务端用正式 `renderMarkdownToHtml`
（remark/rehype + 自定义 callout + rehype-pretty-code/shiki + 标题锚点）渲染，返回 HTML 字符串。
客户端 `SplitMarkdownEditor` 防抖（~400ms）请求并对相同输入做结果缓存，避免空跑。
预览即成品，彻底解决一致性问题。单作者后台，渲染开销可忽略。

> 取舍记录：放弃「增强客户端正则渲染器（方案 B）」——它永远无法与 shiki/ callout 成品一致。

## 4. 组件架构与复用单元

新增 / 改造：

1. **`SplitMarkdownEditor`**（改造 `components/admin/MarkdownEditor`）
   - 新增「视图模式」段控：`edit | split | preview`。
   - `split`：左 textarea、右预览，**同步滚动**（按滚动比例联动）。
   - 预览来源改为服务端渲染 HTML（经 `usePreviewRender`）。
   - 保留：现有工具栏、全屏、图片上传、`useDraftAutosave` 草稿恢复。
   - 接口：`value/onChange` 不变，新增 `viewMode`/`onViewModeChange`（受控，便于持久化）。

2. **`/api/admin/preview/route.ts`**（新）
   - `POST { markdown: string }` → `{ html }`，调用 `renderMarkdownToHtml`。
   - `runtime = "nodejs"`，`dynamic = "force-dynamic"`。
   - 纳入 `READ_PROTECTED_API_PATHS`（仅登录可用，避免被滥用为公开渲染器）。

3. **`usePreviewRender`**（新 hook）
   - 输入 markdown，防抖调用 preview API，返回 `{ html, loading }`；内存缓存最近若干输入。

4. **`EditorInspector` + `InspectorSection`**（新，`components/admin/inspector/`）
   - `EditorInspector`：右栏容器（桌面并排、窄屏抽屉）。
   - `InspectorSection`：可折叠分组（标题 + 折叠箭头），折叠态持久化。
   - 文章编辑器填入分组：① 发布（草稿开关 / 定时发布 / 发布日期）② 分类与标签
     ③ 封面（地址 + 上传 + 缩略图）④ 摘要 ⑤ 质量与 SEO（评分 + 逐项建议）⑥ OG 预览。

5. **`useEditorLayout`**（新 hook）
   - 持久化 `inspectorOpen`（bool）与 `viewMode`，localStorage key 全局共享、跨文章记忆。

6. **`EditorChrome`**（新轻量布局，`components/admin/EditorChrome.tsx`）
   - 包住「写作区 + 检视器」两栏，处理响应式：≥xl 并排；< xl 检视器收为右侧抽屉（按钮唤出）。

复用到其它编辑器（范围 = 整个后台）：
- **项目** `/admin/projects`：正文换 `SplitMarkdownEditor`；技术栈/链接/封面/排序入检视器。
- **关于** `/admin/about`：个人简介正文用 `SplitMarkdownEditor`；其余字段统一输入控件样式。
- **专栏** `/admin/categories`：统一输入控件 + 描述用迷你编辑器；不强加检视器。
- 统一：按钮组、输入控件 class、Toast（已统一）、间距、图标体系。

## 5. 数据流

```
用户输入 → 各编辑页 React state（唯一来源）
              ├→ 检视器读写同一 state
              ├→ SplitMarkdownEditor 正文 value/onChange
              └→ usePreviewRender 防抖 POST /api/admin/preview → html → 预览栏
布局偏好（inspectorOpen / viewMode / 各 section 折叠态）→ localStorage
保存 → 既有 /api/posts（含 date/publish），保存自动快照（已实现的修订历史）
```

## 6. 交互细节

- **视图段控**：默认 ≥lg 为 `split`，< lg 为 `edit`；`viewMode` 持久化。
- **检视器**：默认 ≥xl 展开；< xl 收为抽屉，工具栏「检视器」按钮唤出；状态持久化。
- **全屏/专注**：隐藏列表与检视器，仅写作区（可分屏）。复用现有 `useFullscreen`。
- **同步滚动**：分屏下源码与预览按滚动比例联动，可后续加开关（Phase 1 默认开）。
- **键盘**：保留 `⌘/Ctrl+S` 存草稿、`⌘/Ctrl+Enter` 发布。
- **移动端**：列表与编辑互斥（选中文章后主区占满，返回键回列表）；检视器抽屉化；预览段控保留。

## 7. 分阶段交付（每阶段独立验证 + 可单独 commit/部署）

- **Phase 1｜文章编辑器核心**：`EditorChrome` 三栏 + `EditorInspector`/`InspectorSection` +
  `SplitMarkdownEditor` 分屏同步滚动 + `/api/admin/preview` 保真渲染 + `usePreviewRender` +
  `useEditorLayout` 布局记忆。把 `app/admin/articles/page.tsx` 接入新布局。← 价值最大
- **Phase 2｜跨编辑器统一**：项目 / 关于 / 专栏 套用 `SplitMarkdownEditor` 与检视器/统一控件。
- **Phase 3｜移动端 + 收尾**：检视器抽屉、列表/编辑响应式互斥、同步滚动开关、无障碍（焦点/aria）、细节打磨。

## 8. 测试与验证

- 每阶段：`npm run type-check` + `npm run lint` + 隔离 `NEXT_DIST_DIR=.next.build npm run build`。
- 预览 API：鉴权 E2E（未登录 401 / 登录 200），并对 callout、代码块做「预览 HTML 与成品文章 HTML 一致性」抽查。
- 布局：宽屏三栏 / 中屏检视器抽屉 / 窄屏移动端 三档手动核对，暗/亮双模。
- 回归：保存/草稿/定时/历史/封面上传/图片插入 等既有功能不被破坏。
- 提交前还原 prebuild 改写的 `public/{sitemap,rss,knowledge-index,search-index}`；不提交 `data/*`、`tsconfig.json`、`.claude/settings.local.json` 等本地脏数据。

## 9. 不做（YAGNI）

- 不引入 WYSIWYG / 富文本依赖。
- 不做多人协作 / 实时协同。
- 不改文章存储格式（仍是 `content/blog/*.md` frontmatter）。
- 不在本设计内做版本「对比 diff」视图（修订历史已能载入，diff 留作未来独立项）。
