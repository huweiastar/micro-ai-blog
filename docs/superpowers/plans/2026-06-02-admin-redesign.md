# Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `/admin/*` into a unified Shell with sidebar navigation, three list/editor split pages (articles, categories, projects), one shared `<RichTextEditor>` component, and localStorage draft autosave.

**Architecture:** App-router layout-based shell. Three split pages share a `<SplitWorkspace>` container. Editor extracted from 3 duplicated implementations into `components/admin/RichTextEditor/`. Categories gets a new `description_long` HTML field rendered on the public detail page. Migration is staged in 6 sequential steps; each leaves the app in a runnable state.

**Tech Stack:** Next.js 14 App Router · React 18 · TypeScript · Tailwind · contentEditable + execCommand · localStorage · js-yaml · gray-matter

**Spec:** [docs/superpowers/specs/2026-06-02-admin-redesign-design.md](../specs/2026-06-02-admin-redesign-design.md)

**Verification (no test framework):** This codebase has no test runner. Verify each task with `npm run type-check`, `npm run lint`, `npm run build` (where indicated), and dev-server smoke (curl + visual). Each task that ships UI ends with a manual smoke checklist.

**Branch:** `feat/admin-redesign` (already created)

---

## File Structure (all new/modified files)

| Path | Action | Responsibility |
|---|---|---|
| `components/admin/RichTextEditor/index.tsx` | Create | Main controlled editor |
| `components/admin/RichTextEditor/Toolbar.tsx` | Create | Toolbar buttons |
| `components/admin/RichTextEditor/dialogs/HeadingDialog.tsx` | Create | Heading level picker |
| `components/admin/RichTextEditor/dialogs/TableDialog.tsx` | Create | Rows/cols picker |
| `components/admin/RichTextEditor/dialogs/FontDialog.tsx` | Create | Font/size/color/spacing |
| `components/admin/RichTextEditor/dialogs/ImageDialog.tsx` | Create | Image insert |
| `components/admin/RichTextEditor/dialogs/CodeBlockDialog.tsx` | Create | Code-block lang picker |
| `components/admin/RichTextEditor/dialogs/LinkDialog.tsx` | Create | Link URL |
| `components/admin/RichTextEditor/hooks/useEditorCommands.ts` | Create | exec/applyInlineStyle/wrapBlock |
| `components/admin/RichTextEditor/hooks/useFullscreen.ts` | Create | Fullscreen sync |
| `components/admin/RichTextEditor/hooks/useImageUpload.ts` | Create | POST /api/upload |
| `components/admin/RichTextEditor/hooks/useDraftAutosave.ts` | Create | localStorage debounce + restore |
| `components/admin/RichTextEditor/utils.ts` | Create | escapeHtml/serialize helpers |
| `components/admin/AdminShell.tsx` | Create | Shell wrapper |
| `components/admin/Sidebar.tsx` | Create | Left navigation |
| `components/admin/NewMenu.tsx` | Create | "+ 新建" dropdown |
| `components/admin/Topbar.tsx` | Create | Breadcrumb + logout |
| `components/admin/SplitWorkspace.tsx` | Create | List + editor split container |
| `app/admin/layout.tsx` | Create | Shell wrapper layout (login excluded) |
| `app/admin/page.tsx` | Modify | Replace tab UI with `redirect('/admin/articles')` |
| `app/admin/articles/page.tsx` | Create | (rename from `article/`) split page |
| `app/admin/categories/page.tsx` | Create | New split page |
| `app/admin/projects/page.tsx` | Create | (rename from `project/`) split page |
| `app/admin/about/page.tsx` | Create | About form (lift from main page) |
| `app/admin/theme/page.tsx` | Create | Theme form (lift from main page) |
| `app/admin/stats/page.tsx` | Create | Stats viewer (lift if exists, else placeholder) |
| `app/admin/article/page.tsx` | Modify→Delete | Thin redirect, then deleted |
| `app/admin/project/page.tsx` | Modify→Delete | Thin redirect, then deleted |
| `app/admin/write/page.tsx` | Modify→Delete | Thin redirect, then deleted |
| `lib/categories.ts` | Modify | Add `description_long?: string` to type |
| `app/api/categories/route.ts` | Modify | Persist `description_long` field |
| `app/categories/[category]/page.tsx` | Modify | Render `description_long` banner |
| `components/admin/ai-write-modal.tsx` | (no change) | Reused as-is |

---

## Phase Index

- [Phase 1: RichTextEditor Extraction](#phase-1) — Tasks 1-6
- [Phase 2: Admin Shell Skeleton](#phase-2) — Tasks 7-9
- [Phase 3: Route Restructure](#phase-3) — Tasks 10-13
- [Phase 4: Articles Split Page](#phase-4) — Task 14
- [Phase 5: Projects Split Page](#phase-5) — Task 15
- [Phase 6: Categories Split Page + description_long](#phase-6) — Tasks 16-18
- [Phase 7: Draft Autosave](#phase-7) — Task 19
- [Phase 8: Cleanup + Final Build](#phase-8) — Tasks 20-22

---

<a id="phase-1"></a>
## Phase 1 — RichTextEditor Extraction

The current 3 admin pages each carry an identical contentEditable editor. Extract verbatim (no behavior change) into one shared component, then the new pages can simply use it.

### Task 1: Scaffold the RichTextEditor module shell

**Files:**
- Create: `components/admin/RichTextEditor/index.tsx`
- Create: `components/admin/RichTextEditor/utils.ts`

- [ ] **Step 1: Create `utils.ts` with helpers extracted from current article page**

```ts
// components/admin/RichTextEditor/utils.ts
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Replace contentEditable selection with the given HTML, falling back to append. */
export function insertHtmlAtCursor(html: string): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    document.execCommand("insertHTML", false, html);
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const frag = tpl.content;
  const lastNode = frag.lastChild;
  range.insertNode(frag);
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.setEndAfter(lastNode);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}
```

- [ ] **Step 2: Create skeleton `index.tsx` with Props + minimal contentEditable**

```tsx
// components/admin/RichTextEditor/index.tsx
"use client";

import { useEffect, useRef } from "react";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  toolbar?: {
    text?: boolean;
    block?: boolean;
    media?: boolean;
    typography?: boolean;
  };
  fullscreen?: boolean;
  className?: string;
  uploadEndpoint?: string;
  draftKey?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value changes only when DOM differs (avoid caret jump)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className={className}>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="min-h-[400px] p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 prose prose-invert max-w-none"
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify type-check**

Run: `npm run type-check`
Expected: only the existing `app/admin/article/page.tsx(430,10)` error (unrelated).

- [ ] **Step 4: Commit**

```bash
git add components/admin/RichTextEditor/
git commit -m "feat(admin): scaffold RichTextEditor shell

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Extract editor command hooks

**Files:**
- Create: `components/admin/RichTextEditor/hooks/useEditorCommands.ts`
- Create: `components/admin/RichTextEditor/hooks/useFullscreen.ts`
- Create: `components/admin/RichTextEditor/hooks/useImageUpload.ts`

- [ ] **Step 1: Read source to find current command implementations**

Open [app/admin/article/page.tsx](../../../app/admin/article/page.tsx) and identify these helpers (search by name):
- `exec(command, value?)` - wraps `document.execCommand`
- `applyInlineStyle(prop, value)` - applies inline CSS style to selection
- `wrapInlineSelection(tag)` / `surroundSelection(node)` - wraps current selection
- `insertCodeBlock(lang)` / `insertTable(rows, cols)`
- `toggleFullscreen()` - uses `requestFullscreen()`
- `uploadImage(file)` - posts to `/api/upload`

- [ ] **Step 2: Create `useEditorCommands.ts` mirroring those exact behaviors**

```ts
// components/admin/RichTextEditor/hooks/useEditorCommands.ts
"use client";

import { RefObject, useCallback } from "react";
import { insertHtmlAtCursor, escapeHtml } from "../utils";

export function useEditorCommands(
  editorRef: RefObject<HTMLDivElement>,
  onChange: (html: string) => void,
) {
  const sync = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [editorRef, onChange]);

  const exec = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      sync();
    },
    [editorRef, sync],
  );

  const applyInlineStyle = useCallback(
    (prop: string, val: string, mode: "selection" | "global" = "selection") => {
      const root = editorRef.current;
      if (!root) return;
      root.focus();
      if (mode === "global") {
        (root.style as unknown as Record<string, string>)[prop] = val;
        sync();
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      (span.style as unknown as Record<string, string>)[prop] = val;
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.addRange(newRange);
      } catch {
        /* noop */
      }
      sync();
    },
    [editorRef, sync],
  );

  const insertHtml = useCallback(
    (html: string) => {
      editorRef.current?.focus();
      insertHtmlAtCursor(html);
      sync();
    },
    [editorRef, sync],
  );

  const insertCodeBlock = useCallback(
    (lang: string) => {
      const html = `<pre data-lang="${escapeHtml(lang)}"><code class="language-${escapeHtml(lang)}"></code></pre><p><br/></p>`;
      insertHtml(html);
    },
    [insertHtml],
  );

  const insertTable = useCallback(
    (rows: number, cols: number) => {
      const cells = (count: number, tag: "th" | "td") =>
        Array.from({ length: count }, () => `<${tag}>&nbsp;</${tag}>`).join("");
      const head = `<thead><tr>${cells(cols, "th")}</tr></thead>`;
      const body = `<tbody>${Array.from({ length: rows - 1 }, () => `<tr>${cells(cols, "td")}</tr>`).join("")}</tbody>`;
      insertHtml(`<table class="border-collapse">${head}${body}</table><p><br/></p>`);
    },
    [insertHtml],
  );

  return { exec, applyInlineStyle, insertHtml, insertCodeBlock, insertTable, sync };
}
```

- [ ] **Step 3: Create `useFullscreen.ts`**

```ts
// components/admin/RichTextEditor/hooks/useFullscreen.ts
"use client";

import { RefObject, useCallback, useEffect, useState } from "react";

export function useFullscreen(targetRef: RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(async () => {
    const el = targetRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      try {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        /* user gesture required, ignore */
      }
    }
  }, [targetRef]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return { isFullscreen, toggle };
}
```

- [ ] **Step 4: Create `useImageUpload.ts`**

```ts
// components/admin/RichTextEditor/hooks/useImageUpload.ts
"use client";

import { useCallback, useState } from "react";

export interface UploadedImage {
  url: string;
}

export function useImageUpload(endpoint: string = "/api/upload") {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (
      file: File,
      meta: { type?: string; category?: string; articleTitle?: string } = {},
    ): Promise<UploadedImage | null> => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (meta.type) fd.append("type", meta.type);
        if (meta.category) fd.append("category", meta.category);
        if (meta.articleTitle) fd.append("articleTitle", meta.articleTitle);
        const res = await fetch(endpoint, { method: "POST", body: fd });
        const data = await res.json();
        if (data.success && data.url) return { url: data.url };
        return null;
      } finally {
        setUploading(false);
      }
    },
    [endpoint],
  );

  return { upload, uploading };
}
```

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: only existing pre-existing error.

- [ ] **Step 6: Commit**

```bash
git add components/admin/RichTextEditor/hooks/
git commit -m "feat(admin): extract editor command hooks

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Extract dialog components

**Files:**
- Create: `components/admin/RichTextEditor/dialogs/HeadingDialog.tsx`
- Create: `components/admin/RichTextEditor/dialogs/TableDialog.tsx`
- Create: `components/admin/RichTextEditor/dialogs/FontDialog.tsx`
- Create: `components/admin/RichTextEditor/dialogs/ImageDialog.tsx`
- Create: `components/admin/RichTextEditor/dialogs/CodeBlockDialog.tsx`
- Create: `components/admin/RichTextEditor/dialogs/LinkDialog.tsx`

For this task, copy each dialog **verbatim from the source page** (`app/admin/article/page.tsx`) into the corresponding new file with minimal changes:
- Move JSX and local state into a self-contained component
- Add `interface Props` for `open`, `onClose`, and the success callback (`onConfirm` taking the values it currently sets)
- Keep all Tailwind classes identical

The source has these blocks (search anchors):
- Heading dialog: `showHeadingDialog && (` (around line 360 of article page)
- Table dialog: `showTableDialog && (`
- Font/size/color/line-height/spacing: `showFontFamilyDialog`, `showFontSizeDialog`, `showFontColorDialog`, `showLineHeightDialog`, `showParagraphSpacingDialog` — these should each become a sub-dialog inside `FontDialog.tsx` accepting a `mode` prop (`"family" | "size" | "color" | "lineHeight" | "spacing"`) so all 5 share the markup.
- Image dialog: `showImageDialog && (`
- Code block lang: `showCodeBlockLang && (`
- Link: search for the existing `prompt("URL")` if present and convert to a real dialog

- [ ] **Step 1: Create each dialog file with the boilerplate below as the template**

Template (use for HeadingDialog as starting reference):

```tsx
// components/admin/RichTextEditor/dialogs/HeadingDialog.tsx
"use client";

interface HeadingDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
}

export function HeadingDialog({ open, onClose, onConfirm }: HeadingDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-80 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">选择标题级别</h3>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3, 4, 5, 6] as const).map((n) => (
            <button
              key={n}
              onClick={() => {
                onConfirm(n);
                onClose();
              }}
              className="px-3 py-2 rounded-lg border border-[var(--card-border)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
            >
              H{n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Repeat for TableDialog (rows/cols sliders), CodeBlockDialog (lang select), LinkDialog (url+text inputs), ImageDialog (size/layout/url), FontDialog (mode-driven)**

Use existing JSX from source pages as the source of truth. Do NOT change behavior. Each dialog's `onConfirm` returns the data needed to call the corresponding hook (e.g., `useEditorCommands().insertTable(rows, cols)`).

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: only pre-existing error.

- [ ] **Step 4: Commit**

```bash
git add components/admin/RichTextEditor/dialogs/
git commit -m "feat(admin): extract editor dialogs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Build Toolbar

**Files:**
- Create: `components/admin/RichTextEditor/Toolbar.tsx`

- [ ] **Step 1: Create Toolbar with all current buttons grouped**

Reference source: the toolbar section in [app/admin/article/page.tsx](../../../app/admin/article/page.tsx) (search for `<Bold className="w-4 h-4" />`).

```tsx
// components/admin/RichTextEditor/Toolbar.tsx
"use client";

import { useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Code, Heading, List, ListOrdered,
  Quote, Link2, Image as ImageIcon, Code2, Table2, Minus, Type, Palette,
  AlignVerticalJustifyCenter, Columns2, TextCursorInput, Highlighter,
  Superscript, Subscript, Maximize2, Minimize2, Undo2, Redo2,
} from "lucide-react";

import { HeadingDialog } from "./dialogs/HeadingDialog";
import { TableDialog } from "./dialogs/TableDialog";
import { CodeBlockDialog } from "./dialogs/CodeBlockDialog";
import { LinkDialog } from "./dialogs/LinkDialog";
import { ImageDialog } from "./dialogs/ImageDialog";
import { FontDialog } from "./dialogs/FontDialog";

export interface ToolbarProps {
  exec: (cmd: string, val?: string) => void;
  applyInlineStyle: (prop: string, val: string, mode?: "selection" | "global") => void;
  insertHtml: (html: string) => void;
  insertCodeBlock: (lang: string) => void;
  insertTable: (rows: number, cols: number) => void;
  onUploadImage: () => void;     // delegates to file input click
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  toolbar?: {
    text?: boolean;
    block?: boolean;
    media?: boolean;
    typography?: boolean;
  };
}

export function Toolbar(props: ToolbarProps) {
  const t = {
    text: props.toolbar?.text ?? true,
    block: props.toolbar?.block ?? true,
    media: props.toolbar?.media ?? true,
    typography: props.toolbar?.typography ?? true,
  };
  const [openDialog, setOpenDialog] = useState<
    null | "heading" | "table" | "code" | "link" | "image" | "font-family" | "font-size" | "font-color" | "line-height" | "spacing"
  >(null);

  const Btn = ({ onClick, title, children, active }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-colors ${active ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted)]"}`}
    >
      {children}
    </button>
  );

  const Sep = () => <span className="w-px h-5 bg-[var(--card-border)] mx-1" />;

  return (
    <>
      <div className="flex items-center gap-1 flex-wrap p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/50 sticky top-0 z-10">
        <Btn onClick={() => props.exec("undo")} title="撤销"><Undo2 className="w-4 h-4" /></Btn>
        <Btn onClick={() => props.exec("redo")} title="重做"><Redo2 className="w-4 h-4" /></Btn>
        <Sep />
        {t.text && (<>
          <Btn onClick={() => props.exec("bold")} title="粗体"><Bold className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.exec("italic")} title="斜体"><Italic className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.exec("underline")} title="下划线"><Underline className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.exec("strikeThrough")} title="删除线"><Strikethrough className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.exec("superscript")} title="上标"><Superscript className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.exec("subscript")} title="下标"><Subscript className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.applyInlineStyle("backgroundColor", "#fef3c7")} title="高亮"><Highlighter className="w-4 h-4" /></Btn>
          <Sep />
        </>)}
        {t.block && (<>
          <Btn onClick={() => setOpenDialog("heading")} title="标题"><Heading className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.exec("insertUnorderedList")} title="无序列表"><List className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.exec("insertOrderedList")} title="有序列表"><ListOrdered className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.exec("formatBlock", "blockquote")} title="引用"><Quote className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.insertHtml("<hr/><p><br/></p>")} title="分割线"><Minus className="w-4 h-4" /></Btn>
          <Btn onClick={() => setOpenDialog("table")} title="表格"><Table2 className="w-4 h-4" /></Btn>
          <Sep />
        </>)}
        {t.media && (<>
          <Btn onClick={() => setOpenDialog("link")} title="链接"><Link2 className="w-4 h-4" /></Btn>
          <Btn onClick={props.onUploadImage} title="图片"><ImageIcon className="w-4 h-4" /></Btn>
          <Btn onClick={() => setOpenDialog("code")} title="代码块"><Code2 className="w-4 h-4" /></Btn>
          <Btn onClick={() => props.exec("formatBlock", "code")} title="行内代码"><Code className="w-4 h-4" /></Btn>
          <Sep />
        </>)}
        {t.typography && (<>
          <Btn onClick={() => setOpenDialog("font-family")} title="字体"><Type className="w-4 h-4" /></Btn>
          <Btn onClick={() => setOpenDialog("font-size")} title="字号"><TextCursorInput className="w-4 h-4" /></Btn>
          <Btn onClick={() => setOpenDialog("font-color")} title="字色"><Palette className="w-4 h-4" /></Btn>
          <Btn onClick={() => setOpenDialog("line-height")} title="行高"><AlignVerticalJustifyCenter className="w-4 h-4" /></Btn>
          <Btn onClick={() => setOpenDialog("spacing")} title="段距"><Columns2 className="w-4 h-4" /></Btn>
          <Sep />
        </>)}
        <Btn onClick={props.toggleFullscreen} title={props.isFullscreen ? "退出全屏" : "全屏"}>
          {props.isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Btn>
      </div>

      <HeadingDialog
        open={openDialog === "heading"}
        onClose={() => setOpenDialog(null)}
        onConfirm={(n) => props.exec("formatBlock", `H${n}`)}
      />
      <TableDialog
        open={openDialog === "table"}
        onClose={() => setOpenDialog(null)}
        onConfirm={(rows, cols) => props.insertTable(rows, cols)}
      />
      <CodeBlockDialog
        open={openDialog === "code"}
        onClose={() => setOpenDialog(null)}
        onConfirm={(lang) => props.insertCodeBlock(lang)}
      />
      <LinkDialog
        open={openDialog === "link"}
        onClose={() => setOpenDialog(null)}
        onConfirm={(url, text) =>
          props.insertHtml(
            `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener">${text || url}</a>`,
          )
        }
      />
      <ImageDialog
        open={openDialog === "image"}
        onClose={() => setOpenDialog(null)}
        onConfirm={(html) => props.insertHtml(html)}
      />
      <FontDialog
        mode={
          openDialog === "font-family" ? "family"
            : openDialog === "font-size" ? "size"
            : openDialog === "font-color" ? "color"
            : openDialog === "line-height" ? "lineHeight"
            : openDialog === "spacing" ? "spacing"
            : null
        }
        onClose={() => setOpenDialog(null)}
        onConfirm={(prop, val, scope) => props.applyInlineStyle(prop, val, scope)}
      />
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: only pre-existing error.

- [ ] **Step 3: Commit**

```bash
git add components/admin/RichTextEditor/Toolbar.tsx
git commit -m "feat(admin): build editor toolbar

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Wire RichTextEditor index.tsx to use hooks + toolbar

**Files:**
- Modify: `components/admin/RichTextEditor/index.tsx`

- [ ] **Step 1: Replace skeleton with full implementation**

```tsx
// components/admin/RichTextEditor/index.tsx
"use client";

import { useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";
import { useEditorCommands } from "./hooks/useEditorCommands";
import { useFullscreen } from "./hooks/useFullscreen";
import { useImageUpload } from "./hooks/useImageUpload";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  toolbar?: {
    text?: boolean;
    block?: boolean;
    media?: boolean;
    typography?: boolean;
  };
  fullscreen?: boolean;
  className?: string;
  uploadEndpoint?: string;
  draftKey?: string; // honored in Task 19
  uploadMeta?: { type?: string; category?: string; articleTitle?: string };
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "在此输入内容…",
  toolbar,
  fullscreen = true,
  className,
  uploadEndpoint,
  uploadMeta,
}: RichTextEditorProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { exec, applyInlineStyle, insertHtml, insertCodeBlock, insertTable } =
    useEditorCommands(editorRef, onChange);
  const { isFullscreen, toggle } = useFullscreen(wrapRef);
  const { upload } = useImageUpload(uploadEndpoint);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const result = await upload(file, uploadMeta);
    if (result?.url) {
      insertHtml(`<p><img src="${result.url}" alt="" /></p>`);
    }
  };

  return (
    <div ref={wrapRef} className={`flex flex-col gap-2 ${isFullscreen ? "bg-[var(--background)] p-4" : ""} ${className ?? ""}`}>
      <Toolbar
        exec={exec}
        applyInlineStyle={applyInlineStyle}
        insertHtml={insertHtml}
        insertCodeBlock={insertCodeBlock}
        insertTable={insertTable}
        onUploadImage={() => fileRef.current?.click()}
        isFullscreen={isFullscreen}
        toggleFullscreen={fullscreen ? toggle : () => {}}
        toolbar={toolbar}
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className={`min-h-[400px] p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 prose prose-invert max-w-none ${isFullscreen ? "flex-1 overflow-auto min-h-0" : ""}`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: only pre-existing error.

- [ ] **Step 3: Commit**

```bash
git add components/admin/RichTextEditor/index.tsx
git commit -m "feat(admin): wire RichTextEditor with toolbar and hooks

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Adopt RichTextEditor in legacy `/admin/article` and `/admin/project`

**Files:**
- Modify: `app/admin/article/page.tsx`
- Modify: `app/admin/project/page.tsx`

**Goal:** drop in the new component, delete duplicated toolbar/dialog code, keep behavior. Don't rename routes yet.

- [ ] **Step 1: In `app/admin/article/page.tsx`, replace the existing inline toolbar+contentEditable+dialogs block with `<RichTextEditor>`**

Find the JSX region containing `<div ref={editorRef} contentEditable …>` and the surrounding toolbar buttons + dialog markup. Replace it with:

```tsx
<RichTextEditor
  value={articleContent}
  onChange={setArticleContent}
  uploadMeta={{ type: "blog", category: articleCategory || "未分类", articleTitle: articleTitle || "草稿" }}
/>
```

Add the import at top:

```tsx
import { RichTextEditor } from "../../../components/admin/RichTextEditor";
```

Then remove now-unused imports/icons/state variables (`showCodeBlockLang`, `showTableDialog`, `showHeadingDialog`, `showFontFamilyDialog`, etc., `isFullscreen`, `toggleFullscreen`, all the dialog JSX).

- [ ] **Step 2: Repeat for `app/admin/project/page.tsx` with `setProjContent` instead of `setArticleContent`**

```tsx
<RichTextEditor
  value={projContent}
  onChange={setProjContent}
  uploadMeta={{ type: "project", articleTitle: projName || "项目" }}
/>
```

- [ ] **Step 3: Type-check + Lint**

Run: `npm run type-check && npm run lint`
Expected: pre-existing error only; no new errors.

- [ ] **Step 4: Smoke test**

```bash
# Stop existing dev server, restart
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1
rm -f /tmp/blog-dev.log; npm run dev > /tmp/blog-dev.log 2>&1 &
until grep -qE "Ready in|Error" /tmp/blog-dev.log; do sleep 0.5; done
curl -s -o /dev/null -w "article: %{http_code}\n" -L http://localhost:3000/admin/article
curl -s -o /dev/null -w "project: %{http_code}\n" -L http://localhost:3000/admin/project
```

Manual: log in, visit `/admin/article`, edit one existing post, verify all toolbar buttons still work (bold/heading/table/image/code-block/font/fullscreen). Repeat on `/admin/project`.

- [ ] **Step 5: Commit**

```bash
git add app/admin/article/page.tsx app/admin/project/page.tsx
git commit -m "refactor(admin): adopt shared RichTextEditor in article and project

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

<a id="phase-2"></a>
## Phase 2 — Admin Shell Skeleton

Now build the sidebar/topbar shell. Old pages still work because `/admin/article`, `/admin/project` haven't moved yet.

### Task 7: Build Sidebar, NewMenu, Topbar primitives

**Files:**
- Create: `components/admin/Sidebar.tsx`
- Create: `components/admin/NewMenu.tsx`
- Create: `components/admin/Topbar.tsx`

- [ ] **Step 1: Create `Sidebar.tsx`**

```tsx
// components/admin/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FolderOpen, Rocket, User, Palette, BarChart3 } from "lucide-react";
import { NewMenu } from "./NewMenu";

const groups = [
  {
    label: "内容",
    items: [
      { href: "/admin/articles", label: "文章", Icon: FileText },
      { href: "/admin/categories", label: "专栏", Icon: FolderOpen },
      { href: "/admin/projects", label: "项目", Icon: Rocket },
    ],
  },
  {
    label: "站点",
    items: [
      { href: "/admin/about", label: "关于我", Icon: User },
      { href: "/admin/theme", label: "主题", Icon: Palette },
      { href: "/admin/stats", label: "统计", Icon: BarChart3 },
    ],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-[var(--card-border)] bg-[var(--card)]/30 backdrop-blur flex flex-col">
      <div className="p-4 border-b border-[var(--card-border)]">
        <Link href="/admin" className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)]" onClick={onNavigate}>
          后台管理
        </Link>
      </div>
      <div className="p-3 border-b border-[var(--card-border)]">
        <NewMenu onPicked={onNavigate} />
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-2 mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">{g.label}</div>
            <ul className="space-y-1">
              {g.items.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "text-[var(--foreground)] hover:bg-[var(--card)]/60"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--primary)]" />}
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create `NewMenu.tsx`**

```tsx
// components/admin/NewMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, ChevronDown, FileText, FolderOpen, Rocket } from "lucide-react";

export function NewMenu({ onPicked }: { onPicked?: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const item = (href: string, label: string, Icon: typeof FileText) => (
    <Link
      href={href}
      onClick={() => {
        setOpen(false);
        onPicked?.();
      }}
      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> 新建</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-lg overflow-hidden">
          {item("/admin/articles?new=1", "新文章", FileText)}
          {item("/admin/projects?new=1", "新项目", Rocket)}
          {item("/admin/categories?new=1", "新专栏", FolderOpen)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `Topbar.tsx`**

```tsx
// components/admin/Topbar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

const labels: Record<string, string> = {
  "/admin": "概览",
  "/admin/articles": "文章管理",
  "/admin/categories": "专栏管理",
  "/admin/projects": "项目管理",
  "/admin/about": "关于我",
  "/admin/theme": "主题设置",
  "/admin/stats": "访问统计",
};

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const segments = ["/admin", pathname].filter((p, i, arr) => arr.indexOf(p) === i);
  const crumbs = segments
    .map((p) => labels[p])
    .filter(Boolean);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--card)]/30 backdrop-blur">
      <div className="flex items-center gap-3">
        {onMenu && (
          <button onClick={onMenu} className="md:hidden p-1 -ml-1 text-[var(--muted)] hover:text-[var(--foreground)]">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <nav className="text-sm text-[var(--muted)]">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-2">/</span>}
              <span className={i === crumbs.length - 1 ? "text-[var(--foreground)]" : ""}>{c}</span>
            </span>
          ))}
        </nav>
      </div>
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 transition-colors"
      >
        <LogOut className="w-4 h-4" /> 退出
      </button>
    </header>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: only pre-existing error.

- [ ] **Step 5: Commit**

```bash
git add components/admin/Sidebar.tsx components/admin/NewMenu.tsx components/admin/Topbar.tsx
git commit -m "feat(admin): add sidebar, NewMenu and topbar primitives

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Build AdminShell wrapper

**Files:**
- Create: `components/admin/AdminShell.tsx`

- [ ] **Step 1: Create AdminShell**

```tsx
// components/admin/AdminShell.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      {/* Mobile slide-in sidebar */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-40 transform transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: only pre-existing error.

- [ ] **Step 3: Commit**

```bash
git add components/admin/AdminShell.tsx
git commit -m "feat(admin): add AdminShell wrapper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Mount AdminShell via `app/admin/layout.tsx` (login excluded)

**Files:**
- Create: `app/admin/layout.tsx`

- [ ] **Step 1: Create the layout**

```tsx
// app/admin/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "../../components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}
```

- [ ] **Step 2: Smoke test**

Restart dev server (kill + restart):

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1
rm -f /tmp/blog-dev.log; npm run dev > /tmp/blog-dev.log 2>&1 &
until grep -qE "Ready in|Error" /tmp/blog-dev.log; do sleep 0.5; done
curl -s -o /dev/null -w "/admin: %{http_code}\n" -L http://localhost:3000/admin
curl -s -o /dev/null -w "/admin/login: %{http_code}\n" -L http://localhost:3000/admin/login
```

Manual: log in, observe sidebar present on `/admin`, `/admin/article`, `/admin/project` (current pages still old layout but wrapped); login page must NOT have sidebar.

- [ ] **Step 3: Type-check + Lint**

Run: `npm run type-check && npm run lint`
Expected: pre-existing error only.

- [ ] **Step 4: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat(admin): mount AdminShell via layout, exclude login

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

<a id="phase-3"></a>
## Phase 3 — Route Restructure

Now move `/admin/article` → `/admin/articles`, `/admin/project` → `/admin/projects`, and split the old `/admin` tab content into 4 dedicated pages (`about`, `theme`, `categories` placeholder, `stats`).

### Task 10: Rename `/admin/article` → `/admin/articles`, `/admin/project` → `/admin/projects`

**Files:**
- Move: `app/admin/article/page.tsx` → `app/admin/articles/page.tsx`
- Move: `app/admin/project/page.tsx` → `app/admin/projects/page.tsx`
- Create: `app/admin/article/page.tsx` (thin redirect)
- Create: `app/admin/project/page.tsx` (thin redirect)

- [ ] **Step 1: Run git move**

```bash
mkdir -p app/admin/articles app/admin/projects
git mv app/admin/article/page.tsx app/admin/articles/page.tsx
git mv app/admin/project/page.tsx app/admin/projects/page.tsx
```

- [ ] **Step 2: Update relative imports**

In the moved files, the path depth didn't change (still `app/admin/<x>/page.tsx`), so relative imports stay valid. Verify by running `npm run type-check` and fixing any path issues that surface.

- [ ] **Step 3: Create thin redirects at the old paths**

```tsx
// app/admin/article/page.tsx
import { redirect } from "next/navigation";
export default function Page() {
  redirect("/admin/articles");
}
```

```tsx
// app/admin/project/page.tsx
import { redirect } from "next/navigation";
export default function Page() {
  redirect("/admin/projects");
}
```

- [ ] **Step 4: Smoke test**

Restart dev server:

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1
rm -rf .next; rm -f /tmp/blog-dev.log; npm run dev > /tmp/blog-dev.log 2>&1 &
until grep -qE "Ready in|Error" /tmp/blog-dev.log; do sleep 0.5; done
# Old URLs redirect
curl -s -o /dev/null -w "/admin/article: %{http_code}\n" -L http://localhost:3000/admin/article
curl -s -o /dev/null -w "/admin/articles: %{http_code}\n" -L http://localhost:3000/admin/articles
curl -s -o /dev/null -w "/admin/project: %{http_code}\n" -L http://localhost:3000/admin/project
curl -s -o /dev/null -w "/admin/projects: %{http_code}\n" -L http://localhost:3000/admin/projects
```

All should be 200 (since redirect lands on the new page).

- [ ] **Step 5: Type-check + Lint**

```bash
npm run type-check && npm run lint
```

Expected: only pre-existing error.

- [ ] **Step 6: Commit**

```bash
git add app/admin/article/ app/admin/articles/ app/admin/project/ app/admin/projects/
git commit -m "refactor(admin): rename article/project routes to plural with redirects

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: Lift About / Theme / Categories from `/admin/page.tsx` into dedicated pages

**Files:**
- Create: `app/admin/about/page.tsx` (lift "关于我" tab)
- Create: `app/admin/theme/page.tsx` (lift "主题设置" tab)
- Create: `app/admin/categories/page.tsx` (lift "专栏管理" tab — basic list/form, polished in Task 16)
- Modify: `app/admin/page.tsx` (server-side `redirect`)

- [ ] **Step 1: Open `app/admin/page.tsx` and locate the four tab content blocks**

In [app/admin/page.tsx](../../../app/admin/page.tsx):
- About tab JSX: lines ~334–470 (between `{activeTab === "about" && (` and the closing for that block)
- Categories tab JSX: lines ~470–510
- Projects tab JSX: lines ~511–541 (this is the **list-only** view; full editor lives in `/admin/projects` already, so we'll let Task 15 supersede it; for now we won't lift it)
- Theme tab JSX: lines ~542–662

- [ ] **Step 2: Create `app/admin/about/page.tsx`**

```tsx
// app/admin/about/page.tsx
"use client";

// Copy verbatim from current app/admin/page.tsx:
//   - top imports (Camera, Loader2, Check, X)
//   - state vars: aboutName, aboutEmail, aboutGithub, ... avatarPreview, etc.
//   - useEffect that fetches /api/about
//   - handleAvatarChange, save handler
//   - JSX: just the inner content of `{activeTab === "about" && (...)}`
//     wrapped in: <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">...</div>
//
// Do NOT include the page header / tab bar / logout — those live in AdminShell now.
```

Write the file by copying the relevant fragment. Page header should be just:

```tsx
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
  <h1 className="text-2xl font-bold mb-6">关于我</h1>
  {/* form content here */}
</div>
```

- [ ] **Step 3: Create `app/admin/theme/page.tsx` similarly (lift theme tab content)**

Same pattern: copy state, fetch, save, JSX, drop into:

```tsx
"use client";
// ... lifted state and effects ...
export default function ThemePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">主题设置</h1>
      {/* form content here */}
    </div>
  );
}
```

- [ ] **Step 4: Create a basic `app/admin/categories/page.tsx`** (will be replaced with split version in Task 16)

```tsx
// app/admin/categories/page.tsx
"use client";

// Lift categories list/form JSX from the current /admin "categories" tab.
// Wrap in <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8"> with h1 "专栏管理".
// Keep all existing state, fetch, save handlers verbatim.
```

- [ ] **Step 5: Replace `app/admin/page.tsx` with a server redirect**

```tsx
// app/admin/page.tsx
import { redirect } from "next/navigation";
export default function AdminIndex() {
  redirect("/admin/articles");
}
```

This deletes all the old tab UI in one shot. The file becomes 4 lines.

- [ ] **Step 6: Smoke test**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1
rm -rf .next; rm -f /tmp/blog-dev.log; npm run dev > /tmp/blog-dev.log 2>&1 &
until grep -qE "Ready in|Error" /tmp/blog-dev.log; do sleep 0.5; done
for p in /admin /admin/about /admin/theme /admin/categories /admin/articles /admin/projects; do
  printf "%-22s " "$p"
  curl -s -o /dev/null -w "%{http_code}\n" -L "http://localhost:3000$p"
done
```

All should be 200 (assuming logged in / cookie set).

Manual: log in, click each sidebar item, verify About/Theme/Categories forms render and save still works.

- [ ] **Step 7: Type-check + Lint**

```bash
npm run type-check && npm run lint
```

Expected: only pre-existing error.

- [ ] **Step 8: Commit**

```bash
git add app/admin/page.tsx app/admin/about/ app/admin/theme/ app/admin/categories/
git commit -m "refactor(admin): split tabs into dedicated about/theme/categories pages

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: Add `/admin/stats` placeholder

**Files:**
- Create: `app/admin/stats/page.tsx`

- [ ] **Step 1: Inspect existing stats sources**

```bash
grep -rn "/api/stats\|/api/analytics" /Users/didi/micro-ai-blog/app/api 2>/dev/null | head -10
ls /Users/didi/micro-ai-blog/app/api/stats /Users/didi/micro-ai-blog/app/api/analytics 2>/dev/null
```

If `/api/stats` exists, render its data. Otherwise add a placeholder.

- [ ] **Step 2: Create the page (placeholder, real data is out of scope)**

```tsx
// app/admin/stats/page.tsx
"use client";

import { BarChart3 } from "lucide-react";

export default function StatsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">访问统计</h1>
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)]/30 p-12 flex flex-col items-center text-[var(--muted)]">
        <BarChart3 className="w-10 h-10 mb-3 opacity-50" />
        <p>统计模块即将上线</p>
      </div>
    </div>
  );
}
```

(If `/api/stats` was found, replace with a real data-driven view: fetch and show counts.)

- [ ] **Step 3: Type-check + Lint**

```bash
npm run type-check && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/stats/
git commit -m "feat(admin): add stats page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 13: Add `/admin/write` thin redirect

**Files:**
- Modify: `app/admin/write/page.tsx`

- [ ] **Step 1: Replace the entire file with a redirect**

```tsx
// app/admin/write/page.tsx
import { redirect } from "next/navigation";
export default function Page() {
  redirect("/admin/articles?new=1");
}
```

This collapses 1145 lines to 4. The "new article" flow now lives inside `/admin/articles`.

- [ ] **Step 2: Smoke test**

```bash
curl -s -o /dev/null -w "/admin/write: %{http_code}\n" -L http://localhost:3000/admin/write
# Expected 200 (lands on /admin/articles?new=1)
```

- [ ] **Step 3: Type-check + Lint**

```bash
npm run type-check && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/write/page.tsx
git commit -m "refactor(admin): replace /admin/write with redirect to /admin/articles

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

<a id="phase-4"></a>
## Phase 4 — SplitWorkspace + Articles Page

### Task 14: Build SplitWorkspace and refactor `/admin/articles` to use it

**Files:**
- Create: `components/admin/SplitWorkspace.tsx`
- Modify: `app/admin/articles/page.tsx`

- [ ] **Step 1: Create `SplitWorkspace.tsx`**

```tsx
// components/admin/SplitWorkspace.tsx
"use client";

import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";

export interface SplitWorkspaceProps<T extends { id: string }> {
  items: T[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  renderRow: (item: T, isActive: boolean) => React.ReactNode;
  searchPredicate?: (item: T, q: string) => boolean;
  filters?: Array<{ key: string; label: string; predicate: (i: T) => boolean }>;
  newButtonLabel?: string;
  onNew?: () => void;
  emptyState?: React.ReactNode;
  children: React.ReactNode;
}

export function SplitWorkspace<T extends { id: string }>({
  items,
  selectedId,
  onSelect,
  renderRow,
  searchPredicate,
  filters,
  newButtonLabel = "新建",
  onNew,
  emptyState,
  children,
}: SplitWorkspaceProps<T>) {
  const [q, setQ] = useState("");
  const [filterKey, setFilterKey] = useState<string>("all");

  const filtered = useMemo(() => {
    let out = items;
    if (filterKey !== "all" && filters) {
      const f = filters.find((x) => x.key === filterKey);
      if (f) out = out.filter(f.predicate);
    }
    if (q.trim() && searchPredicate) out = out.filter((i) => searchPredicate(i, q.trim().toLowerCase()));
    return out;
  }, [items, filterKey, filters, q, searchPredicate]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left: list */}
      <div className="w-80 shrink-0 border-r border-[var(--card-border)] flex flex-col">
        <div className="p-3 space-y-2 border-b border-[var(--card-border)]">
          {onNew && (
            <button
              onClick={onNew}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              {newButtonLabel}
            </button>
          )}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          {filters && filters.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {[{ key: "all", label: "全部" }, ...filters].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterKey(f.key)}
                  className={`px-2 py-1 text-xs rounded ${
                    filterKey === f.key
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full text-left px-3 py-3 border-b border-[var(--card-border)]/40 hover:bg-[var(--card)]/40 transition-colors ${
                  selectedId === item.id ? "bg-[var(--primary)]/5" : ""
                }`}
              >
                {renderRow(item, selectedId === item.id)}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="p-6 text-center text-sm text-[var(--muted)]">无匹配项</li>
          )}
        </ul>
      </div>

      {/* Right: editor / detail */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selectedId === null && !children
          ? emptyState ?? (
              <div className="h-full flex items-center justify-center text-[var(--muted)]">
                从左侧选择一项，或点「新建」
              </div>
            )
          : children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Refactor `app/admin/articles/page.tsx` to use SplitWorkspace + URL sync**

The current `app/admin/articles/page.tsx` has `view: "list" | "editor"` toggle — replace with URL-driven `selectedId`. Skeleton:

```tsx
// app/admin/articles/page.tsx (refactored skeleton — keep your existing helpers/handlers)
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SplitWorkspace } from "../../../components/admin/SplitWorkspace";
import { RichTextEditor } from "../../../components/admin/RichTextEditor";
import { AiWriteModal } from "../../../components/admin/ai-write-modal";
// ... existing icons

type Article = {
  id: string;       // = slug (id field for SplitWorkspace)
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  draft: boolean;
  wordCount: number;
};

export default function ArticlesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const isNew = params.get("new") === "1";

  const [articles, setArticles] = useState<Article[]>([]);
  // ... keep all existing form fields state ...

  // Load list
  useEffect(() => {
    fetch("/api/posts").then((r) => r.json()).then((d) => {
      setArticles(Array.isArray(d) ? d.map((p: Omit<Article, "id">) => ({ ...p, id: p.slug })) : []);
    });
  }, []);

  // When selectedId changes, load that article into the form
  useEffect(() => {
    if (!selectedId || isNew) {
      // reset form
      return;
    }
    fetch(`/api/posts?slug=${selectedId}`)
      .then((r) => r.json())
      .then((post) => { /* setArticleTitle/etc from post */ });
  }, [selectedId, isNew]);

  const handleNew = () => router.push("/admin/articles?new=1");
  const handleSelect = (id: string | null) => router.push(id ? `/admin/articles?id=${id}` : "/admin/articles");

  return (
    <SplitWorkspace<Article>
      items={articles}
      selectedId={selectedId}
      onSelect={handleSelect}
      onNew={handleNew}
      newButtonLabel="写文章"
      searchPredicate={(a, q) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)}
      filters={[
        { key: "draft", label: "草稿", predicate: (a) => a.draft },
        { key: "published", label: "已发布", predicate: (a) => !a.draft },
      ]}
      renderRow={(a) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-[var(--foreground)] text-sm line-clamp-1">{a.title}</span>
            {a.draft && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">草稿</span>}
          </div>
          <div className="text-xs text-[var(--muted)]">{a.date} · {a.wordCount} 字 · {a.category}</div>
        </div>
      )}
    >
      {(selectedId || isNew) ? (
        <ArticleEditor
          key={selectedId ?? "new"}    // force remount on switch
          slug={selectedId}
          isNew={isNew}
          onSaved={(savedSlug) => {
            // refresh list, switch URL to ?id=<slug>
            fetch("/api/posts").then((r) => r.json()).then((d) => {
              setArticles(Array.isArray(d) ? d.map((p: Omit<Article, "id">) => ({ ...p, id: p.slug })) : []);
            });
            router.replace(`/admin/articles?id=${savedSlug}`);
          }}
          onDeleted={(deletedSlug) => {
            setArticles((prev) => prev.filter((a) => a.id !== deletedSlug));
            router.replace("/admin/articles");
          }}
        />
      ) : null}
    </SplitWorkspace>
  );
}

// ArticleEditor: keep all the form fields + RichTextEditor, save/delete logic
// Pull existing handler bodies verbatim. Pseudo-skeleton:
function ArticleEditor({
  slug, isNew, onSaved, onDeleted,
}: { slug: string | null; isNew: boolean; onSaved: (slug: string) => void; onDeleted: (slug: string) => void }) {
  // ... copy existing state + effects + handlers + JSX from old article page ...
  // The form JSX should NOT include any tab/header from the old `view === "editor"` shell —
  // just title input, summary, category, tags, draft checkbox, RichTextEditor, action buttons.
  return null; // placeholder — fill in with actual implementation
}
```

The full implementation is mostly a copy/paste of the current `app/admin/articles/page.tsx` editor portion, broken into the `ArticleEditor` sub-component. Keep AI Write Modal and Feishu Import Modal as before.

- [ ] **Step 3: Smoke test**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1
rm -rf .next; rm -f /tmp/blog-dev.log; npm run dev > /tmp/blog-dev.log 2>&1 &
until grep -qE "Ready in|Error" /tmp/blog-dev.log; do sleep 0.5; done
curl -s -o /dev/null -w "/admin/articles: %{http_code}\n" -L http://localhost:3000/admin/articles
curl -s -o /dev/null -w "/admin/articles?new=1: %{http_code}\n" -L "http://localhost:3000/admin/articles?new=1"
```

Manual flow:
1. Visit `/admin/articles` → list visible, empty right pane
2. Click any item → editor on right loads its content
3. Click "写文章" → blank editor; type title + content → save → list shows new entry, URL becomes `?id=<slug>`
4. Filter "草稿"/"已发布" works
5. Search by title works
6. Delete a draft → confirms, removes from list

- [ ] **Step 4: Type-check + Lint**

```bash
npm run type-check && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add components/admin/SplitWorkspace.tsx app/admin/articles/page.tsx
git commit -m "feat(admin): refactor articles page to SplitWorkspace with URL state

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

<a id="phase-5"></a>
## Phase 5 — Projects Split Page

### Task 15: Refactor `/admin/projects` to use SplitWorkspace

**Files:**
- Modify: `app/admin/projects/page.tsx`

- [ ] **Step 1: Apply the same pattern as Task 14**

Skeleton:

```tsx
// app/admin/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SplitWorkspace } from "../../../components/admin/SplitWorkspace";
import { RichTextEditor } from "../../../components/admin/RichTextEditor";

type Project = {
  id: string;          // = slug
  slug: string;
  name: string;
  description: string;
  cover?: string;
  techStack: string[];
  highlights: string[];
  githubUrl?: string;
  demoUrl?: string;
  content?: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const isNew = params.get("new") === "1";

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d) ? d.map((p: Omit<Project, "id">) => ({ ...p, id: p.slug })) : []));
  }, []);

  return (
    <SplitWorkspace<Project>
      items={projects}
      selectedId={selectedId}
      onSelect={(id) => router.push(id ? `/admin/projects?id=${id}` : "/admin/projects")}
      onNew={() => router.push("/admin/projects?new=1")}
      newButtonLabel="新项目"
      searchPredicate={(p, q) => p.name.toLowerCase().includes(q)}
      renderRow={(p) => (
        <div className="flex items-center gap-3">
          {p.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.cover} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-medium text-sm line-clamp-1">{p.name}</div>
            <div className="text-xs text-[var(--muted)] line-clamp-1">
              {p.techStack.slice(0, 4).join(" · ")}
            </div>
          </div>
        </div>
      )}
    >
      {(selectedId || isNew) ? (
        <ProjectEditor
          key={selectedId ?? "new"}
          slug={selectedId}
          isNew={isNew}
          onSaved={(s) => {
            fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(Array.isArray(d) ? d.map((p: Omit<Project, "id">) => ({ ...p, id: p.slug })) : []));
            router.replace(`/admin/projects?id=${s}`);
          }}
          onDeleted={(s) => {
            setProjects((prev) => prev.filter((p) => p.id !== s));
            router.replace("/admin/projects");
          }}
        />
      ) : null}
    </SplitWorkspace>
  );
}

function ProjectEditor({ slug, isNew, onSaved, onDeleted }: {
  slug: string | null; isNew: boolean; onSaved: (s: string) => void; onDeleted: (s: string) => void;
}) {
  // Copy state + handlers verbatim from the existing project page.
  // JSX = form fields + <RichTextEditor value={projContent} onChange={setProjContent} ... />
  return null;
}
```

- [ ] **Step 2: Smoke test**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1
rm -rf .next; rm -f /tmp/blog-dev.log; npm run dev > /tmp/blog-dev.log 2>&1 &
until grep -qE "Ready in|Error" /tmp/blog-dev.log; do sleep 0.5; done
```

Manual: log in → `/admin/projects` → list / select / edit / save / delete / new (`?new=1`).

- [ ] **Step 3: Type-check + Lint**

```bash
npm run type-check && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/projects/page.tsx
git commit -m "feat(admin): refactor projects page to SplitWorkspace

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

<a id="phase-6"></a>
## Phase 6 — Categories Split Page + `description_long`

### Task 16: Add `description_long` field to data layer + API

**Files:**
- Modify: `lib/categories.ts`
- Modify: `app/api/categories/route.ts`

- [ ] **Step 1: Extend `CategoryConfig` type**

In [lib/categories.ts](../../../lib/categories.ts) modify the type:

```ts
export type CategoryConfig = {
  name: string;
  description: string;
  background?: string;
  bgOpacity?: number;
  description_long?: string;   // NEW: HTML, optional
};
```

- [ ] **Step 2: Make sure `getCategoryConfigs` reads it without blowing up if missing**

The current `yaml.load` already handles missing fields (they come back as `undefined`). No change to read path needed.

- [ ] **Step 3: Update `app/api/categories/route.ts` to persist new field**

In each handler (POST/PUT), pull `description_long` from the body and include in the saved object:

```ts
// POST
const { name, description, background, bgOpacity, description_long } = body;
// ...
categories.push({
  name,
  description: description || "",
  background: background || undefined,
  bgOpacity,
  description_long: description_long || undefined,
});
```

```ts
// PUT
const { oldName, name, description, background, bgOpacity, description_long } = body;
// ...
categories[index] = {
  name,
  description: description || "",
  background: background || undefined,
  bgOpacity,
  description_long: description_long || undefined,
};
```

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: only pre-existing error.

- [ ] **Step 5: Commit**

```bash
git add lib/categories.ts app/api/categories/route.ts
git commit -m "feat(categories): add optional description_long field

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 17: Refactor `/admin/categories` to SplitWorkspace + RichTextEditor for description_long

**Files:**
- Modify: `app/admin/categories/page.tsx`

- [ ] **Step 1: Replace with SplitWorkspace version**

```tsx
// app/admin/categories/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SplitWorkspace } from "../../../components/admin/SplitWorkspace";
import { RichTextEditor } from "../../../components/admin/RichTextEditor";
import { Loader2, Trash2 } from "lucide-react";

type Category = {
  id: string;          // = name
  name: string;
  description: string;
  background?: string;
  bgOpacity?: number;
  description_long?: string;
};

const BG_PRESETS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

export default function CategoriesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const isNew = params.get("new") === "1";

  const [items, setItems] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((data: Category[]) => {
      setItems(data.map((c) => ({ ...c, id: c.name })));
    });
    fetch("/api/posts").then((r) => r.json()).then((posts: { category: string }[]) => {
      const map: Record<string, number> = {};
      posts.forEach((p) => { map[p.category] = (map[p.category] ?? 0) + 1; });
      setCounts(map);
    });
  }, []);

  return (
    <SplitWorkspace<Category>
      items={items}
      selectedId={selectedId}
      onSelect={(id) => router.push(id ? `/admin/categories?id=${encodeURIComponent(id)}` : "/admin/categories")}
      onNew={() => router.push("/admin/categories?new=1")}
      newButtonLabel="新专栏"
      searchPredicate={(c, q) => c.name.toLowerCase().includes(q)}
      renderRow={(c) => (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{c.name}</span>
            <span className="text-xs text-[var(--muted)]">{counts[c.name] ?? 0} 篇</span>
          </div>
          {c.description && <div className="text-xs text-[var(--muted)] line-clamp-2">{c.description}</div>}
        </div>
      )}
    >
      {(selectedId || isNew) ? (
        <CategoryEditor
          key={selectedId ?? "new"}
          name={selectedId}
          isNew={isNew}
          existing={items.find((c) => c.id === selectedId)}
          onSaved={(savedName) => {
            fetch("/api/categories").then((r) => r.json()).then((data: Category[]) => setItems(data.map((c) => ({ ...c, id: c.name }))));
            router.replace(`/admin/categories?id=${encodeURIComponent(savedName)}`);
          }}
          onDeleted={(deletedName) => {
            setItems((prev) => prev.filter((c) => c.id !== deletedName));
            router.replace("/admin/categories");
          }}
        />
      ) : null}
    </SplitWorkspace>
  );
}

function CategoryEditor({
  name, isNew, existing, onSaved, onDeleted,
}: {
  name: string | null; isNew: boolean; existing?: Category;
  onSaved: (name: string) => void; onDeleted: (name: string) => void;
}) {
  const [formName, setFormName] = useState(existing?.name ?? "");
  const [formDesc, setFormDesc] = useState(existing?.description ?? "");
  const [formBg, setFormBg] = useState(existing?.background ?? "");
  const [formOpacity, setFormOpacity] = useState(existing?.bgOpacity ?? 15);
  const [formLongDesc, setFormLongDesc] = useState(existing?.description_long ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    if (!formName.trim()) {
      setMsg({ ok: false, text: "名称不能为空" });
      return;
    }
    setSaving(true);
    const payload = {
      name: formName.trim(),
      description: formDesc,
      background: formBg || undefined,
      bgOpacity: formOpacity,
      description_long: formLongDesc || undefined,
    };
    const isEdit = !isNew && !!name;
    const res = await fetch("/api/categories", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { ...payload, oldName: name } : payload),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setMsg({ ok: true, text: "已保存" });
      onSaved(payload.name);
    } else {
      setMsg({ ok: false, text: data.error || "保存失败" });
    }
  };

  const remove = async () => {
    if (!name || isNew) return;
    if (!confirm(`确定删除专栏 "${name}"？`)) return;
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) onDeleted(name);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isNew ? "新建专栏" : `编辑：${name}`}</h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={remove} className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 inline-flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> 删除
            </button>
          )}
          <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            保存
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-3 py-2 rounded text-sm ${msg.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {msg.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">名称</label>
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">短描述</label>
          <textarea
            rows={2}
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">背景预设</label>
            <select
              value={formBg}
              onChange={(e) => setFormBg(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]"
            >
              <option value="">（无）</option>
              {BG_PRESETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">背景透明度（0-100）</label>
            <input
              type="number"
              min={0} max={100}
              value={formOpacity}
              onChange={(e) => setFormOpacity(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-2">详细描述（用于专栏详情页）</label>
          <RichTextEditor
            value={formLongDesc}
            onChange={setFormLongDesc}
            placeholder="描述这个专栏的内容定位、目标读者、阅读顺序等…"
            uploadMeta={{ type: "category", category: formName || "未命名" }}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1
rm -rf .next; rm -f /tmp/blog-dev.log; npm run dev > /tmp/blog-dev.log 2>&1 &
until grep -qE "Ready in|Error" /tmp/blog-dev.log; do sleep 0.5; done
```

Manual: visit `/admin/categories`, click an existing one, edit description_long, save; create new; delete one. Verify `content/categories.yaml` got the new field.

- [ ] **Step 3: Type-check + Lint**

```bash
npm run type-check && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/categories/page.tsx
git commit -m "feat(admin): refactor categories page to SplitWorkspace with rich description

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 18: Render `description_long` on public `/categories/<name>` page

**Files:**
- Modify: `app/categories/[category]/page.tsx`

- [ ] **Step 1: Add banner under the category title**

In [app/categories/[category]/page.tsx](../../../app/categories/[category]/page.tsx), find the `<h1>{category}</h1>` block (around line 49). Below it, conditionally render the long description as HTML:

```tsx
<h1 className="text-3xl font-bold mb-2">{category}</h1>
{catConfig.description && (
  <p className="text-[var(--muted)]">{catConfig.description}</p>
)}
{catConfig.description_long && (
  <div
    className="mt-4 prose prose-invert max-w-none"
    dangerouslySetInnerHTML={{ __html: catConfig.description_long }}
  />
)}
```

(Adjust placement to fit existing JSX; the key add is the `description_long` block.)

- [ ] **Step 2: Smoke test**

```bash
# Pick a category that has description_long now
curl -s "http://localhost:3000/categories/$(echo -n '大数据开发工程' | python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.stdin.read()))')" | grep -c "prose prose-invert"
# Expected >= 1 if you set description_long for that category
```

Manual: set a description_long in `/admin/categories` for "大数据开发工程", visit `/categories/大数据开发工程`, see the banner.

- [ ] **Step 3: Type-check + Lint + Build**

```bash
npm run type-check && npm run lint && npm run build
```

Expected: pre-existing error stays; full build succeeds (this is the most thorough check before phase 7).

- [ ] **Step 4: Commit**

```bash
git add app/categories/[category]/page.tsx
git commit -m "feat(categories): render description_long banner on detail page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

<a id="phase-7"></a>
## Phase 7 — Draft Autosave

### Task 19: Implement `useDraftAutosave` and wire into article + project + category editors

**Files:**
- Create: `components/admin/RichTextEditor/hooks/useDraftAutosave.ts`
- Modify: `components/admin/RichTextEditor/index.tsx`
- Modify: `app/admin/articles/page.tsx` (pass draftKey, call clear on save)
- Modify: `app/admin/projects/page.tsx` (same)
- Modify: `app/admin/categories/page.tsx` (same)

- [ ] **Step 1: Create the hook**

```ts
// components/admin/RichTextEditor/hooks/useDraftAutosave.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface DraftEnvelope {
  html: string;
  updatedAt: number;
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000;        // 7 days
const FRESH_GUARD_MS = 30 * 1000;              // don't show banner if draft within 30s of mount
const DEBOUNCE_MS = 1500;

export function useDraftAutosave(
  draftKey: string | undefined,
  value: string,
): {
  detectedDraft: DraftEnvelope | null;
  restore: () => string | null;
  discard: () => void;
  clear: () => void;
} {
  const [detectedDraft, setDetectedDraft] = useState<DraftEnvelope | null>(null);
  const openTimeRef = useRef<number>(typeof window === "undefined" ? 0 : Date.now());
  const lastSavedRef = useRef<string>(value);

  // On mount: load + decide whether to surface banner
  useEffect(() => {
    if (!draftKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const env = JSON.parse(raw) as DraftEnvelope;
      if (!env || typeof env.html !== "string") return;
      if (Date.now() - env.updatedAt > TTL_MS) {
        window.localStorage.removeItem(draftKey);
        return;
      }
      // Suppress banner if local draft is essentially the value we already have, or just-written
      if (env.html === value) return;
      if (env.updatedAt > openTimeRef.current - FRESH_GUARD_MS) return;
      setDetectedDraft(env);
    } catch {
      /* malformed; ignore */
    }
    // intentionally no deps beyond draftKey: only run on mount per editor instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Debounced write
  useEffect(() => {
    if (!draftKey || typeof window === "undefined") return;
    if (value === lastSavedRef.current) return;
    const handle = window.setTimeout(() => {
      try {
        const env: DraftEnvelope = { html: value, updatedAt: Date.now() };
        window.localStorage.setItem(draftKey, JSON.stringify(env));
        lastSavedRef.current = value;
      } catch {
        /* quota exceeded — silently ignore */
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [draftKey, value]);

  const restore = useCallback((): string | null => {
    if (!detectedDraft) return null;
    const html = detectedDraft.html;
    setDetectedDraft(null);
    return html;
  }, [detectedDraft]);

  const discard = useCallback(() => {
    if (draftKey && typeof window !== "undefined") {
      window.localStorage.removeItem(draftKey);
    }
    setDetectedDraft(null);
  }, [draftKey]);

  const clear = useCallback(() => {
    if (draftKey && typeof window !== "undefined") {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  return { detectedDraft, restore, discard, clear };
}
```

- [ ] **Step 2: Wire into RichTextEditor**

Modify `components/admin/RichTextEditor/index.tsx` to use the hook + render the banner. Add at the top of imports:

```tsx
import { useDraftAutosave } from "./hooks/useDraftAutosave";
```

Inside the component (after `useImageUpload`):

```tsx
const { detectedDraft, restore, discard } = useDraftAutosave(draftKey, value);

const handleRestore = () => {
  const html = restore();
  if (html !== null) onChange(html);
};
```

In the JSX, render the banner above the editor div (above the toolbar is fine, but above the contentEditable is more visible):

```tsx
{detectedDraft && (
  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm text-amber-300">
    <span>检测到未保存的草稿（{Math.max(1, Math.round((Date.now() - detectedDraft.updatedAt) / 60000))} 分钟前）</span>
    <div className="flex items-center gap-2">
      <button onClick={handleRestore} className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30">恢复</button>
      <button onClick={discard} className="px-2 py-0.5 rounded text-amber-300/70 hover:text-amber-200">丢弃</button>
    </div>
  </div>
)}
```

- [ ] **Step 3: Wire into article editor**

In `app/admin/articles/page.tsx`, in `<ArticleEditor>`:

1. Compute `draftKey`:

```tsx
const draftKey = `draft:articles:${slug ?? "new"}`;
```

2. Pass to RichTextEditor: `<RichTextEditor draftKey={draftKey} ... />`

3. Inside the save handler, after a successful save, clear the local draft. Easiest is to expose a ref to the hook clear method — but a simpler self-contained pattern is to call `localStorage.removeItem(draftKey)` directly after success:

```tsx
if (data.success) {
  if (typeof window !== "undefined") window.localStorage.removeItem(draftKey);
  onSaved(savedSlug);
}
```

- [ ] **Step 4: Wire into project editor (`app/admin/projects/page.tsx`)**

```tsx
const draftKey = `draft:projects:${slug ?? "new"}`;
// pass draftKey to <RichTextEditor>
// after successful save: localStorage.removeItem(draftKey)
```

- [ ] **Step 5: Wire into category editor (`app/admin/categories/page.tsx`)**

```tsx
const draftKey = `draft:categories:${name ?? "new"}`;
// pass draftKey to <RichTextEditor>
// after successful save: localStorage.removeItem(draftKey)
```

- [ ] **Step 6: Smoke test**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1
rm -rf .next; rm -f /tmp/blog-dev.log; npm run dev > /tmp/blog-dev.log 2>&1 &
until grep -qE "Ready in|Error" /tmp/blog-dev.log; do sleep 0.5; done
```

Manual:
1. `/admin/articles?new=1`, type a title + content; close tab; reopen → banner appears with "X 分钟前" (just-written draft is suppressed for 30s, wait 35s before reopen)
2. Click 恢复 → content restored
3. Save → banner stays gone; localStorage[draftKey] is removed (verify in DevTools Application > Local Storage)

- [ ] **Step 7: Type-check + Lint**

```bash
npm run type-check && npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add components/admin/RichTextEditor/hooks/useDraftAutosave.ts components/admin/RichTextEditor/index.tsx app/admin/articles/page.tsx app/admin/projects/page.tsx app/admin/categories/page.tsx
git commit -m "feat(admin): localStorage draft autosave with restore banner

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

<a id="phase-8"></a>
## Phase 8 — Cleanup + Final Build

### Task 20: Audit dead code and unused imports

**Files:**
- (Review all touched files)

- [ ] **Step 1: Run lint with `--fix` to auto-clear unused imports**

```bash
npm run lint -- --fix
```

If lint script doesn't pass `--fix` through, run:

```bash
npx next lint --fix
```

- [ ] **Step 2: Manually scan the old files for leftover state/handler bodies that no longer ship UI**

```bash
grep -nE "showFontFamilyDialog|showFontSizeDialog|showFontColorDialog|showLineHeightDialog|showParagraphSpacingDialog|toggleFullscreen|customFontSize" app/admin/articles/page.tsx app/admin/projects/page.tsx
```

If any matches: those are stale state vars from the pre-extraction era. Delete them along with their `useState` declarations. The dialogs/fullscreen all live inside `<RichTextEditor>` now.

- [ ] **Step 3: Re-run type-check + lint**

```bash
npm run type-check && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(admin): remove dead state from refactored pages

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" || echo "nothing to commit"
```

---

### Task 21: Fix the pre-existing `app/admin/articles/page.tsx:430` type error

**Files:**
- Modify: `app/admin/articles/page.tsx`

This was the only pre-existing type-check error: `error TS2367: This comparison appears to be unintentional because the types '"list"' and '"editor"' have no overlap.` Since we removed the `view` state entirely (replaced by URL `selectedId`), this comparison should be gone. If it's not, delete it.

- [ ] **Step 1: Verify there's nothing left referencing the old `view` state**

```bash
grep -n 'view ===\|setView\|view:.*"list"\|view:.*"editor"' app/admin/articles/page.tsx || echo "clean"
```

Expected: `clean`. If anything remains, delete it.

- [ ] **Step 2: Re-run full type-check (should now be zero errors)**

```bash
npm run type-check
```

Expected: no output, exit 0.

- [ ] **Step 3: Commit if any change**

```bash
git add app/admin/articles/page.tsx
git commit -m "fix(admin): remove stale view-mode comparison

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" || echo "already clean"
```

---

### Task 22: Full build + final acceptance smoke

**Files:**
- (Read-only verification)

- [ ] **Step 1: Run the full prebuild + build pipeline**

```bash
npm run build 2>&1 | tail -40
```

Expected: build completes successfully; no TypeScript / ESLint errors.

- [ ] **Step 2: Restart dev server and run the manual checklist**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1
rm -rf .next; rm -f /tmp/blog-dev.log; npm run dev > /tmp/blog-dev.log 2>&1 &
until grep -qE "Ready in|Error" /tmp/blog-dev.log; do sleep 0.5; done
```

Manual checklist (every box must check):

- [ ] `/admin` redirects to `/admin/articles`
- [ ] `/admin/article` redirects to `/admin/articles`
- [ ] `/admin/project` redirects to `/admin/projects`
- [ ] `/admin/write` redirects to `/admin/articles?new=1`
- [ ] Sidebar visible on every authenticated `/admin/*` page; NOT visible on `/admin/login`
- [ ] Sidebar active highlight follows current route
- [ ] "+ 新建" dropdown works (新文章/新项目/新专栏)
- [ ] `/admin/articles`: list visible · search filters · 草稿/已发布 filter · click row loads editor · save updates list · delete removes row · 写文章 button opens new editor · save creates new entry
- [ ] `/admin/projects`: same flow
- [ ] `/admin/categories`: same flow + RichTextEditor for description_long renders & saves
- [ ] `/categories/<name>` public page renders description_long banner if set
- [ ] `/admin/about`, `/admin/theme`, `/admin/stats` load and (where applicable) save
- [ ] Draft autosave banner appears after closing/reopening editor with unsaved content; "恢复" restores; "丢弃" clears localStorage
- [ ] Mobile (≤md): hamburger toggles sidebar; click outside closes it
- [ ] Logout works

- [ ] **Step 3: Final commit (if anything sneaks in)**

```bash
git add -A
git status
# Only commit if there are stray changes from manual fixes
git commit -m "chore: final cleanup after acceptance smoke

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" || echo "clean"
```

- [ ] **Step 4: Push (only when user asks)**

Don't push automatically. Tell the user the branch is ready and offer to push or open a PR.

---

## Self-Review Notes

**Spec coverage:**
- §1 Admin Shell → Tasks 7–9
- §2 RichTextEditor (props, hooks, draft) → Tasks 1–5, 19
- §3 SplitWorkspace → Task 14 (created), 15/17 (reused)
- §4 articles fields → Task 14
- §4 categories fields incl. description_long → Tasks 16–18
- §4 projects fields → Tasks 6 (extract), 15 (split refactor)
- §5 migration steps → Tasks 1–22 follow exactly the 6 phases laid out in spec §5
- §6 Compatibility (redirects, yaml backward-compat) → Tasks 10, 13, 16
- §7 Risks (key={selectedId} unmount) → applied in Tasks 14, 15, 17
- §8 Verification checklist → Task 22

**Type/name consistency check:**
- `RichTextEditorProps` shape matches between Task 1 (skeleton) and Task 5 (final wiring): added `uploadMeta` prop in Task 5; that's the only addition and it's optional, so callers in Task 6 still compile.
- `SplitWorkspace<T extends { id: string }>` is consistent across Tasks 14, 15, 17. All three callers map their domain id (`slug`/`name`) into `id` field at fetch time.
- Draft key naming: spec says `draft:articles:<slug|new>` / `draft:projects:<slug|new>`; plan adds `draft:categories:<name|new>` (consistent extension). Documented in spec §2 and used uniformly in Task 19.
- API contract for `description_long`: declared optional in `lib/categories.ts` (Task 16), conditionally rendered in public page (Task 18) — old yaml files without the field continue to work.

**Placeholder scan:** zero "TBD"/"TODO"/"implement later". The two skeletons that say "Copy state + handlers verbatim" (`ArticleEditor`/`ProjectEditor` inner components in Tasks 14/15) are explicit instructions to migrate existing code, not placeholders.
