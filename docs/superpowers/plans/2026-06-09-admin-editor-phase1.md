# 后台编辑器重构 Phase 1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (或 subagent-driven-development) 逐任务实现。步骤用 `- [ ]` 复选框跟踪。

**Goal:** 把文章编辑器重构为「三栏 + 检视器 + 源码/分屏/预览」布局，分屏预览用服务端正式管线渲染（与成品一致）。

**Architecture:** 新增服务端预览接口 `/api/admin/preview`；新增 `usePreviewRender`（防抖+缓存）、`useEditorLayout`（布局记忆）两个 hook；改造 `MarkdownEditor` 为支持 edit/split/preview 三视图的 `SplitMarkdownEditor`；新增 `InspectorSection`/`EditorInspector`/`EditorChrome` 布局组件；最后把 `app/admin/articles/page.tsx` 接入新布局，把元信息搬进检视器。

**Tech Stack:** Next.js 14 App Router、React 18、TypeScript、Tailwind、lucide-react、remark/rehype（既有 `renderMarkdownToHtml`）。

**验证说明:** 本仓库无单测框架。每个任务的「验证」= `npm run type-check`、`npm run lint`、必要时隔离 `NEXT_DIST_DIR=.next.build npm run build`，API 用已登录 `curl` E2E（开发服务器在 `localhost:3001`，密码取自 `.env.local` 的 `ADMIN_PASSWORD`，**勿动 3000 生产**）。提交前还原 prebuild 改写的 `public/{sitemap.xml,rss.xml,knowledge-index.json,search-index.json}`；不提交 `data/*`、`tsconfig.json`、`.claude/settings.local.json`。

---

## Task 1: 服务端预览接口 `/api/admin/preview`

**Files:**
- Create: `app/api/admin/preview/route.ts`
- Modify: `middleware.ts`（把路径加入 `READ_PROTECTED_API_PATHS`）

- [ ] **Step 1: 创建路由**

`app/api/admin/preview/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { renderMarkdownToHtml } from "../../../../lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { markdown } = await req.json();
    if (typeof markdown !== "string") {
      return NextResponse.json({ error: "缺少 markdown" }, { status: 400 });
    }
    const html = await renderMarkdownToHtml(markdown);
    return NextResponse.json({ html });
  } catch (error) {
    return NextResponse.json(
      { error: "渲染失败：" + (error as Error).message },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 纳入读保护**

`middleware.ts` 把 `"/api/admin/preview"` 加进 `READ_PROTECTED_API_PATHS` 数组（与 `/api/admin/overview` 同列）。

- [ ] **Step 3: 验证编译**

Run: `npm run type-check && npm run lint`
Expected: 均无错误。

- [ ] **Step 4: E2E 验证（鉴权 + 渲染）**

Run:
```bash
cd /home/ubuntu/projects/micro-ai-blog
echo "unauth(应401): $(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/admin/preview -H 'Content-Type: application/json' -d '{"markdown":"# hi"}')"
PW=$(grep -m1 '^ADMIN_PASSWORD=' .env.local | cut -d= -f2- | tr -d '"'"'"'')
J=$(mktemp); curl -s -c "$J" -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d "{\"password\":$(printf '%s' "$PW" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')}" >/dev/null
echo "callout 渲染(应含 callout class):"
curl -s -b "$J" -X POST http://localhost:3001/api/admin/preview -H 'Content-Type: application/json' -d '{"markdown":"> [!NOTE]\n> 提示内容"}' | python3 -c 'import json,sys;print("callout" in json.load(sys.stdin)["html"])'
rm -f "$J"
```
Expected: `unauth(应401): 401`；callout 渲染打印 `True`。

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/preview/route.ts middleware.ts
git commit -m "feat(admin): 服务端预览接口 /api/admin/preview（正式管线渲染）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `usePreviewRender` hook（防抖 + 缓存）

**Files:**
- Create: `components/admin/MarkdownEditor/hooks/usePreviewRender.ts`

- [ ] **Step 1: 实现 hook**

```ts
import { useEffect, useRef, useState } from "react";

const cache = new Map<string, string>();
const MAX_CACHE = 30;

/** 防抖调用服务端预览接口，返回渲染后的 HTML。相同输入命中内存缓存。 */
export function usePreviewRender(markdown: string, enabled: boolean, delay = 400) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const cached = cache.get(markdown);
    if (cached !== undefined) {
      setHtml(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown }),
        });
        const data = await res.json();
        if (id !== reqId.current) return; // 已有更新请求，丢弃过期结果
        const rendered = typeof data.html === "string" ? data.html : "";
        cache.set(markdown, rendered);
        if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
        setHtml(rendered);
      } catch {
        if (id === reqId.current) setHtml('<p class="text-[var(--muted)] text-sm">预览渲染失败</p>');
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [markdown, enabled, delay]);

  return { html, loading };
}
```

- [ ] **Step 2: 验证编译**

Run: `npm run type-check && npm run lint`
Expected: 无错误（hook 暂未被使用，仅确认类型/语法）。

- [ ] **Step 3: Commit**

```bash
git add components/admin/MarkdownEditor/hooks/usePreviewRender.ts
git commit -m "feat(admin): usePreviewRender — 防抖调用预览接口 + 缓存

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `useEditorLayout` hook（布局记忆）

**Files:**
- Create: `components/admin/hooks/useEditorLayout.ts`

- [ ] **Step 1: 实现 hook**

```ts
"use client";

import { useEffect, useState } from "react";

export type ViewMode = "edit" | "split" | "preview";

const KEY = "admin:editor:layout";

type Layout = { viewMode: ViewMode; inspectorOpen: boolean };

function read(): Layout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Layout>;
    const viewMode: ViewMode =
      v.viewMode === "edit" || v.viewMode === "split" || v.viewMode === "preview"
        ? v.viewMode
        : "split";
    return { viewMode, inspectorOpen: v.inspectorOpen !== false };
  } catch {
    return null;
  }
}

/** 记忆编辑器视图模式与检视器开合，跨文章共享，存 localStorage。 */
export function useEditorLayout() {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [inspectorOpen, setInspectorOpen] = useState(true);

  useEffect(() => {
    const saved = read();
    if (saved) {
      setViewMode(saved.viewMode);
      setInspectorOpen(saved.inspectorOpen);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ viewMode, inspectorOpen }));
    } catch {
      /* 忽略写入失败 */
    }
  }, [viewMode, inspectorOpen]);

  return { viewMode, setViewMode, inspectorOpen, setInspectorOpen };
}
```

- [ ] **Step 2: 验证编译**

Run: `npm run type-check && npm run lint`
Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add components/admin/hooks/useEditorLayout.ts
git commit -m "feat(admin): useEditorLayout — 记忆视图模式与检视器开合

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `MarkdownEditor` 升级为三视图（edit/split/preview）+ 服务端预览 + 同步滚动

**Files:**
- Modify: `components/admin/MarkdownEditor/index.tsx`
- Modify: `components/admin/MarkdownEditor/Toolbar.tsx`（视图段控替换原「预览」按钮）

**接口变更:** `MarkdownEditorProps` 新增可选 `viewMode?: ViewMode` 与 `onViewModeChange?: (m: ViewMode) => void`（受控）。未传时内部自管，默认 `"edit"`（保持其它调用方行为不变）。

- [ ] **Step 1: Toolbar 用段控替换预览按钮**

`Toolbar.tsx`：把 `onTogglePreview/previewActive` 两个 prop 替换为 `viewMode?: ViewMode` 与 `onViewMode?: (m: ViewMode) => void`。在工具栏右侧（`ml-auto`）渲染三段控：
```tsx
{props.onViewMode && (
  <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-[var(--card-border)] p-0.5">
    {(["edit", "split", "preview"] as const).map((m) => (
      <button
        key={m}
        type="button"
        onClick={() => props.onViewMode!(m)}
        aria-pressed={props.viewMode === m}
        className={`px-2 py-0.5 text-xs rounded transition-colors ${
          props.viewMode === m
            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
            : "text-[var(--muted)] hover:text-[var(--primary)]"
        }`}
      >
        {m === "edit" ? "编辑" : m === "split" ? "分屏" : "预览"}
      </button>
    ))}
  </div>
)}
```
顶部 import 增加 `import type { ViewMode } from "../hooks/useEditorLayout";`，`ToolbarProps` 删除 `onTogglePreview/previewActive`，新增 `viewMode?: ViewMode; onViewMode?: (m: ViewMode) => void;`。

- [ ] **Step 2: index.tsx 接入三视图 + 服务端预览**

`components/admin/MarkdownEditor/index.tsx`：
- import：`import { usePreviewRender } from "./hooks/usePreviewRender";` 和 `import type { ViewMode } from "../hooks/useEditorLayout";`。
- `MarkdownEditorProps` 删除 `preview?: boolean`，新增 `viewMode?: ViewMode; onViewModeChange?: (m: ViewMode) => void;`。
- 组件内部：受控/非受控视图模式：
```tsx
const [innerMode, setInnerMode] = useState<ViewMode>("edit");
const mode = viewMode ?? innerMode;
const setMode = onViewModeChange ?? setInnerMode;
const previewOn = mode === "split" || mode === "preview";
const { html: previewHtml } = usePreviewRender(value, previewOn);
```
- 删除旧的 `showPreview` 状态与旧 `<Preview render=.../>` 用法（预览改用 `previewHtml`）。
- Toolbar 传参改为 `viewMode={mode}` `onViewMode={setMode}`（删除 `onTogglePreview/previewActive`）。
- 正文区按模式渲染：
```tsx
<div className={`flex gap-3 ${isFullscreen ? "flex-1 min-h-0" : ""}`}>
  {mode !== "preview" && (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onScroll={mode === "split" ? syncScroll : undefined}
      placeholder={placeholder}
      className={`px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none text-sm leading-relaxed font-mono ${isFullscreen ? "flex-1 min-h-0" : "min-h-[400px]"} ${mode === "split" ? "w-1/2" : "w-full"}`}
    />
  )}
  {previewOn && (
    <div
      ref={previewRef}
      className={`prose-custom overflow-auto rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 ${isFullscreen ? "flex-1 min-h-0" : "min-h-[400px]"} ${mode === "split" ? "w-1/2" : "w-full"}`}
      dangerouslySetInnerHTML={{ __html: previewHtml || '<span class="text-[var(--muted)] text-sm">开始输入以预览…</span>' }}
    />
  )}
</div>
```
- 同步滚动：新增 `const previewRef = useRef<HTMLDivElement>(null);` 和
```tsx
const syncScroll = () => {
  const ta = textareaRef.current, pv = previewRef.current;
  if (!ta || !pv) return;
  const ratio = ta.scrollTop / (ta.scrollHeight - ta.clientHeight || 1);
  pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
};
```
- 保留 `useDraftAutosave`、`useFullscreen`、图片上传、`detectedDraft` 恢复条不变。
- `Preview.tsx` 不再被 index 使用（保留文件以防其它引用；如无其它引用可在 Task 末顺带删除——先 `grep` 确认）。

- [ ] **Step 3: 处理旧调用方（articles 页暂时仍用旧 props 会报错）**

本任务只保证 `MarkdownEditor` 自身类型自洽。`app/admin/articles/page.tsx` 仍传 `renderPreview`（已无该 prop）会类型报错——**在 Task 7 一并改造**。因此本任务的 type-check 在 articles 改造前可能失败于 articles 文件。为隔离：本步先 `grep -rn "renderPreview\|MarkdownEditor" app components` 确认仅 `app/admin/articles/page.tsx` 使用，记录待 Task 7 修。

- [ ] **Step 4: 验证（仅编译 MarkdownEditor 子树）**

Run: `npx tsc --noEmit 2>&1 | grep -i "MarkdownEditor/" || echo "MarkdownEditor 子树无类型错误"`
Expected: 打印「MarkdownEditor 子树无类型错误」（articles 页的错误留待 Task 7）。

- [ ] **Step 5: 暂不单独 commit**

说明：Task 4 与 Task 7 的 articles 改造耦合，合并在 Task 7 末一起验证并提交，避免中间态 build 失败。先不提交，继续 Task 5/6（独立文件，可各自提交）。

---

## Task 5: `InspectorSection` + `EditorInspector`

**Files:**
- Create: `components/admin/inspector/InspectorSection.tsx`
- Create: `components/admin/inspector/EditorInspector.tsx`

- [ ] **Step 1: InspectorSection（可折叠分组，折叠态持久化）**

```tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface InspectorSectionProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function InspectorSection({ id, title, icon, defaultOpen = true, children }: InspectorSectionProps) {
  const key = `admin:inspector:section:${id}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(key);
      if (v != null) setOpen(v === "1");
    } catch {
      /* ignore */
    }
  }, [key]);

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <section className="border-b border-[var(--card-border)] last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {icon}
        {title}
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </section>
  );
}
```

- [ ] **Step 2: EditorInspector（右栏容器，宽屏并排 / 窄屏抽屉）**

```tsx
"use client";

import { X } from "lucide-react";

interface EditorInspectorProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** 检视器容器：xl 以上为右侧常驻栏（由 EditorChrome 控制是否渲染），
 *  xl 以下为右侧滑出抽屉。open 控制抽屉显隐。 */
export function EditorInspector({ open, onClose, children }: EditorInspectorProps) {
  return (
    <>
      {/* 窄屏抽屉遮罩 */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity xl:hidden ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`bg-[var(--card)]/40 backdrop-blur border-l border-[var(--card-border)] overflow-y-auto
          xl:static xl:w-[300px] xl:shrink-0 xl:translate-x-0
          fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] transition-transform duration-200
          ${open ? "translate-x-0" : "translate-x-full xl:translate-x-0"}`}
      >
        <div className="flex items-center justify-between px-3 h-11 border-b border-[var(--card-border)] xl:hidden">
          <span className="text-sm font-semibold">文章设置</span>
          <button onClick={onClose} aria-label="关闭" className="p-1 text-[var(--muted)] hover:text-[var(--foreground)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
```

- [ ] **Step 3: 验证编译**

Run: `npm run type-check 2>&1 | grep -i "inspector/" || echo "inspector 无类型错误"` 然后 `npm run lint`
Expected: 「inspector 无类型错误」；lint 通过。

- [ ] **Step 4: Commit**

```bash
git add components/admin/inspector/InspectorSection.tsx components/admin/inspector/EditorInspector.tsx
git commit -m "feat(admin): 检视器骨架 InspectorSection/EditorInspector

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `EditorChrome` 布局（写作区 + 检视器，响应式）

**Files:**
- Create: `components/admin/EditorChrome.tsx`

- [ ] **Step 1: 实现**

```tsx
"use client";

import { PanelRight } from "lucide-react";
import { EditorInspector } from "./inspector/EditorInspector";

interface EditorChromeProps {
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  inspector: React.ReactNode;
  children: React.ReactNode; // 写作区
}

/** 把「写作区 + 检视器」并排；xl 以上检视器常驻（受 inspectorOpen 控制宽度收起），
 *  xl 以下检视器为抽屉（inspectorOpen 控制显隐）。 */
export function EditorChrome({ inspectorOpen, onToggleInspector, inspector, children }: EditorChromeProps) {
  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        {/* 唤出/收起检视器按钮 */}
        <button
          type="button"
          onClick={onToggleInspector}
          aria-pressed={inspectorOpen}
          title="检视器"
          className={`fixed xl:absolute right-3 top-3 z-30 inline-flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1 text-xs transition-colors ${inspectorOpen ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--primary)]"}`}
        >
          <PanelRight className="h-3.5 w-3.5" />检视器
        </button>
        {children}
      </div>
      {/* xl 常驻栏：inspectorOpen=false 时宽度收 0 */}
      <div className={`hidden xl:block transition-all ${inspectorOpen ? "w-[300px]" : "w-0 overflow-hidden"}`}>
        {inspectorOpen && inspector}
      </div>
      {/* xl 以下抽屉 */}
      <div className="xl:hidden">
        <EditorInspector open={inspectorOpen} onClose={onToggleInspector}>
          {inspector}
        </EditorInspector>
      </div>
    </div>
  );
}
```

> 注：`EditorInspector` 已自带 xl 常驻样式，但此处为简化控制，xl 常驻由 `EditorChrome` 外层 `div` 负责宽度收起，抽屉仅用于 < xl。实现时若发现 `EditorInspector` 的 `xl:static` 与此重复，以 `EditorChrome` 的包裹为准，把 `EditorInspector` 仅用于抽屉场景（去掉其 `xl:` 类）。**实现者按实际渲染效果二选一，保证：xl 并排可收起、< xl 抽屉。**

- [ ] **Step 2: 验证编译**

Run: `npm run type-check 2>&1 | grep -i "EditorChrome" || echo "EditorChrome 无类型错误"`；`npm run lint`
Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add components/admin/EditorChrome.tsx
git commit -m "feat(admin): EditorChrome — 写作区 + 检视器响应式布局

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: 文章编辑器接入新布局（核心整合）

**Files:**
- Modify: `app/admin/articles/page.tsx`

**目标:** 用 `EditorChrome` 包裹；正文用升级后的 `MarkdownEditor`（受控 `viewMode`）；把
封面/摘要/分类/标签/发布日期/定时/质量SEO/OG 从原竖排搬进 `EditorInspector` 的 `InspectorSection` 分组；
顶部保留标题输入与操作按钮组（飞书/AI/语法/历史/清除/删除/保存草稿/发布）。

- [ ] **Step 1: 引入新依赖与布局状态**

在 `ArticleEditor` 顶部：
```tsx
import { useEditorLayout } from "../../../components/admin/hooks/useEditorLayout";
import { EditorChrome } from "../../../components/admin/EditorChrome";
import { EditorInspector } from "../../../components/admin/inspector/EditorInspector"; // 若 EditorChrome 已内含抽屉则不需要
import { InspectorSection } from "../../../components/admin/inspector/InspectorSection";
```
组件内：`const { viewMode, setViewMode, inspectorOpen, setInspectorOpen } = useEditorLayout();`

- [ ] **Step 2: 重排 JSX 结构**

把原编辑卡片拆成两部分：
- **写作区**（EditorChrome 的 children）：标题大输入框 + `MarkdownEditor`（传 `viewMode={viewMode} onViewModeChange={setViewMode}`，去掉已废弃的 `renderPreview`）。把「实时写作反馈条」保留在写作区底部。
- **检视器**（EditorChrome 的 inspector）：依次放
  - `InspectorSection id="publish" title="发布"`：草稿开关 + 定时发布开关 + datetime + 发布日期（搬原 meta 面板里的这些控件）。
  - `InspectorSection id="taxonomy" title="分类与标签"`：分类 select + 标签 input。
  - `InspectorSection id="cover" title="封面"`：封面地址 input + 上传按钮 +（新增）缩略图 `<img>` 预览。
  - `InspectorSection id="summary" title="摘要"`：摘要 textarea。
  - `InspectorSection id="quality" title="质量与 SEO"`：把反馈条里的质量评分/各项建议也在此罗列（写作区底部保留精简版，检视器内为完整版——为避免重复，**质量明细只放检视器**，写作区底部仅留字数/阅读时长/上次保存）。
  - `InspectorSection id="og" title="OG 预览"`：原 OG 折叠预览（去掉自管折叠，由 section 管）。
- 顶层 `return`：
```tsx
return (
  <div className="h-[calc(100vh-3.5rem)] flex flex-col">
    <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-[var(--card-border)] gap-2">
      {/* 标题占位/页签 + 操作按钮组（原 header 的按钮搬这里） */}
    </div>
    <EditorChrome
      inspectorOpen={inspectorOpen}
      onToggleInspector={() => setInspectorOpen(!inspectorOpen)}
      inspector={/* 上述 InspectorSection 组合 */}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* 标题输入 + MarkdownEditor + 精简反馈条 */}
      </div>
    </EditorChrome>
    {/* 既有弹层：飞书导入 / AiWriteModal / SyntaxCheatsheet / 修订历史 保持不变 */}
  </div>
);
```
> 注意：`SplitWorkspace` 的右侧 pane 现在容纳这个 `h-[calc(100vh-3.5rem)]` 布局。确认 `SplitWorkspace` 右栏允许其子项撑满高度（它是 `flex-1 overflow-y-auto`；本布局自身管理滚动，必要时把外层 `overflow-y-auto` 影响纳入考虑——实现时核对滚动只发生在写作区与检视器内部，不双滚动）。

- [ ] **Step 3: 删除/迁移废弃片段**

- 删除原 `metaExpanded` 折叠 meta 面板与其按钮（控件已搬入检视器；`metaExpanded` 状态删除）。
- 删除原 `showOg` 自管折叠（由 `InspectorSection id="og"` 接管；OG 的 `ogUrl` 防抖 effect 保留，`showOg` 改为「og section 是否展开」无需感知——可让 effect 始终在 `articleTitle` 变化时更新 `ogUrl`，或保留一个布尔仅用于「是否已展开过再请求」。简单起见：保留 `showOg` 但由 OG section 的可见性驱动；实现者择一，确保不展开时不请求）。
- 原「实时写作反馈条」拆分：写作区底部留 `字数/阅读时长/上次保存/⌘S 提示`；质量评分明细移入检视器 quality section。

- [ ] **Step 4: 验证编译 + lint**

Run: `npm run type-check && npm run lint`
Expected: 全仓库均无错误（此时 Task 4 的改造也随 articles 落地，类型自洽）。

- [ ] **Step 5: 隔离构建**

Run: `git checkout public/knowledge-index.json public/rss.xml public/search-index.json public/sitemap.xml 2>/dev/null; NEXT_DIST_DIR=.next.build npm run build 2>&1 | grep -E "Compiled successfully|Failed|error" | head`
Expected: `✓ Compiled successfully`。

- [ ] **Step 6: 手动 + E2E 核对**

- 登录 `localhost:3001/admin/articles?new=1`，确认：三栏可见、视图段控（编辑/分屏/预览）切换正常、分屏右侧为服务端渲染（输入 `> [!NOTE]\n> x` 出现样式化提示框、代码块有高亮）、检视器各 section 折叠记忆、封面缩略图、质量评分、OG 预览、⌘S/⌘Enter、保存/草稿/定时/历史 均可用。
- 暗/亮双模各看一遍。
- 选一篇已有文章编辑，确认日期回填、保存后日期不被重置（回归既有修复）。

- [ ] **Step 7: Commit（含 Task 4 改造）**

```bash
git checkout public/knowledge-index.json public/rss.xml public/search-index.json public/sitemap.xml 2>/dev/null
git add components/admin/MarkdownEditor/index.tsx components/admin/MarkdownEditor/Toolbar.tsx app/admin/articles/page.tsx
git commit -m "feat(admin): 文章编辑器三栏检视器布局 + 源码/分屏/预览(保真)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review 结论（写计划时自检）

- **Spec 覆盖**：§2 布局→Task 6/7；§3 预览保真→Task 1/2 + Task 4 接入；§4 组件→Task 1–7 全覆盖；
  §5 数据流→Task 2/3/7；§6 交互（段控默认、检视器抽屉、键盘、全屏）→Task 4/6/7；§7 Phase 1 范围=本计划；§8 验证→各 Task 验证步。
  Phase 2/3（项目/关于/专栏、移动端收尾）**不在本计划**，留作后续 plan。
- **占位扫描**：无 TBD/TODO；含取舍说明处均给了「实现者二选一 + 必须满足的约束」，非空泛占位。
- **类型一致**：`ViewMode` 定义于 Task 3（`useEditorLayout.ts`），Task 4 的 Toolbar/index 从该处 import，命名一致；
  `usePreviewRender(markdown, enabled, delay)`、`useEditorLayout()` 返回字段在 Task 7 使用处一致。
- **已知耦合**：Task 4 与 Task 7 合并提交（中间态会暂不自洽），计划已显式说明，避免半截 build 失败。
