# 体验优化实施方案（Experience Optimizations）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变现有功能的前提下，补齐前台体验短板（加载/错误兜底、首屏 JS 体积、图片优化）并清理若干小项，按收益从高到低依次实施。

**Architecture:** 纯增量改动。新增路由级 `loading/error` 边界文件；用 `next/dynamic` 把仅交互后需要的重客户端组件拆出首屏 bundle；对前台真实封面图启用 `next/image`；其余为配置/数据/测试类小修。每个任务自成一体，可单独提交、单独验证。

**Tech Stack:** Next.js 14.2 App Router, React 18, TypeScript, Tailwind CSS 3, next/dynamic, next/image, vitest。

**全局验证基线（每个任务"完成"前都要过）：**
```bash
npm run type-check && npm run lint
```
涉及构建产物/路由的任务额外跑：`npm run build`。

---

## 优先级总览（高 → 低）

| # | 任务 | 体验维度 | 收益 | 风险 |
|---|------|----------|------|------|
| P1 | 路由级 loading 骨架 + error 边界 | 加载/容错 | 高 | 低 |
| P2 | 懒加载 CommandPalette / AssistantLauncher | 性能（首屏 JS） | 高 | 低 |
| P3 | 前台封面图改用 next/image | 性能/LCP | 中 | 低 |
| P4 | AI 默认模型更新 + 限流局限性记录 | 质量/可维护 | 中 | 低 |
| P5 | sitemap 静态页 lastModified 取最新文章日期 | SEO | 低 | 低 |
| P6 | 提交 tsconfig 改动 + 小清理 | 卫生 | 低 | 极低 |
| P7 | 为 API/鉴权补集成测试 | 可靠性 | 中（长期） | 低 |

---

## Task P1: 路由级 loading 骨架 + error 边界

**背景：** 全仓 0 个 `loading.tsx`/`error.tsx`/`global-error.tsx`。慢网络下数据页白屏；Server Component 抛错会绕过站点外壳显示 Next 默认错误页。

**Files:**
- Create: `components/ui/Skeleton.tsx`
- Create: `app/loading.tsx`
- Create: `app/blog/loading.tsx`
- Create: `app/blog/[slug]/loading.tsx`
- Create: `app/search/loading.tsx`
- Create: `app/error.tsx`
- Create: `app/global-error.tsx`

- [ ] **Step 1: 新增通用骨架组件**

`components/ui/Skeleton.tsx`：
```tsx
import { clsx } from "clsx";

/** 通用骨架块：用 Tailwind animate-pulse + 主题变量配色，暗/亮色自适应。 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-[var(--muted)]/15",
        className,
      )}
    />
  );
}

/** 文章卡片骨架，匹配 BlogCard 的大致版式。 */
export function BlogCardSkeleton() {
  return (
    <div className="glass rounded-xl p-6 pl-7">
      <Skeleton className="mb-4 h-6 w-3/4" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-4 h-4 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 首页 loading**

`app/loading.tsx`：
```tsx
import { Container } from "../components/ui/Container";
import { BlogCardSkeleton, Skeleton } from "../components/ui/Skeleton";

export default function Loading() {
  return (
    <Container>
      <div className="py-16">
        <Skeleton className="mx-auto mb-8 h-10 w-64" />
        <div className="grid gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: 博客列表 + 详情 + 搜索 loading**

`app/blog/loading.tsx` 与 `app/search/loading.tsx`（复用列表骨架）：
```tsx
import { Container } from "../../components/ui/Container";
import { BlogCardSkeleton, Skeleton } from "../../components/ui/Skeleton";

export default function Loading() {
  return (
    <Container>
      <div className="py-12">
        <Skeleton className="mb-8 h-9 w-48" />
        <div className="grid gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </Container>
  );
}
```

`app/blog/[slug]/loading.tsx`（文章正文骨架）：
```tsx
import { Container } from "../../../components/ui/Container";
import { Skeleton } from "../../../components/ui/Skeleton";

export default function Loading() {
  return (
    <Container>
      <article className="py-12">
        <Skeleton className="mb-4 h-10 w-3/4" />
        <Skeleton className="mb-8 h-4 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </article>
    </Container>
  );
}
```
> 注意：`search/loading.tsx` 的相对路径与 `blog/loading.tsx` 同为 `../../`，可直接复用上面的列表骨架代码。

- [ ] **Step 4: 错误边界（client component，必须带 reset）**

`app/error.tsx`：
```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "../components/ui/Container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 仅在客户端记录，便于排障；不上报第三方。
    console.error(error);
  }, [error]);

  return (
    <Container>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">页面出错了</h1>
        <p className="text-[var(--muted)]">抱歉，加载这个页面时出现了问题。</p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition hover:opacity-90"
          >
            重试
          </button>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)] transition hover:bg-[var(--muted)]/10"
          >
            返回首页
          </Link>
        </div>
      </div>
    </Container>
  );
}
```

- [ ] **Step 5: 根级 global-error（必须自带 html/body）**

`app/global-error.tsx`：
```tsx
"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "sans-serif",
        }}
      >
        <h1>站点出现严重错误</h1>
        <button onClick={reset}>重新加载</button>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: 验证**

```bash
npm run type-check && npm run lint && npm run build
```
Expected: 构建成功；构建日志中各路由出现对应的 loading 边界。

手动验证（可选）：`npm run dev`，在 `app/blog/[slug]/page.tsx` 临时 `throw new Error("test")`，确认看到站点内的「页面出错了」而非 Next 默认页；验证后撤销。

- [ ] **Step 7: 提交**

```bash
git add components/ui/Skeleton.tsx app/loading.tsx app/blog/loading.tsx \
  app/blog/[slug]/loading.tsx app/search/loading.tsx app/error.tsx app/global-error.tsx
git commit -m "feat(ux): 新增路由级 loading 骨架与 error/global-error 边界"
```

---

## Task P2: 懒加载 CommandPalette / AssistantLauncher

**背景：** 二者挂在全局 `app/layout.tsx`，首屏即进 bundle。`CommandPalette` 内含 `fuse.js` 与搜索逻辑，`AssistantLauncher` 拉入整个 AI 面板（`AssistantPanel` + Provider）。均为「用户交互后才需要」，应延迟到客户端再加载。

**约束：** `next/dynamic({ ssr: false })` 不能用于 Server Component，而 `app/layout.tsx` 是 Server Component。因此把动态导入封装进新的 client wrapper，再由 layout 引用。

**Files:**
- Create: `components/CommandPalette.lazy.tsx`
- Create: `components/assistant/AssistantLauncher.lazy.tsx`
- Modify: `app/layout.tsx`（替换两处 import 与用法）

- [ ] **Step 1: CommandPalette 懒加载包装**

`components/CommandPalette.lazy.tsx`：
```tsx
"use client";

import dynamic from "next/dynamic";

// 命令面板仅在用户按下快捷键/点击后才需要，且内含 fuse.js，
// 延迟到客户端加载，从首屏 bundle 中剔除。
const CommandPalette = dynamic(
  () => import("./CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

export function CommandPaletteLazy() {
  return <CommandPalette />;
}
```
> 确认 `CommandPalette` 为命名导出（已确认：`export function CommandPalette`）。

- [ ] **Step 2: AssistantLauncher 懒加载包装**

`components/assistant/AssistantLauncher.lazy.tsx`：
```tsx
"use client";

import dynamic from "next/dynamic";

// AI 助手浮窗：交互后才展开，整块面板延迟加载。
const AssistantLauncher = dynamic(
  () => import("./AssistantLauncher").then((m) => m.AssistantLauncher),
  { ssr: false },
);

export function AssistantLauncherLazy() {
  return <AssistantLauncher />;
}
```
> 先确认 `AssistantLauncher` 的导出形式：`grep -n "export" components/assistant/AssistantLauncher.tsx`。若为 `export default`，把 `.then((m) => m.AssistantLauncher)` 改成默认导入 `() => import("./AssistantLauncher")`。

- [ ] **Step 3: 在 layout 中替换引用**

修改 `app/layout.tsx`：
- 删除 `import { AssistantLauncher } from "../components/assistant/AssistantLauncher";`
- 删除 `import { CommandPalette } from "../components/CommandPalette";`
- 新增：
```tsx
import { AssistantLauncherLazy } from "../components/assistant/AssistantLauncher.lazy";
import { CommandPaletteLazy } from "../components/CommandPalette.lazy";
```
- 把 `<SiteChrome>` 的 props 改为：
```tsx
launcher={<AssistantLauncherLazy />}
commandPalette={<CommandPaletteLazy />}
```

- [ ] **Step 4: 验证体积变化**

```bash
npm run type-check && npm run lint && npm run build
```
Expected: 构建成功；首屏 First Load JS 较改动前下降（fuse.js / 助手面板移出共享 chunk）。对比 build 输出的 Route (app) 表的 First Load JS 数值。

手动验证：`npm run dev`，确认 `⌘K`/`Ctrl+K` 仍能唤起命令面板、右下角 AI 助手仍能展开。

- [ ] **Step 5: 提交**

```bash
git add components/CommandPalette.lazy.tsx components/assistant/AssistantLauncher.lazy.tsx app/layout.tsx
git commit -m "perf(bundle): 懒加载命令面板与 AI 助手，缩减首屏 JS"
```

---

## Task P3: 前台封面图改用 next/image

**背景：** `next.config` 已配 avif/webp + remotePatterns（飞书 CDN / S3），但 `BlogCard` 封面仍是原生 `<img>`。改用 `next/image` 可获得自动格式协商、响应式 srcset、内建懒加载。
**范围界定：** 仅改 `BlogCard`（前台真实封面）。`Avatar` 走 localStorage 动态 URL + onError 回退，不适合 next/image，保持原状。`GeneratedCover` 是纯 CSS 渐变，无需处理。

**Files:**
- Modify: `components/BlogCard.tsx`

- [ ] **Step 1: 替换封面渲染**

`components/BlogCard.tsx` 顶部新增：
```tsx
import Image from "next/image";
```
把封面块：
```tsx
{post.cover && (
  <div className="mb-4 -mx-6 -mt-6 overflow-hidden rounded-t-xl">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={post.cover}
      alt={post.title}
      loading="lazy"
      decoding="async"
      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
    />
  </div>
)}
```
替换为：
```tsx
{post.cover && (
  <div className="relative mb-4 -mx-6 -mt-6 h-48 overflow-hidden rounded-t-xl">
    <Image
      src={post.cover}
      alt={post.title}
      fill
      sizes="(max-width: 768px) 100vw, 720px"
      className="object-cover transition-transform duration-500 group-hover:scale-105"
    />
  </div>
)}
```
> `fill` 模式要求父容器 `relative` + 明确高度（已设 `h-48`）。

- [ ] **Step 2: 确认 remotePatterns 覆盖封面来源**

`post.cover` 可能是站内绝对路径（`/...`，next/image 原生支持）或远程 URL。若存在 `next.config` 未列入的远程域名，next/image 会在 dev 报错。检查现有文章封面取值：
```bash
grep -rn "cover:" content/blog/*.mdx
```
若出现新的远程域名，加入 `next.config.mjs` 的 `images.remotePatterns`。

- [ ] **Step 3: 验证**

```bash
npm run type-check && npm run lint && npm run build
```
手动：`npm run dev`，打开首页/博客列表，确认有封面的卡片正常显示、悬停缩放动画保留、无 next/image 域名报错。

- [ ] **Step 4: 提交**

```bash
git add components/BlogCard.tsx next.config.mjs
git commit -m "perf(image): 博客卡片封面改用 next/image 启用格式协商与响应式"
```

---

## Task P4: AI 默认模型更新 + 限流局限性记录

**背景：** `lib/assistant/generator.ts:186` 默认 `claude-sonnet-4-6`；当前最新为 Opus 4.8 / 最新 Sonnet。另：`app/api/assistant/chat/route.ts` 用进程内 `Map` + `setInterval` 做限流，单实例 systemd 可用但重启即失效、不支持多实例 —— 需在代码注释中明确，避免未来误以为是分布式限流。

**Files:**
- Modify: `lib/assistant/generator.ts:186`
- Modify: `app/api/assistant/chat/route.ts`（限流处补注释）

- [ ] **Step 1: 更新 Anthropic 默认模型**

`lib/assistant/generator.ts`，将：
```ts
model: model || (apiProvider === "anthropic" ? "claude-sonnet-4-6" : "qwen-plus"),
```
改为：
```ts
model: model || (apiProvider === "anthropic" ? "claude-opus-4-8" : "qwen-plus"),
```
> 仅影响「未显式设置 `AI_MODEL`」的兜底。若线上更看重成本而非质量，可改用最新 Sonnet；此处由用户在执行时确认取舍（见执行确认项）。

- [ ] **Step 2: 限流局限性补注释**

`app/api/assistant/chat/route.ts` 的 `rateLimitMap` 定义上方加注释：
```ts
// 进程内限流：仅在单实例部署下有效。重启即清空；多实例/Serverless 下各实例独立计数，
// 不构成全局配额。若未来横向扩容，需替换为 Redis/Upstash 等共享存储。
```

- [ ] **Step 3: 验证**

```bash
npm run type-check && npm run lint && npm test
```
Expected: 测试通过（含 `tests/lib/editor-assist.test.ts` 等）。

- [ ] **Step 4: 提交**

```bash
git add lib/assistant/generator.ts app/api/assistant/chat/route.ts
git commit -m "chore(ai): 默认模型更新为 claude-opus-4-8，标注进程内限流局限"
```

---

## Task P5: sitemap 静态页 lastModified 取最新文章日期

**背景：** `app/sitemap.ts` 中首页/`/blog`/`/archive` 等静态页 `lastModified` 用 `BUILD_DATE`（构建时间），与内容是否真正变更脱钩。改用「最新文章日期」更贴近实际，对增量抓取更友好。单篇文章已用 `post.updated || post.date`，无需改。

**Files:**
- Modify: `app/sitemap.ts`
- Test: `tests/lib/sitemap.test.ts`（新增，测试纯函数）

- [ ] **Step 1: 抽出可测纯函数**

把"最新内容日期"逻辑抽成纯函数，便于测试。在 `lib/seo.ts` 末尾新增（或就近文件）：
```ts
/** 取文章集合中最新的 updated/date，用于站点级 lastModified；空集合回退到传入的当前时间。 */
export function latestContentDate(
  posts: { date: string; updated?: string }[],
  fallback: Date = new Date(),
): Date {
  const times = posts
    .map((p) => new Date(p.updated || p.date).getTime())
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return fallback;
  return new Date(Math.max(...times));
}
```

- [ ] **Step 2: 写失败测试**

`tests/lib/sitemap.test.ts`：
```ts
import { describe, it, expect } from "vitest";
import { latestContentDate } from "../../lib/seo";

describe("latestContentDate", () => {
  it("returns the max of date/updated across posts", () => {
    const posts = [
      { date: "2024-01-01" },
      { date: "2024-05-01", updated: "2024-06-10" },
      { date: "2024-03-01" },
    ];
    expect(latestContentDate(posts).toISOString().slice(0, 10)).toBe("2024-06-10");
  });

  it("falls back when empty", () => {
    const fb = new Date("2020-01-01");
    expect(latestContentDate([], fb)).toBe(fb);
  });
});
```

- [ ] **Step 3: 跑测试确认先失败再通过**

```bash
npx vitest run tests/lib/sitemap.test.ts
```
先因 `latestContentDate` 未导出而失败 → 加上 Step 1 的导出后再跑应 PASS。

- [ ] **Step 4: 在 sitemap 中使用**

`app/sitemap.ts`：
```ts
import { getSiteUrl, latestContentDate } from "../lib/seo";
// ...
const posts = getAllPostsSync();
const siteUrl = getSiteUrl();
const lastContent = latestContentDate(posts);
```
把静态页条目的 `lastModified: BUILD_DATE` 全部替换为 `lastModified: lastContent`，删除不再使用的 `BUILD_DATE` 常量。

- [ ] **Step 5: 验证**

```bash
npm run type-check && npm run lint && npx vitest run tests/lib/sitemap.test.ts && npm run build
```

- [ ] **Step 6: 提交**

```bash
git add lib/seo.ts app/sitemap.ts tests/lib/sitemap.test.ts
git commit -m "feat(seo): sitemap 静态页 lastModified 改用最新文章日期"
```

---

## Task P6: 提交 tsconfig 改动 + 小清理

**背景：** 工作区残留 `M tsconfig.json`（仅新增 `.next.dev/types/**/*.ts` 到 include，属 dev 产物路径），应收尾提交，保持工作区干净。

**Files:**
- Modify: `tsconfig.json`（已改，仅提交）

- [ ] **Step 1: 确认 diff 仅为 include 路径新增**

```bash
git diff tsconfig.json
```
Expected: 仅新增一行 `".next.dev/types/**/*.ts"`。

- [ ] **Step 2: 提交**

```bash
git add tsconfig.json
git commit -m "chore(tsconfig): include .next.dev 类型目录（dev 产物）"
```

---

## Task P7: 为 API/鉴权补集成测试（可选 / 长期）

**背景：** 现有 9 个测试全在 `tests/lib/`，API 路由与鉴权端到端无覆盖；而历次改动集中在 admin/auth/notes。建议优先覆盖登录流程与写操作鉴权。

**Files:**
- Test: `tests/api/auth-login.test.ts`（新增）
- 视情况补 `tests/api/publish.test.ts` 等

- [ ] **Step 1: 列出鉴权关键路径**

```bash
sed -n '1,80p' app/api/auth/login/route.ts
grep -rn "login-guard\|session-token\|auth-version" lib --include="*.ts"
```
明确：登录校验、session token 生成/校验、auth 版本失效（已有 lib 层测试，缺路由层）。

- [ ] **Step 2: 为登录路由写测试**

针对 `POST /api/auth/login`：构造正确/错误密码请求，断言成功置 cookie、失败返回 401 且不置 cookie。具体断言依据 `route.ts` 实际实现编写（执行时读源后填充真实字段名，避免臆测）。

- [ ] **Step 3: 跑测试**

```bash
npm test
```

- [ ] **Step 4: 提交**

```bash
git add tests/api/
git commit -m "test(api): 补充登录鉴权路由集成测试"
```

> P7 偏长期投入，可在 P1–P6 完成并验证后再决定是否纳入本轮。

---

## Self-Review

- **Spec coverage:** 审计提出的 7 项（loading/error、懒加载、next/image、AI 模型、sitemap、tsconfig、测试）均有对应任务（P1–P7）。装饰特效已确认做了 reduced-motion/触屏降级，故不立任务（仅在 P2 思路中可顺带懒加载，本轮不强制）。
- **Placeholder scan:** 各代码步骤均给出完整可粘贴代码；唯一"执行时按实际源码填充"的是 P7 Step 2（鉴权断言）与 P2 Step 2（导出形式二选一），均已显式标注判定方式，非空泛占位。
- **Type consistency:** `latestContentDate` 在 P5 各步签名一致；`CommandPaletteLazy`/`AssistantLauncherLazy` 命名在创建与引用处一致。
- **风险提示:** P3 依赖 `post.cover` 域名在 remotePatterns 内（Step 2 已含检查）；P2 依赖组件导出形式（Step 2 已含确认）。

## 执行确认项（开始前需用户拍板）

1. **P4 默认模型**：兜底用 `claude-opus-4-8`（质量优先）还是最新 Sonnet（成本优先）？
2. **P7 是否纳入本轮**，还是先做 P1–P6。
