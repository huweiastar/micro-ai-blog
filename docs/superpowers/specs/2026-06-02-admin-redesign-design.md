# 后台管理重设计 (Admin Redesign)

- **日期**: 2026-06-02
- **作者**: huweiastar
- **状态**: 已审定，待实施

## 背景

当前 `/admin/*` 后台由 4 个独立页面组成（[app/admin/page.tsx](../../../app/admin/page.tsx) / [app/admin/article/page.tsx](../../../app/admin/article/page.tsx) / [app/admin/write/page.tsx](../../../app/admin/write/page.tsx) / [app/admin/project/page.tsx](../../../app/admin/project/page.tsx)），共 ~3100 行代码。主要问题：

1. **富文本编辑器代码在三个文件中各自重写**（重复 ~2000 行）
2. **文章管理与"写新文章"被拆成两个不同的页面**，体验割裂
3. **专栏（categories）只能 inline 管理**，没有"管理列表 + 编辑详情"的统一模式
4. **顶部 Tab 导航有限**，缺乏面向作者写作场景的全局快捷入口与状态可见性

## 目标

- 统一后台 Shell：左侧边栏导航 + 顶栏面包屑
- 文章 / 专栏 / 项目 三类内容统一为「同页 split：左列表 + 右编辑器」模式
- 富文本编辑器抽成共享组件 `<MarkdownEditor>`，文章页与项目页复用
- 删除 `/admin/write` 独立页，新建走 `/admin/articles?new=1`
- 增量能力：草稿自动保存到 localStorage（防误刷新 / 防崩溃）
- 视觉风格沿用现有 `var(--card)` `var(--primary)` 与 `glass` 类，不引新色板

## 非目标（YAGNI）

- 引入 Tiptap / ProseMirror / contentEditable WYSIWYG（保留 textarea + Markdown 字符串模型，零内容迁移）
- 全局 Cmd+K 搜索
- 文章批量操作、标签管理面板
- 文章 slug 重命名（涉及文件名重写 + 站内重定向）
- 实时 split 预览（编辑/预览同屏渲染）

## 架构总览

### 路由结构

| 路由 | 说明 |
|---|---|
| `/admin` | Server Component，`redirect('/admin/articles')` |
| `/admin/articles` | 文章管理（split: 列表 + 编辑/新建） |
| `/admin/categories` | 专栏管理（split: 列表 + 详情/封面/详细描述编辑） |
| `/admin/projects` | 项目管理（split: 列表 + 编辑/新建） |
| `/admin/about` | 关于我（保持单页表单） |
| `/admin/theme` | 主题设置（保持单页表单） |
| `/admin/stats` | 访问统计（保持单页只读） |
| `/admin/login` | 登录页（不嵌 shell） |

**删除路由**: `/admin/write`（功能由 `/admin/articles?new=1` 承接）

**重命名**: `/admin/article` → `/admin/articles`、`/admin/project` → `/admin/projects`（语义复数化、与 categories 一致）

**兼容性 redirect**（保留一个版本，下次清理移除）：
- `/admin/article` → `/admin/articles`
- `/admin/project` → `/admin/projects`
- `/admin/write` → `/admin/articles?new=1`

### 文件布局

```
app/admin/
  layout.tsx                       AdminShell 包裹（login 页豁免）
  page.tsx                         redirect('/admin/articles')
  login/page.tsx
  articles/page.tsx
  categories/page.tsx
  projects/page.tsx
  about/page.tsx
  theme/page.tsx
  stats/page.tsx

components/admin/
  AdminShell.tsx                   外壳（侧边栏 + 顶栏）
  Sidebar.tsx                      左侧导航
  NewMenu.tsx                      "+ 新建"下拉
  Topbar.tsx                       顶栏（面包屑 + 退出）
  SplitWorkspace.tsx               列表/编辑器 split 容器
  ai-write-modal.tsx               (现有) AI 写作
  feishu-import-modal.tsx          (新抽) 飞书导入
  MarkdownEditor/
    index.tsx                      <MarkdownEditor /> 主组件
    Toolbar.tsx                    工具栏
    dialogs/
      HeadingDialog.tsx
      TableDialog.tsx
      FontDialog.tsx
      ImageDialog.tsx
      CodeBlockDialog.tsx
      LinkDialog.tsx
    hooks/
      useEditorCommands.ts         exec / applyInlineStyle / wrapBlock
      useFullscreen.ts
      useImageUpload.ts
      useDraftAutosave.ts          localStorage debounce + 恢复 banner
    utils.ts
```

## §1 — Admin Shell

**[components/admin/AdminShell.tsx](../../../components/admin/AdminShell.tsx)**（client component）

```
┌─────────────────┬────────────────────────────────────────┐
│ Logo / 后台      │ 顶栏：面包屑 + 退出                       │
│  ─────────────  │ ────────────────────────────────────── │
│ + 新建        ▾ │                                        │
│  ─────────────  │                                        │
│ 内容             │                                        │
│  📄 文章         │           子页面内容区域                  │
│  📁 专栏         │                                        │
│  🚀 项目         │                                        │
│  ─────────────  │                                        │
│ 站点             │                                        │
│  👤 关于我       │                                        │
│  🎨 主题         │                                        │
│  📊 统计         │                                        │
└─────────────────┴────────────────────────────────────────┘
   宽度 ~240px         自适应剩余宽度
```

### 实现要点

1. **侧边栏条目**：`lucide-react` 图标 + 中文标签。Active 状态 = `bg-[var(--primary)]/10` 背景 + 左侧 2px primary 色条。条目分两组（"内容" / "站点"），中间细分隔线。
2. **+ 新建** 下拉：自定义弹层（不引第三方 dropdown），三选项：写文章 / 新项目 / 新专栏，分别跳到对应页 `?new=1`。
3. **顶栏**：左 = 由 `usePathname()` 自动生成的面包屑；右 = 退出登录（沿用 `LogOut` + `/api/auth/logout`）。
4. **响应式**：`md` 以上侧边栏常驻；`md` 以下侧边栏 fixed 隐藏，顶栏汉堡菜单触发 slide-in（CSS transform，不引 framer-motion）。
5. **Login 页豁免**：`layout.tsx` 中 `if (pathname === '/admin/login') return <>{children}</>`（layout 必须是 client component 以使用 `usePathname`）。
6. **风格**：沿用现有 `glass`、`var(--card)`、`var(--card-border)`、`var(--primary)` CSS 变量，不引新色板。

## §2 — MarkdownEditor 共享组件

把现有三处重复的 ~2000 行编辑器代码合并为一个组件。

**关键事实**: 本仓库的所有文章用 Markdown 字符串存盘 (`.md` 文件)，admin 后台编辑器是 `<textarea>` + `insertMarkdown(before, after)` + `renderPreview` 模式，不是 contentEditable WYSIWYG。新组件保留这一模型。

### Props 设计

```ts
interface MarkdownEditorProps {
  value: string;                                // 受控 Markdown 字符串
  onChange: (markdown: string) => void;
  placeholder?: string;
  toolbar?: {
    text?: boolean;       // 粗/斜/下划线/删除/上下标/高亮/行内代码 默认 true
    block?: boolean;      // 标题/列表/引用/分割线/表格              默认 true
    media?: boolean;      // 图片/链接/代码块                        默认 true
    typography?: boolean; // 字体/字号/字色/行高/段距 (插入 inline HTML span) 默认 true
  };
  fullscreen?: boolean;          // 默认 true
  preview?: boolean;             // 是否显示「预览」按钮，默认 true
  renderPreview?: (md: string) => { __html: string }; // 父级提供的渲染器；缺省内置一个
  className?: string;
  uploadEndpoint?: string;       // 默认 /api/upload
  uploadMeta?: { type?: string; category?: string; articleTitle?: string };
  /** 传值则启用草稿自动保存。命名规则：
   *  draft:articles:<slug|new>
   *  draft:projects:<slug|new>
   *  draft:categories:<name|new>
   */
  draftKey?: string;
}
```

> 命名：组件名为 `<MarkdownEditor>`（替代旧 spec 的 `<MarkdownEditor>`），更准确反映其工作模型。下文所有路径与文件名相应改为 `components/admin/MarkdownEditor/`。

### 关键决策

1. **受控**：父组件持有 Markdown 字符串，编辑器只渲染 `<textarea>` + 上抛 `value`。
2. **不引 Tiptap / contentEditable**：现有大量文章是 markdown 文本，迁移代价大且非本次目标；`insertMarkdown(before, after, replacement?)` 在光标/选区位置插入字符串。
3. **能力对齐**：现有三处编辑器的工具栏功能（粗/斜/下划线/删除线/上下标/高亮/行内代码 → markdown 标记；标题 → `# /## /...`；列表 → `- /1. `；引用 → `> `；分割线 → `\n---\n`；表格 → `| ... |\n`；图片 → `![](url)` 或 `<figure class="image-block">` HTML；代码块 → ` ```lang\n\n``` `；字体/字号/字色/行高/段距 → 嵌入 `<span style="...">` 内联 HTML）逐项保留。
4. **草稿自动保存**（`useDraftAutosave`）：
   - 监听 `value` 变化，debounce 1.5s 写入 `localStorage[draftKey] = JSON.stringify({ markdown, updatedAt: Date.now() })`
   - 编辑器 mount 时若发现本地草稿且 `updatedAt > openTime - 30s` 不弹（避免刚保存又弹）；其余情况显示 banner："**检测到未保存的草稿（X 分钟前）**　[恢复] [丢弃]"
   - 父组件保存成功后调用 `localStorage.removeItem(draftKey)` 清除
   - 草稿丢失阈值：7 天，过期自动清理
5. **AI 写作 / 飞书导入**：保留为独立组件，由父页面调用，通过 `onChange(markdown)` 把内容塞回编辑器，与编辑器解耦。
6. **预览**：编辑器内置「预览」按钮（沿用现有体验），切到预览态时把 `value` 喂给 `renderPreview()`（父级注入或缺省内置）渲染到右侧/全屏。父级可关闭 `preview={false}` 隐藏按钮。

## §3 — SplitWorkspace 容器

**[components/admin/SplitWorkspace.tsx](../../../components/admin/SplitWorkspace.tsx)**

```
┌──────────────────┬───────────────────────────────────────┐
│ 列表头部           │ 编辑器头部                              │
│  搜索框 + 过滤     │  状态徽章 / 保存 / 预览 / 删除             │
│ ──────────────── │ ─────────────────────────────────────  │
│ 项目 A  [草稿]     │                                        │
│ 项目 B  [已发布] ←  │   表单字段                              │
│ 项目 C            │   <MarkdownEditor>                     │
└──────────────────┴───────────────────────────────────────┘
   ~320px 固定          余量自适应
```

### Props

```ts
interface SplitWorkspaceProps<T> {
  items: T[];
  selectedId: string | null;       // null = 空态/新建态
  onSelect: (id: string | null) => void;
  renderRow: (item: T) => React.ReactNode;
  searchKeys?: (keyof T)[];
  filters?: Array<{ key: string; label: string; predicate: (i: T) => boolean }>;
  children: React.ReactNode;       // 父根据 selectedId 渲染好的 form
  newButtonLabel?: string;
  onNew?: () => void;
}
```

### URL 同步

- `?id=<slug>` 编辑某项
- `?new=1` 新建空表单
- 无参数：列表区显示，右侧空态提示「从左侧选择或点新建」

父页面用 `useSearchParams` 读、`router.push` 写。

### key 强制 unmount

切换 `selectedId` 时，父页面给 MarkdownEditor 传 `key={selectedId}` 强制 unmount，避免上一篇内容残留。

## §4 — 三页字段定义

### `/admin/articles`

**列表**：标题 / 字数 / 日期 / 分类徽章 / 草稿红点
**过滤**：全部 / 草稿 / 已发布
**搜索**：标题 + summary

| 字段 | 类型 | 说明 |
|---|---|---|
| 标题 | text | 必填 |
| Slug | text | 新建时可手动覆盖默认值；编辑时只读 |
| 摘要 | textarea | 选填 |
| 分类 | select | 来自 categories.yaml |
| 标签 | text | 逗号分隔 |
| 草稿 | checkbox | 默认勾上 |
| 正文 | MarkdownEditor | `draftKey: draft:articles:<slug|new>` |

**操作**：保存（POST `/api/publish` 新建 / PUT `/api/posts` 更新）/ 预览（弹层）/ 删除（confirm 后 DELETE `/api/posts`）/ AI 写作 / 飞书导入

### `/admin/categories`

新升格为独立页（原内嵌于 `/admin?tab=categories`）。

**列表**：名称 / 描述截断 / 关联文章数（统计 `posts.category === name`）
**搜索**：按名称

| 字段 | 类型 | 说明 |
|---|---|---|
| 名称 | text | 必填，唯一 |
| 描述 | textarea | 选填（短描述，列表/卡片用） |
| 背景预设 | select | gradient-1 ~ gradient-N |
| 背景透明度 | number | 0-100 |
| 详细描述 | MarkdownEditor | **新增字段** `description_long`（Markdown 字符串），渲染在 `/categories/<name>` 详情页 banner |

**API**：`/api/categories` 已有；新增可选字段 `description_long`，旧数据缺失时容错读为空字符串。

**前台**：`/categories/<name>` 详情页若有 `description_long` 则在标题下渲染 banner；为空时不渲染。

### `/admin/projects`

完全沿用现有 `/admin/project` 字段：name / desc / cover / techStack / highlights / githubUrl / demoUrl / content；正文用 MarkdownEditor，`draftKey: draft:projects:<slug|new>`。

## §5 — 迁移步骤

每步独立可 build / 可运行。

### Step 1：抽取 MarkdownEditor

- 物理剪切 `/admin/article/page.tsx` 的编辑器代码到 `components/admin/MarkdownEditor/`
- 让 `/admin/article/page.tsx` 改用新组件，验证可运行
- 同步 `/admin/project/page.tsx` 替换为新组件
- 暂保留 `/admin/write/page.tsx`（步骤 6 删除）

### Step 2：新建 AdminShell

- `app/admin/layout.tsx`：左侧边栏 + 顶栏 + login 豁免
- `components/admin/AdminShell.tsx` + `Sidebar.tsx` + `NewMenu.tsx` + `Topbar.tsx`
- 改造 `/admin/article` `/admin/project` 让其在 shell 中显示正常（旧 `/admin` 主页暂时不动）

### Step 3：路由复数化 + 升格子页

- 物理重命名 `/admin/article` → `/admin/articles`、`/admin/project` → `/admin/projects`
- 新建 `/admin/categories/page.tsx`、`/admin/about/page.tsx`、`/admin/theme/page.tsx`、`/admin/stats/page.tsx`
- 旧 `/admin/page.tsx` 改为 server component `redirect('/admin/articles')`
- 把原内嵌 tab 内容（关于我 / 专栏 / 项目 / 主题）拆移到对应 4 个新页

### Step 4：SplitWorkspace + 三页改造

- 抽 `components/admin/SplitWorkspace.tsx`
- `/admin/articles` 接入 split + URL 同步
- `/admin/projects` 接入 split
- `/admin/categories` 接入 split + 新增 `description_long`
- 后端 `/api/categories` 兼容新字段
- 前台 `/categories/<name>` 渲染 banner

### Step 5：草稿自动保存

- 在 MarkdownEditor 实现 `useDraftAutosave`（debounce 1.5s + 恢复 banner + 保存后清除）
- 文章页 / 项目页传入对应 `draftKey`

### Step 6：清理 + 验收

- 删 `/admin/write`，给旧路径加 redirect
- `npm run lint`、`npm run type-check`、`npm run build` 全过
- 手动验：登录 → 各 tab 切换 → 文章新建/编辑/删除/草稿恢复 → 项目新建/编辑 → 专栏新建/编辑 → 关于我/主题/统计正常

## §6 — 兼容性

- **现有文章/项目内容**：HTML 字符串直接进 contentEditable，零格式迁移
- **API 字段**：仅 `/api/categories` 新增可选 `description_long`，旧数据缺失时容错为空
- **旧链接**：保留 `/admin/article`、`/admin/project`、`/admin/write` 的 thin redirect，下次清理移除
- **Edge Runtime**：本次只动 `/admin/*` 页面（Node Runtime），不动 `middleware.ts`，无新 Edge crypto 风险

## §7 — 风险与缓解

| 风险 | 概率 | 缓解 |
|---|---|---|
| MarkdownEditor 抽取过程中行为微差异（contentEditable 状态保持、selection range 丢失） | 中 | 一次只迁一处页面，迁完逐项过工具栏，再迁第二处 |
| 草稿 banner 误触发（updatedAt 时间戳混乱） | 低 | 草稿存 `{ html, updatedAt }`，仅当 `updatedAt > openTime - 30s` 不弹；banner 提供"丢弃" |
| URL `?id=` 切换时编辑器内容残留上一篇 | 中 | 父给 MarkdownEditor 传 `key={selectedId}` 强制 unmount |
| categories.yaml 新字段被人手编辑后 markdown 异常 | 低 | 用 `js-yaml` 序列化（自动处理多行/特殊字符），新字段命名 `description_long` 明确语义 |
| 前台分类详情页未实现 banner 渲染时新功能形同虚设 | 中 | Step 4 同步改前台 `/categories/<name>` 页 |

## §8 — 验证清单（实施完成后必跑）

- [ ] `npm run type-check`（清空 [app/admin/article/page.tsx:430](../../../app/admin/article/page.tsx#L430) 的既有错误为前置）
- [ ] `npm run lint`
- [ ] `npm run build`（含 prebuild 索引/sitemap/rss）
- [ ] `npm run dev` 启动 → 登录 → 5 个子页冒烟（articles/categories/projects/about/theme/stats）
- [ ] 新建一篇文章并发布、新建一个项目、新建一个专栏（写详细描述）
- [ ] 关闭浏览器再开 → 草稿恢复 banner 正常

## §9 — 不在本次范围

- Tiptap 迁移
- 全局 Cmd+K 搜索
- 文章批量操作 / 标签管理面板
- 实时 split 预览
- 文章 slug 重命名（要重写文件名 + 重定向）
