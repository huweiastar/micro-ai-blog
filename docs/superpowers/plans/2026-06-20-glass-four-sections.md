# 四板块毛玻璃重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把「说说 / 杂谈 / 友链 / 关于」四个板块按参考站 xinghuisama 的毛玻璃风格重构（展示端，读内容文件，架构无关）。

**Architecture:** 单 Next.js 仓库内新增/升级展示页：复用现有 MDX 管线与 `content/*` 文件作为数据源；新增 `GlassCard` 统一玻璃卡；动效用现有 `RevealList` + CSS（不引 framer-motion）。架构拆分（管理端）属后续独立 plan，不在此。

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind · gray-matter/remark/rehype · js-yaml · vitest（逻辑单测）· Playwright（页面抽查）

**前置：** 在隔离 worktree/分支 `feat/glass-four-sections` 上执行。每个任务末尾 commit。每组完成后跑 `npm run type-check && npm run lint`；UI 任务用隔离构建 `NEXT_DIST_DIR=.next.verify npm run build`，禁止污染生产 `.next`。

**关键集成点（实现期遵循，勿臆造）：**
- `lib/posts.ts`：`type BlogPost`（`type:"article"|"note"`）、`parsePostFile`（gray-matter → BlogPost，第 87 行起）、`getAllNotesSync()`、`renderMarkdownToHtml()`、进程级缓存 `readAllPostFiles`。
- `lib/gallery.ts`：yaml 读取器范式（友链/杂谈仿此）。
- `components/ui/Container.tsx`（size: prose/default/wide）、`components/ui/PageHeader.tsx`（title/description/count/countLabel）。
- `components/RevealList.tsx`（包裹直接子节点做入场交错）。
- 既有全局 `.glass` class、CSS 变量 `--card/--card-border/--foreground/--muted/--primary/--accent`。
- 灯箱：全局 `ImageZoom` 监听带 `data-zoomable` 的容器内 `<img>`（相册同款）。

---

## 组 0：玻璃地基

### Task 1: GlassCard 组件

**Files:**
- Create: `components/ui/GlassCard.tsx`

- [ ] **Step 1: 写组件**

```tsx
import { clsx } from "clsx";

type Radius = "lg" | "xl" | "2xl";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "a" | "li";
  /** 圆角档：lg=rounded-2xl, xl=rounded-3xl, 2xl=rounded-[2rem] */
  radius?: Radius;
  /** hover 抬升+加深阴影 */
  hover?: boolean;
}

const RADIUS: Record<Radius, string> = {
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-[2rem]",
};

/**
 * 统一毛玻璃卡：浅白/深蓝半透明 + backdrop-blur + 半透明白边 + 阴影。
 * 走站点 CSS 变量，亮暗自适应。参考 xinghuisama 配方。
 */
export function GlassCard({
  children,
  className,
  as: Tag = "div",
  radius = "xl",
  hover = false,
}: GlassCardProps) {
  return (
    <Tag
      className={clsx(
        "border border-white/40 bg-white/60 shadow-lg backdrop-blur-xl",
        "dark:border-white/10 dark:bg-[var(--card)]/55",
        RADIUS[radius],
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
        className
      )}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run type-check`
Expected: PASS（无新错误）

- [ ] **Step 3: Commit**

```bash
git add components/ui/GlassCard.tsx
git commit -m "feat(ui): 新增 GlassCard 统一毛玻璃卡片"
```

---

## 组 1：说说（升级 `/notes`）

### Task 2: BlogPost 增加 mood/images/location（TDD）

**Files:**
- Modify: `lib/posts.ts`（`type BlogPost` 约第 19 行；`parsePostFile` 约第 87 行）
- Test: `lib/posts.notes-fields.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// lib/posts.notes-fields.test.ts
import { describe, it, expect } from "vitest";
import matter from "gray-matter";

// 复刻 parsePostFile 的字段映射意图：mood/images/location 从 frontmatter 透传
import { extractMomentFields } from "./posts";

describe("说说 frontmatter 字段", () => {
  it("透传 mood / images / location", () => {
    const { data } = matter(
      [
        "---",
        "type: note",
        "mood: 思考",
        "location: 北京",
        "images:",
        "  - /a.jpg",
        "  - /b.jpg",
        "---",
        "正文",
      ].join("\n")
    );
    expect(extractMomentFields(data)).toEqual({
      mood: "思考",
      location: "北京",
      images: ["/a.jpg", "/b.jpg"],
    });
  });

  it("缺省时全部为 undefined/空", () => {
    const { data } = matter(["---", "type: note", "---", "x"].join("\n"));
    expect(extractMomentFields(data)).toEqual({
      mood: undefined,
      location: undefined,
      images: [],
    });
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run lib/posts.notes-fields.test.ts`
Expected: FAIL（`extractMomentFields` 未导出）

- [ ] **Step 3: 实现**

在 `lib/posts.ts` 的 `type BlogPost` 增加可选字段：

```ts
  // 说说（note）专用，可选
  mood?: string;
  location?: string;
  images?: string[];
```

新增导出辅助并在 `parsePostFile` 返回对象里使用：

```ts
export function extractMomentFields(data: Record<string, unknown>) {
  const images = Array.isArray(data.images)
    ? (data.images.filter((s) => typeof s === "string") as string[])
    : [];
  return {
    mood: typeof data.mood === "string" ? data.mood : undefined,
    location: typeof data.location === "string" ? data.location : undefined,
    images,
  };
}
```

在 `parsePostFile` 的 return（约第 92-108 行）追加：

```ts
    ...extractMomentFields(data),
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run lib/posts.notes-fields.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/posts.ts lib/posts.notes-fields.test.ts
git commit -m "feat(notes): BlogPost 透传 mood/images/location 字段"
```

### Task 3: timeAgo 工具（TDD）

**Files:**
- Modify: `lib/utils.ts`（追加导出）
- Test: `lib/time-ago.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// lib/time-ago.test.ts
import { describe, it, expect } from "vitest";
import { timeAgo } from "./utils";

describe("timeAgo", () => {
  const now = new Date("2026-06-20T12:00:00Z").getTime();
  it("一分钟内→刚刚", () => {
    expect(timeAgo("2026-06-20T11:59:30Z", now)).toBe("刚刚");
  });
  it("分钟级", () => {
    expect(timeAgo("2026-06-20T11:30:00Z", now)).toBe("30 分钟前");
  });
  it("小时级", () => {
    expect(timeAgo("2026-06-20T09:00:00Z", now)).toBe("3 小时前");
  });
  it("超过一天→年.月.日", () => {
    expect(timeAgo("2026-06-18T09:00:00Z", now)).toBe("2026.06.18");
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run lib/time-ago.test.ts`
Expected: FAIL（`timeAgo` 未定义）

- [ ] **Step 3: 实现**（追加到 `lib/utils.ts` 末尾）

```ts
/** 相对时间：刚刚 / N 分钟前 / N 小时前 / 超过一天显示 年.月.日。 */
export function timeAgo(dateStr: string, nowMs: number = Date.now()): string {
  const t = new Date(dateStr).getTime();
  const diff = Math.floor((nowMs - t) / 1000);
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  const d = new Date(dateStr);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run lib/time-ago.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts lib/time-ago.test.ts
git commit -m "feat(utils): 新增 timeAgo 相对时间"
```

### Task 4: MomentImages 配图九宫格

**Files:**
- Create: `components/notes/MomentImages.tsx`

- [ ] **Step 1: 写组件**

```tsx
/**
 * 说说配图：1 张居中 / 多张九宫格（最多 9，超出显示 +N）。
 * 外层带 data-zoomable，复用全局 ImageZoom 灯箱。
 */
export function MomentImages({ images }: { images?: string[] }) {
  if (!images || images.length === 0) return null;
  const count = images.length;
  const shown = images.slice(0, 9);
  const cols = count === 1 ? 1 : count <= 4 ? 2 : 3;

  return (
    <div
      data-zoomable
      className="mt-4 grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        maxWidth: count === 1 ? 320 : cols === 2 ? 320 : 360,
      }}
    >
      {shown.map((src, i) => {
        const more = i === 8 && count > 9;
        return (
          <div
            key={src + i}
            className="relative aspect-square overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="说说配图"
              loading="lazy"
              className="absolute inset-0 h-full w-full cursor-zoom-in object-cover transition-transform duration-500 hover:scale-105"
            />
            {more && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-black text-white backdrop-blur-[2px]">
                +{count - 9}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/notes/MomentImages.tsx
git commit -m "feat(notes): 说说配图九宫格组件"
```

### Task 5: MomentCard 朋友圈式玻璃卡

**Files:**
- Create: `components/notes/MomentCard.tsx`

- [ ] **Step 1: 写组件**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, MapPin, MessageCircle, Heart } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { MomentImages } from "./MomentImages";
import { Tag } from "../Tag";
import { timeAgo } from "../../lib/utils";

export interface MomentCardProps {
  slug: string;
  date: string;
  html: string;
  tags: string[];
  mood?: string;
  location?: string;
  images?: string[];
  authorName: string;
  avatar?: string;
  commentsEnabled: boolean;
}

export function MomentCard(props: MomentCardProps) {
  const { slug, date, html, tags, mood, location, images, authorName, avatar, commentsEnabled } = props;
  const [likes, setLikes] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/likes?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && typeof d.count === "number") setLikes(d.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <GlassCard as="article" radius="xl" hover className="group relative overflow-hidden p-5 sm:p-7">
      {/* 头部 */}
      <div className="mb-4 flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] shadow-md">
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={authorName} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold tracking-wide text-[var(--primary)]">{authorName}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
            <Clock className="h-3 w-3" />
            <time dateTime={date}>{timeAgo(date)}</time>
          </div>
        </div>
        {mood && (
          <span className="ml-auto shrink-0 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
            {mood}
          </span>
        )}
      </div>

      {/* 正文 */}
      <div
        className="note-card-content prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <MomentImages images={images} />

      {/* 底部 */}
      <div className="mt-5 flex items-center gap-4 text-sm text-[var(--muted)]">
        {location && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
            <MapPin className="h-3 w-3 shrink-0" />
            {location}
          </span>
        )}
        {tags.length > 0 && (
          <span className="flex flex-wrap items-center gap-2">
            {tags.map((t) => (
              <Tag key={t} name={t} />
            ))}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1.5" title="点赞数">
          <Heart className="h-4 w-4" />
          {likes ?? "–"}
        </span>
        {commentsEnabled && (
          <Link
            href={`/blog/${slug}`}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--primary)]"
            title="进入查看评论"
          >
            <MessageCircle className="h-4 w-4" />
            评论
          </Link>
        )}
      </div>
    </GlassCard>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/notes/MomentCard.tsx
git commit -m "feat(notes): MomentCard 朋友圈式毛玻璃卡"
```

### Task 6: NotesFeed 客户端（搜索 + 排序）

**Files:**
- Create: `components/notes/NotesFeed.tsx`

- [ ] **Step 1: 写组件**

```tsx
"use client";

import { useMemo, useState } from "react";
import { Search, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { MomentCard, type MomentCardProps } from "./MomentCard";

type Moment = Omit<MomentCardProps, "authorName" | "avatar" | "commentsEnabled"> & {
  plain: string; // 去标签的纯文本，供搜索
};

export function NotesFeed({
  moments,
  authorName,
  avatar,
  commentsEnabled,
}: {
  moments: Moment[];
  authorName: string;
  avatar?: string;
  commentsEnabled: boolean;
}) {
  const [q, setQ] = useState("");
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const list = useMemo(() => {
    let r = [...moments];
    const query = q.trim().toLowerCase();
    if (query) {
      r = r.filter(
        (m) =>
          m.plain.toLowerCase().includes(query) ||
          (m.location ?? "").toLowerCase().includes(query)
      );
    }
    r.sort((a, b) => {
      const t = new Date(a.date).getTime() - new Date(b.date).getTime();
      return order === "desc" ? -t : t;
    });
    return r;
  }, [moments, q, order]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索说说…"
            className="w-full rounded-full border border-[var(--card-border)] bg-[var(--card)] py-2 pl-9 pr-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]/50"
          />
        </div>
        <button
          onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
          aria-label="切换时间排序"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
        >
          {order === "desc" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpZA className="h-4 w-4" />}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--muted)]">没有匹配的说说。</p>
      ) : (
        list.map((m) => (
          <MomentCard
            key={m.slug}
            {...m}
            authorName={authorName}
            avatar={avatar}
            commentsEnabled={commentsEnabled}
          />
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/notes/NotesFeed.tsx
git commit -m "feat(notes): NotesFeed 搜索+排序信息流"
```

### Task 7: 重写 `/notes` 页面为说说

**Files:**
- Modify: `app/notes/page.tsx`（整文件替换）

- [ ] **Step 1: 替换页面**

```tsx
import { StickyNote } from "lucide-react";
import { getAllNotesSync, renderMarkdownToHtml } from "../../lib/posts";
import { getAboutProfile } from "../../lib/about";
import { NotesFeed } from "../../components/notes/NotesFeed";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { isGiscusConfigured } from "../../config/comments";
import { generatePageMetadata, getSiteUrl } from "../../lib/seo";
import type { Metadata } from "next";

const siteUrl = getSiteUrl();

export const metadata: Metadata = generatePageMetadata({
  title: "说说",
  description: "碎片记录与即时思考",
  url: `${siteUrl}/notes`,
});

function toPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function NotesPage() {
  const notes = getAllNotesSync();
  const profile = getAboutProfile();
  const commentsEnabled = isGiscusConfigured();

  const moments = await Promise.all(
    notes.map(async (n) => {
      const html = await renderMarkdownToHtml(n.content);
      return {
        slug: n.slug,
        date: n.date,
        html,
        plain: toPlainText(html),
        tags: n.tags,
        mood: n.mood,
        location: n.location,
        images: n.images,
      };
    })
  );

  return (
    <>
      <PageHeader title="说说" description="碎片记录与即时思考" count={notes.length} countLabel="条" />
      <Container size="prose" className="pb-12">
        {moments.length === 0 ? (
          <div className="py-20 text-center text-[var(--muted)]">
            <StickyNote className="mx-auto mb-4 h-10 w-10 opacity-50" />
            <p>还没有说说，第一条碎片想法正在路上。</p>
          </div>
        ) : (
          <NotesFeed
            moments={moments}
            authorName={profile.name}
            avatar={profile.avatar}
            commentsEnabled={commentsEnabled}
          />
        )}
      </Container>
    </>
  );
}
```

- [ ] **Step 2: 隔离构建**

Run: `NEXT_DIST_DIR=.next.verify npm run build`
Expected: PASS（`/notes` 编译通过）；完成后 `rm -rf .next.verify`

- [ ] **Step 3: Commit**

```bash
git add app/notes/page.tsx
git commit -m "feat(notes): /notes 重构为毛玻璃说说信息流"
```

---

## 组 2：杂谈（新建 `/chatters`）

### Task 8: lib/chatters 读取器（TDD）

**Files:**
- Create: `lib/chatters.ts`
- Test: `lib/chatters.test.ts`
- Create（测试夹具）: `content/chatters/2026-06-20-sample.mdx`

- [ ] **Step 1: 写示例内容**

```mdx
---
title: 第一篇杂谈
date: "2026-06-20"
tags: [随笔, 生活]
mood: 随意
cover: ""
summary: 杂谈板块的第一篇，随便聊聊。
---

这里是杂谈正文，比说说长、比技术博客随意。
```

- [ ] **Step 2: 写失败测试**

```ts
// lib/chatters.test.ts
import { describe, it, expect } from "vitest";
import { getAllChattersSync, getChatterBySlug } from "./chatters";

describe("chatters loader", () => {
  it("读到示例并按日期倒序", () => {
    const list = getAllChattersSync();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("slug");
    expect(list[0]).toHaveProperty("title");
  });
  it("按 slug 取详情", () => {
    const list = getAllChattersSync();
    const one = getChatterBySlug(list[0].slug);
    expect(one?.title).toBe(list[0].title);
    expect(typeof one?.content).toBe("string");
  });
  it("不存在的 slug 返回 null", () => {
    expect(getChatterBySlug("nope-xxx")).toBeNull();
  });
});
```

- [ ] **Step 3: 运行确认失败**

Run: `npx vitest run lib/chatters.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 4: 实现**

```ts
// lib/chatters.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const dir = path.join(process.cwd(), "content/chatters");

export interface Chatter {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  mood?: string;
  cover?: string;
  summary: string;
  content: string;
}

function parse(file: string): Chatter {
  const raw = fs.readFileSync(path.join(dir, file), "utf-8");
  const { data, content } = matter(raw);
  return {
    slug: (typeof data.slug === "string" && data.slug) || file.replace(/\.mdx?$/, ""),
    title: typeof data.title === "string" ? data.title : "无题",
    date: typeof data.date === "string" ? data.date : "",
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    mood: typeof data.mood === "string" ? data.mood : undefined,
    cover: typeof data.cover === "string" && data.cover ? data.cover : undefined,
    summary: typeof data.summary === "string" ? data.summary : "",
    content,
  };
}

function readAll(): Chatter[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map(parse)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function getAllChattersSync(): Chatter[] {
  return readAll();
}

export function getChatterBySlug(slug: string): Chatter | null {
  return readAll().find((c) => c.slug === slug) ?? null;
}
```

- [ ] **Step 5: 运行确认通过**

Run: `npx vitest run lib/chatters.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/chatters.ts lib/chatters.test.ts content/chatters/2026-06-20-sample.mdx
git commit -m "feat(chatters): 杂谈内容读取器 + 示例"
```

### Task 9: 杂谈列表页 `/chatters`

**Files:**
- Create: `app/chatters/page.tsx`

- [ ] **Step 1: 写页面**

```tsx
import Link from "next/link";
import { getAllChattersSync } from "../../lib/chatters";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { RevealList } from "../../components/RevealList";
import { Tag } from "../../components/Tag";
import { formatShortDate } from "../../lib/utils";
import { generatePageMetadata } from "../../lib/seo";
import { MessageSquareText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "杂谈",
  description: "比说说长、比博客随意的碎碎念",
});

export default function ChattersPage() {
  const chatters = getAllChattersSync();

  return (
    <>
      <PageHeader title="杂谈" description="比说说长、比博客随意的碎碎念" count={chatters.length} countLabel="篇" />
      <Container className="pb-16">
        {chatters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-20 text-center">
            <MessageSquareText className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]/60" />
            <p className="text-sm text-[var(--muted)]">
              还没有杂谈，往 <code className="font-mono">content/chatters/</code> 添加 .mdx 即可。
            </p>
          </div>
        ) : (
          <RevealList className="grid gap-5 sm:grid-cols-2">
            {chatters.map((c) => (
              <GlassCard key={c.slug} as="article" hover className="overflow-hidden">
                <Link href={`/chatters/${c.slug}`} className="block">
                  {c.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover} alt={c.title} className="h-40 w-full object-cover" loading="lazy" />
                  )}
                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <time>{formatShortDate(c.date)}</time>
                      {c.mood && (
                        <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[var(--primary)]">{c.mood}</span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-[var(--foreground)]">{c.title}</h2>
                    {c.summary && (
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{c.summary}</p>
                    )}
                    {c.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {c.tags.map((t) => (
                          <Tag key={t} name={t} />
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </GlassCard>
            ))}
          </RevealList>
        )}
      </Container>
    </>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run type-check`
Expected: PASS（确认 `formatShortDate` 存在于 `lib/utils.ts`；若名称不同则用实际的短日期格式化函数）

- [ ] **Step 3: Commit**

```bash
git add app/chatters/page.tsx
git commit -m "feat(chatters): 杂谈列表页"
```

### Task 10: 杂谈详情页 `/chatters/[slug]`

**Files:**
- Create: `app/chatters/[slug]/page.tsx`

- [ ] **Step 1: 写页面**

```tsx
import { notFound } from "next/navigation";
import { getAllChattersSync, getChatterBySlug } from "../../../lib/chatters";
import { renderMarkdownToHtml } from "../../../lib/posts";
import { Container } from "../../../components/ui/Container";
import { Comment } from "../../../components/Comment";
import { Tag } from "../../../components/Tag";
import { formatDate } from "../../../lib/utils";
import { generatePageMetadata } from "../../../lib/seo";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAllChattersSync().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getChatterBySlug(slug);
  if (!c) return {};
  return generatePageMetadata({ title: c.title, description: c.summary });
}

export default async function ChatterDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getChatterBySlug(slug);
  if (!c) notFound();
  const html = await renderMarkdownToHtml(c.content);

  return (
    <Container size="prose" className="py-12">
      <header className="mb-8">
        <div className="mb-3 flex items-center gap-2 text-sm text-[var(--muted)]">
          <time>{formatDate(c.date)}</time>
          {c.mood && (
            <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs text-[var(--primary)]">{c.mood}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{c.title}</h1>
        {c.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {c.tags.map((t) => (
              <Tag key={t} name={t} />
            ))}
          </div>
        )}
      </header>
      <article
        className="prose-custom max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="mt-16">
        <Comment slug={`chatter-${c.slug}`} title={c.title} />
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: 隔离构建**

Run: `NEXT_DIST_DIR=.next.verify npm run build`
Expected: PASS（`/chatters` 与 `/chatters/[slug]` 出现在路由表）；完成后 `rm -rf .next.verify`
（注意：确认 `components/Comment` 的 props 与 `app/guestbook/page.tsx` 用法一致：`slug` + `title`。）

- [ ] **Step 3: Commit**

```bash
git add app/chatters/[slug]/page.tsx
git commit -m "feat(chatters): 杂谈详情页 + 评论"
```

### Task 11: 杂谈接入 sitemap

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: 修改**

顶部加 import：

```ts
import { getAllChattersSync } from "../lib/chatters";
```

在 return 数组里（`/about` 项之后、posts 展开之前）加入静态项与详情展开：

```ts
    {
      url: `${siteUrl}/chatters`,
      lastModified: lastContent,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...getAllChattersSync().map((c) => ({
      url: `${siteUrl}/chatters/${c.slug}`,
      lastModified: new Date(c.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
```

- [ ] **Step 2: 隔离构建**

Run: `NEXT_DIST_DIR=.next.verify npm run build`
Expected: PASS；完成后 `rm -rf .next.verify`

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(chatters): 杂谈接入 sitemap"
```

---

## 组 3：友链（新建 `/friends`）

### Task 12: 友链数据 + config + 读取器（TDD）

**Files:**
- Create: `content/friends.yaml`
- Create: `config/friends.ts`
- Create: `lib/friends.ts`
- Test: `lib/friends.test.ts`

- [ ] **Step 1: 写数据与 config**

`content/friends.yaml`：

```yaml
friends:
  - name: 示例朋友
    url: https://example.com
    description: 这里是一句简短的站点介绍。
    avatar: ""
    themeColor: "rgba(99,102,241,0.5)"
```

`config/friends.ts`：

```ts
export const friendLinkApplyFormat = [
  "名称：微观AI",
  "链接：https://huweiastar.deepai.icu",
  "头像：https://huweiastar.deepai.icu/images/avatar/avatar.webp",
  "简介：专注大数据与大模型工程的技术博客",
].join("\n");
```

- [ ] **Step 2: 写失败测试**

```ts
// lib/friends.test.ts
import { describe, it, expect } from "vitest";
import { getFriends } from "./friends";

describe("friends loader", () => {
  it("读到示例友链", () => {
    const list = getFriends();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("name");
    expect(list[0]).toHaveProperty("url");
  });
  it("过滤掉缺 name/url 的条目", () => {
    // 仅验证返回项均含必填字段
    for (const f of getFriends()) {
      expect(typeof f.name).toBe("string");
      expect(f.name.length).toBeGreaterThan(0);
      expect(typeof f.url).toBe("string");
    }
  });
});
```

- [ ] **Step 3: 运行确认失败**

Run: `npx vitest run lib/friends.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 4: 实现**

```ts
// lib/friends.ts
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const friendsPath = path.join(process.cwd(), "content/friends.yaml");

export interface Friend {
  name: string;
  url: string;
  description?: string;
  avatar?: string;
  themeColor?: string;
}

export function getFriends(): Friend[] {
  if (!fs.existsSync(friendsPath)) return [];
  const data = yaml.load(fs.readFileSync(friendsPath, "utf-8")) as
    | { friends?: Friend[] }
    | null;
  return (data?.friends ?? []).filter(
    (f) => f && typeof f.name === "string" && f.name && typeof f.url === "string" && f.url
  );
}
```

- [ ] **Step 5: 运行确认通过**

Run: `npx vitest run lib/friends.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add content/friends.yaml config/friends.ts lib/friends.ts lib/friends.test.ts
git commit -m "feat(friends): 友链数据/配置/读取器"
```

### Task 13: 友链页 `/friends`

**Files:**
- Create: `components/friends/FriendCard.tsx`
- Create: `components/friends/ApplyBox.tsx`
- Create: `app/friends/page.tsx`

- [ ] **Step 1: FriendCard**

```tsx
import { GlassCard } from "../ui/GlassCard";
import type { Friend } from "../../lib/friends";

export function FriendCard({ friend }: { friend: Friend }) {
  return (
    <GlassCard as="div" hover radius="lg" className="group relative overflow-hidden">
      <a href={friend.url} target="_blank" rel="noopener noreferrer" className="block p-4 sm:p-5">
        {/* 主题色光晕 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
          style={{ backgroundColor: friend.themeColor || "rgba(99,102,241,0.4)" }}
        />
        <div className="relative z-[1] flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-tr from-[var(--primary)]/60 to-[var(--accent)]/60 p-[2px] transition-transform duration-700 group-hover:rotate-[360deg]">
            <div className="h-full w-full overflow-hidden rounded-full bg-[var(--card)]">
              {friend.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={friend.avatar} alt={friend.name} className="h-full w-full object-cover" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="truncate font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">
              {friend.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" />
              online
            </div>
          </div>
        </div>
        {friend.description && (
          <p className="relative z-[1] mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
            {friend.description}
          </p>
        )}
      </a>
    </GlassCard>
  );
}
```

- [ ] **Step 2: ApplyBox（一键复制申请格式）**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { friendLinkApplyFormat } from "../../config/friends";

export function ApplyBox() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(friendLinkApplyFormat).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <GlassCard className="mx-auto mt-16 max-w-2xl p-6 text-center sm:p-8">
      <h2 className="text-xl font-black text-[var(--foreground)]">✨ 交换友链</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        欢迎交换友链！复制下方格式，到留言板申请：
      </p>
      <div className="relative mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4 text-left">
        <pre className="whitespace-pre-wrap break-all pr-10 font-mono text-xs text-[var(--muted)]">
          {friendLinkApplyFormat}
        </pre>
        <button
          onClick={copy}
          aria-label="复制申请格式"
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <Link
        href="/guestbook"
        className="mt-5 inline-flex rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        去留言板申请 →
      </Link>
    </GlassCard>
  );
}
```

- [ ] **Step 3: 友链页**

```tsx
import { getFriends } from "../../lib/friends";
import { FriendCard } from "../../components/friends/FriendCard";
import { ApplyBox } from "../../components/friends/ApplyBox";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { RevealList } from "../../components/RevealList";
import { generatePageMetadata } from "../../lib/seo";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "友链",
  description: "散落在赛博宇宙各处的有趣灵魂",
});

export default function FriendsPage() {
  const friends = getFriends();

  return (
    <>
      <PageHeader title="友链" description="散落在赛博宇宙各处的有趣灵魂" count={friends.length} countLabel="位" />
      <Container className="pb-16">
        {friends.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-20 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]/60" />
            <p className="text-sm text-[var(--muted)]">
              还没有友链，往 <code className="font-mono">content/friends.yaml</code> 添加即可。
            </p>
          </div>
        ) : (
          <RevealList className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {friends.map((f) => (
              <FriendCard key={f.url} friend={f} />
            ))}
          </RevealList>
        )}
        <ApplyBox />
      </Container>
    </>
  );
}
```

- [ ] **Step 4: 隔离构建**

Run: `NEXT_DIST_DIR=.next.verify npm run build`
Expected: PASS（`/friends` 在路由表）；完成后 `rm -rf .next.verify`

- [ ] **Step 5: Commit**

```bash
git add components/friends/ app/friends/page.tsx
git commit -m "feat(friends): 友链页（玻璃卡网格 + 申请区）"
```

### Task 14: 友链接入 sitemap

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: 在静态项里追加**（`/chatters` 之后）

```ts
    {
      url: `${siteUrl}/friends`,
      lastModified: lastContent,
      changeFrequency: "monthly",
      priority: 0.4,
    },
```

- [ ] **Step 2: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(friends): 友链接入 sitemap"
```

---

## 组 4：关于增强

### Task 15: `/about` 头图氛围 + 玻璃化

**Files:**
- Modify: `app/about/page.tsx`

- [ ] **Step 1: 替换页面**（保留现有数据来源，新增 hero + GlassCard 化）

```tsx
import { generatePageMetadata } from "../../lib/seo";
import { getAboutProfile } from "../../lib/about";
import { SkillGroup } from "../../components/profile/SkillGroup";
import { ContactCard } from "../../components/profile/ContactCard";
import { GlassCard } from "../../components/ui/GlassCard";
import { Container } from "../../components/ui/Container";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "关于我",
  description: "个人介绍、技术栈和联系方式",
});

export default function AboutPage() {
  const profile = getAboutProfile();

  return (
    <>
      {/* 头图氛围区 */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--primary)]/15 via-[var(--accent)]/5 to-transparent"
        />
        <Container className="relative py-14 text-center">
          {profile.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar}
              alt={profile.name}
              className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[var(--primary)]/20"
            />
          )}
          <h1 className="mt-4 text-2xl font-black text-[var(--foreground)]">👋 {profile.name}</h1>
          {profile.tagline && <p className="mt-2 text-sm text-[var(--muted)]">{profile.tagline}</p>}
        </Container>
      </div>

      <Container className="pb-12">
        <GlassCard className="mb-8 p-6 sm:p-8">
          <h2 className="mb-4 text-xl font-semibold">个人简介</h2>
          <div className="prose-custom max-w-none">
            {profile.bio.split("\n\n").map((para, i) => (
              <p key={i} className="mb-4 leading-relaxed text-[var(--muted)]">
                {para}
              </p>
            ))}
          </div>
        </GlassCard>

        <section className="mb-8">
          <h2 className="mb-6 text-xl font-semibold">技术栈</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profile.skills.map((group, i) => (
              <GlassCard key={group.title} hover className="p-5">
                <SkillGroup title={group.title} items={group.items} hueIndex={i} />
              </GlassCard>
            ))}
          </div>
        </section>

        <ContactCard />
      </Container>
    </>
  );
}
```

- [ ] **Step 2: 隔离构建**

Run: `NEXT_DIST_DIR=.next.verify npm run build`
Expected: PASS（注意确认 `profile.skills` 元素形状 `{title, items}` 与 `SkillGroup` props 一致，沿用原 about 页用法）；完成后 `rm -rf .next.verify`

- [ ] **Step 3: Commit**

```bash
git add app/about/page.tsx
git commit -m "feat(about): 关于页头图氛围 + 毛玻璃化"
```

---

## 组 5：导航与页脚

### Task 16: 导航改名/新增 + 页脚收纳图谱/统计

**Files:**
- Modify: `config/nav.ts`
- Modify: `components/Footer.tsx`

- [ ] **Step 1: 改导航**（`config/nav.ts` 的 `navConfig`）

将「随手记」改为「说说」，新增「杂谈」「友链」，移除「图谱」「统计」：

```ts
export const navConfig: NavItem[] = [
  { title: "首页", href: "/" },
  { title: "博客", href: "/blog" },
  { title: "专栏", href: "/categories" },
  { title: "项目", href: "/projects" },
  { title: "说说", href: "/notes" },
  { title: "杂谈", href: "/chatters" },
  { title: "相册", href: "/gallery" },
  { title: "友链", href: "/friends" },
  { title: "标签", href: "/tags" },
  { title: "足迹", href: "/footprint" },
  { title: "留言板", href: "/guestbook" },
  { title: "关于我", href: "/about" },
];
```

- [ ] **Step 2: 页脚补「探索」列**（`components/Footer.tsx`，在 RSS 列前插入一列，收纳图谱/统计等次要入口）

在 `{/* RSS */}` 区块之前插入：

```tsx
          {/* Explore */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">探索</h3>
            <ul className="space-y-1.5">
              {[
                { title: "知识图谱", href: "/graph" },
                { title: "数据统计", href: "/stats" },
                { title: "归档", href: "/archive" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
```

并把外层 grid 从 `md:grid-cols-4` 调整为 `md:grid-cols-5` 以容纳新列。

- [ ] **Step 3: 隔离构建**

Run: `NEXT_DIST_DIR=.next.verify npm run build`
Expected: PASS；完成后 `rm -rf .next.verify`

- [ ] **Step 4: Commit**

```bash
git add config/nav.ts components/Footer.tsx
git commit -m "feat(nav): 说说/杂谈/友链入导航，图谱/统计收页脚"
```

---

## 组 6：最终验证

### Task 17: 全量校验 + Playwright 抽查

- [ ] **Step 1: 静态校验**

Run: `npm run type-check && npm run lint && npx vitest run`
Expected: 全 PASS

- [ ] **Step 2: 隔离构建**

Run: `NEXT_DIST_DIR=.next.verify npm run build`
Expected: PASS，路由表含 `/notes`、`/chatters`、`/chatters/[slug]`、`/friends`、`/about`；完成后 `rm -rf .next.verify`

- [ ] **Step 3: 启隔离 dev + Playwright 亮/暗抽查**

```bash
lsof -ti:3001 | xargs -r kill 2>/dev/null
NEXT_DIST_DIR=.next.dev npm run dev -- -p 3001 &
# 等待就绪后用 Playwright 逐页截图亮/暗：
# /notes（说说卡+配图+搜索排序）、/chatters、/chatters/<slug>、/friends（hover 光晕/旋转）、/about（头图）
```

逐页确认：玻璃观感、亮暗对比度、移动端不溢出、灯箱可点、空态正常。发现问题回到对应 Task 修复。

- [ ] **Step 4: 收尾**

```bash
lsof -ti:3001 | xargs -r kill 2>/dev/null
rm -rf .next.dev .playwright-mcp
```

- [ ] **Step 5: 合并/部署**

按用户指示合并分支并 `./deploy.sh`（不在本 plan 自动执行）。

---

## 自查覆盖（spec → plan）

- 共享玻璃地基 → Task 1 ✅
- 说说（frontmatter/卡/配图/信息流/页面/改名）→ Task 2–7 ✅
- 杂谈（loader/列表/详情/sitemap）→ Task 8–11 ✅
- 友链（数据/config/loader/页/sitemap）→ Task 12–14 ✅
- 关于增强 → Task 15 ✅
- 导航+页脚收纳 → Task 16 ✅
- 验证计划（type-check/lint/vitest/隔离 build/Playwright）→ Task 17 ✅
- 动效用 RevealList（无 framer-motion）→ Task 9/13 用 RevealList ✅
- 不引 framer-motion / 不大动首页 / 不做管理端编辑器 → 范围外，未出现 ✅
```
