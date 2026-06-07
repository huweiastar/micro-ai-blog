# 博客全面优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 giscus 评论，并系统性优化访客端与后台的视觉/布局/响应式/可用性/功能，全程不引入新运行时依赖。

**Architecture:** 策略 B——先固化设计令牌与共享 UI 原语（`components/ui/`），再逐页复用精修；后台补统一 Toast 反馈；评论沿用 giscus 并增强（懒加载/降级占位/postMessage 主题切换）。

**Tech Stack:** Next.js 14.2 App Router、React 18、TypeScript、Tailwind CSS 3、@tailwindcss/typography、lucide-react、giscus。

**测试说明：** 本项目**无测试框架**（`package.json` 无 test runner），且多为视觉/前端改动。因此每个任务的验证标准为：`npm run type-check` 通过、`npm run lint` 通过、`npm run build` 成功；涉及交互逻辑的任务另附 `npm run dev` 下的人工核查步骤（含暗色模式 / 移动端窄屏）。**不要为本项目新增测试框架。**

**通用约束：**
- 严禁 `any`，用 `unknown` + 类型守卫。
- 组件 PascalCase，props 用 `interface ComponentNameProps`。
- Server Component 为默认，仅交互组件加 `"use client"`。
- 所有颜色用现有 CSS 变量（`var(--primary)` 等），不写死十六进制。
- 频繁提交：每个 Task 末尾提交一次。
- 当前工作分支：`feat/blog-optimization`。

---

## 阶段 0｜评论修复（giscus）

### Task 0.1: 排查 giscus 不显示的根因

**Files:**
- 只读排查，无代码改动。

- [ ] **Step 1: 确认运行构建中环境变量是否内联**

Run:
```bash
cd /home/ubuntu/projects/micro-ai-blog
grep -E "NEXT_PUBLIC_GISCUS" .env.local
```
Expected: 看到 4 个变量且值非 `your-*`（已确认存在 `huweiastar/micro-ai-blog`）。

- [ ] **Step 2: 确认 GitHub 端配置**

人工确认（在浏览器）：仓库 `huweiastar/micro-ai-blog` 是否：
1. Settings → Features → Discussions 已勾选开启；
2. 已安装 giscus App（https://github.com/apps/giscus 授权该仓库）；
3. 存在名为 `Announcements` 的 Discussion category（对应 `NEXT_PUBLIC_GISCUS_CATEGORY`）。

记录结论：若三项齐全 → 根因是构建期未内联或组件静默 return null（Task 0.2 修复）；若缺项 → 在 `docs/giscus-setup.md` 标注需用户在 GitHub 端补齐（Task 0.4）。

- [ ] **Step 3: 记录结论**

把结论写入本任务的 commit message 或 PR 描述，不改代码。无需提交。

---

### Task 0.2: 重写 Comment 组件（懒加载 + 降级占位 + postMessage 主题）

**Files:**
- Modify: `components/Comment.tsx`（整体替换）

- [ ] **Step 1: 用以下完整内容替换 `components/Comment.tsx`**

```tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";

interface CommentProps {
  slug: string;
  title: string;
}

const GISCUS_ORIGIN = "https://giscus.app";

function giscusTheme(theme: string | undefined): string {
  return theme === "dark" ? "transparent_dark" : "light";
}

export function Comment({ slug }: CommentProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO || "";
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "";
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General";
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "";

  const isConfigured =
    !!repo && !!repoId && !repo.includes("your-") && !repoId.includes("your-");

  // 懒加载：滚动到评论区附近才挂载
  useEffect(() => {
    if (!isConfigured) return;
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isConfigured]);

  // 注入 giscus 脚本（仅一次）
  useEffect(() => {
    if (!isConfigured || !visible || loaded) return;
    const el = containerRef.current;
    if (!el) return;

    const script = document.createElement("script");
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", giscusTheme(resolvedTheme));
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;
    script.onload = () => setLoaded(true);
    el.appendChild(script);
    // resolvedTheme 故意不入依赖：主题切换走 postMessage（下一个 effect）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, visible, loaded, repo, repoId, category, categoryId]);

  // 主题切换：用 postMessage 通知已存在的 iframe，避免重建
  useEffect(() => {
    if (!loaded) return;
    const iframe = containerRef.current?.querySelector<HTMLIFrameElement>(
      "iframe.giscus-frame"
    );
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: giscusTheme(resolvedTheme) } } },
      GISCUS_ORIGIN
    );
  }, [resolvedTheme, loaded]);

  if (!isConfigured) {
    return (
      <section className="glass rounded-xl p-6 mt-12">
        <div className="flex items-center gap-2 mb-2 text-[var(--foreground)] font-semibold">
          <MessageSquare className="w-4 h-4" /> 评论
        </div>
        <p className="text-sm text-[var(--muted)]">
          评论系统尚未配置。请在环境变量中设置 giscus（见 docs/giscus-setup.md）。
        </p>
      </section>
    );
  }

  return (
    <section className="glass rounded-xl p-6 mt-12">
      <div className="flex items-center gap-2 mb-4 text-[var(--foreground)] font-semibold">
        <MessageSquare className="w-4 h-4" /> 评论
      </div>
      <div ref={containerRef} className="min-h-[6rem]">
        {visible && !loaded && (
          <div className="space-y-3 animate-pulse" aria-hidden>
            <div className="h-4 w-1/3 rounded bg-[var(--card-border)]" />
            <div className="h-24 w-full rounded bg-[var(--card-border)]" />
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run type-check`
Expected: 无错误（注意：`title` prop 仍在接口中以兼容调用方，但未使用——若 lint 报未使用，保留接口字段，函数解构里已不取 `title`，无未使用变量）。

- [ ] **Step 3: lint**

Run: `npm run lint`
Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add components/Comment.tsx
git commit -m "feat(comment): 懒加载 giscus + 降级占位 + postMessage 主题切换"
```

---

### Task 0.3: comments 配置补类型与帮助函数

**Files:**
- Modify: `config/comments.ts`

- [ ] **Step 1: 用以下内容替换 `config/comments.ts`**

```ts
export type CommentProvider = "giscus";

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

export interface CommentConfig {
  provider: CommentProvider;
  giscus: GiscusConfig;
}

export const commentConfig: CommentConfig = {
  provider: "giscus",
  giscus: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO || "",
    repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "",
    category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General",
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "",
  },
};

/** giscus 是否已正确配置（用于决定是否渲染评论）。 */
export function isGiscusConfigured(g: GiscusConfig = commentConfig.giscus): boolean {
  return (
    !!g.repo && !!g.repoId && !g.repo.includes("your-") && !g.repoId.includes("your-")
  );
}
```

- [ ] **Step 2: 验证**

Run: `npm run type-check && npm run lint`
Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add config/comments.ts
git commit -m "refactor(comment): 强类型化 comments 配置 + isGiscusConfigured"
```

---

### Task 0.4: giscus 配置文档 + .env.example 完善

**Files:**
- Create: `docs/giscus-setup.md`
- Modify: `.env.example`

- [ ] **Step 1: 创建 `docs/giscus-setup.md`**

```markdown
# Giscus 评论配置

评论基于 [giscus](https://giscus.app)（GitHub Discussions）。需在 **GitHub 端**完成 3 步，再填 4 个环境变量。

## GitHub 端（一次性）
1. 仓库 Settings → General → Features → 勾选 **Discussions**。
2. 安装并授权 [giscus App](https://github.com/apps/giscus) 到该仓库。
3. 在 Discussions 下确保存在一个 category（如 `Announcements`），用于承载评论。

## 获取变量
打开 https://giscus.app ，填入仓库后页面会生成 `data-repo-id` 与 `data-category-id`。

## 环境变量（`.env.local`）
```
NEXT_PUBLIC_GISCUS_REPO="owner/repo"
NEXT_PUBLIC_GISCUS_REPO_ID="R_xxx"
NEXT_PUBLIC_GISCUS_CATEGORY="Announcements"
NEXT_PUBLIC_GISCUS_CATEGORY_ID="DIC_xxx"
```

> 注意：`NEXT_PUBLIC_*` 在 **构建期** 内联。修改后必须重新 `npm run build`（或重启 `npm run dev`）才会生效。未配置时评论区显示占位提示而非空白。
```

- [ ] **Step 2: 确认 `.env.example` 已含 giscus 段（已存在则补一行说明）**

在 `.env.example` 的 giscus 段上方加注释行：
```
# Giscus 评论（构建期内联，修改后需重新 build）。配置步骤见 docs/giscus-setup.md
```

- [ ] **Step 3: 提交**

```bash
git add docs/giscus-setup.md .env.example
git commit -m "docs(comment): 新增 giscus 配置说明"
```

---

## 阶段 1｜设计系统固化（`components/ui/`）

### Task 1.1: 扩展设计令牌（globals.css）

**Files:**
- Modify: `app/globals.css`（在 `:root` 与 `.dark` 后、`@layer base` 内补令牌；在 base 层加全局 focus-visible）

- [ ] **Step 1: 在 `:root` 块末尾（`--glow-accent` 行后）追加**

```css
    --radius-sm: 0.5rem;
    --radius: 0.75rem;
    --radius-lg: 1rem;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.12);
    --ring: var(--primary);
```

- [ ] **Step 2: 在 `@layer base` 内追加全局可见焦点环**

```css
  :where(a, button, input, textarea, select, [tabindex]):focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
```

- [ ] **Step 3: 在 `@layer base` 内追加减少动效偏好**

```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
  }
```

- [ ] **Step 4: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add app/globals.css
git commit -m "feat(ui): 扩展设计令牌(圆角/阴影/ring) + 全局焦点环 + reduced-motion"
```

---

### Task 1.2: Container 原语

**Files:**
- Create: `components/ui/Container.tsx`

- [ ] **Step 1: 创建文件**

```tsx
import { clsx } from "clsx";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main" | "header" | "footer";
}

export function Container({ children, className, as: Tag = "div" }: ContainerProps) {
  return (
    <Tag className={clsx("mx-auto w-full max-w-5xl px-4 sm:px-6", className)}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint
git add components/ui/Container.tsx
git commit -m "feat(ui): Container 容器原语"
```

---

### Task 1.3: Button 原语

**Files:**
- Create: `components/ui/Button.tsx`

- [ ] **Step 1: 创建文件**

```tsx
"use client";

import Link from "next/link";
import { clsx } from "clsx";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm",
  outline:
    "border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)]",
  ghost: "text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--card)]/60",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  href: string;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className, children } = props;
  const cls = clsx(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }
  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint
git add components/ui/Button.tsx
git commit -m "feat(ui): Button 原语(primary/outline/ghost, link/button)"
```

---

### Task 1.4: Card / Badge / PageHeader / Section 原语

**Files:**
- Create: `components/ui/Card.tsx`
- Create: `components/ui/Badge.tsx`
- Create: `components/ui/PageHeader.tsx`
- Create: `components/ui/Section.tsx`

- [ ] **Step 1: 创建 `components/ui/Card.tsx`**

```tsx
import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        "glass rounded-xl p-6",
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]",
        className
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: 创建 `components/ui/Badge.tsx`**

```tsx
import { clsx } from "clsx";

type Tone = "primary" | "accent" | "muted";

const tones: Record<Tone, string> = {
  primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
  accent: "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20",
  muted: "bg-[var(--card)] text-[var(--muted)] border border-[var(--card-border)]",
};

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = "primary", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: 创建 `components/ui/PageHeader.tsx`**

```tsx
import { Container } from "./Container";

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  count,
  countLabel = "篇",
  children,
}: PageHeaderProps) {
  return (
    <Container className="py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 text-[var(--muted)]">{description}</p>
          )}
          {typeof count === "number" && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              共 {count} {countLabel}
            </p>
          )}
        </div>
        {children}
      </div>
    </Container>
  );
}
```

- [ ] **Step 4: 创建 `components/ui/Section.tsx`**

```tsx
import Link from "next/link";
import { Container } from "./Container";

interface SectionProps {
  title: string;
  moreHref?: string;
  moreLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({
  title,
  moreHref,
  moreLabel = "查看全部",
  children,
  className,
}: SectionProps) {
  return (
    <Container as="section" className={className}>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
          >
            {moreLabel} →
          </Link>
        )}
      </div>
      {children}
    </Container>
  );
}
```

- [ ] **Step 5: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add components/ui/Card.tsx components/ui/Badge.tsx components/ui/PageHeader.tsx components/ui/Section.tsx
git commit -m "feat(ui): Card/Badge/PageHeader/Section 共享原语"
```

---

### Task 1.5: 首页接入 Section 原语（验证原语可用）

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 替换首页两个 section**

将 `app/page.tsx` 中"最新文章"与"精选项目"两个 `<section className="max-w-5xl ...">...</section>` 块替换为使用 `Section` 原语：

```tsx
import { Section } from "../components/ui/Section";
```
```tsx
      <Section title="最新文章" moreHref="/blog" className="mb-20">
        <div className="grid gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </Section>

      <Section title="精选项目" moreHref="/projects" className="mb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </Section>
```
（删除原先内联的 `Link ... 查看全部` 与外层 section 包裹。）

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add app/page.tsx
git commit -m "refactor(home): 首页接入 Section 原语"
```

---

## 阶段 2｜访客端视觉与布局精修

> 每个 Task 先 `Read` 当前文件，再按描述改动；统一用阶段 1 原语与令牌。验证一律 type-check + lint + build。

### Task 2.1: BlogCard 动效克制化 + 信息层级

**Files:**
- Modify: `components/BlogCard.tsx`

- [ ] **Step 1: 精简过度动效**

保留卡片悬浮上移与标题变色；**移除** shimmer 平移层、上下角 blur 光团、底部 glow 线这三处装饰 div（它们叠加过多）。保留封面 `group-hover:scale-105`。元信息行用 `Badge` 替换内联分类徽章：
```tsx
import { Badge } from "./ui/Badge";
```
分类处：
```tsx
{post.category && <Badge tone="accent">{post.category}</Badge>}
```
标题保留 `line-clamp-2`（新增），摘要保留 `line-clamp-2`。

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add components/BlogCard.tsx
git commit -m "refactor(BlogCard): 克制动效 + Badge 统一 + 标题截断"
```

---

### Task 2.2: ProjectCard 动效克制化

**Files:**
- Modify: `components/ProjectCard.tsx`

- [ ] **Step 1: 精简动效**

移除 shimmer 平移层与两处角落装饰、底部 glow 线；保留图标徽章 hover、卡片上移。技术栈标签改用统一圆角与 `var(--radius-sm)` 风格（去掉每个 tag 的 `group-hover:scale-110`）。

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add components/ProjectCard.tsx
git commit -m "refactor(ProjectCard): 克制动效，统一标签样式"
```

---

### Task 2.3: 博客详情页排版精修

**Files:**
- Modify: `app/blog/[slug]/page.tsx`

- [ ] **Step 1: 统一容器与相关文章卡片**

将顶层 `max-w-5xl mx-auto px-4 sm:px-6 py-12` 容器改用 `Container`（保留 `py-12`）。相关文章卡片用 `Card hover`。"返回/上一篇/下一篇"导航对齐。文章头部元信息（日期/阅读时长/分类/字数）用统一的 meta 行 + `Badge`。

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add "app/blog/[slug]/page.tsx"
git commit -m "refactor(blog-detail): 统一容器/元信息/相关文章卡片"
```

---

### Task 2.4: 列表页统一页头（blog/projects/categories/tags/archive）

**Files:**
- Modify: `app/blog/page.tsx`
- Modify: `app/projects/page.tsx`
- Modify: `app/categories/page.tsx`
- Modify: `app/tags/page.tsx`
- Modify: `app/archive/page.tsx`

- [ ] **Step 1: 逐页接入 PageHeader + Container**

每页：先 `Read`，把页面顶部的标题/描述块替换为 `<PageHeader title=... description=... count=... countLabel=... />`，列表区用 `Container` 包裹。保持各页原有数据逻辑不变。countLabel：blog/archive 用「篇」，projects 用「个」，categories 用「个专栏」，tags 用「个标签」。

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add app/blog/page.tsx app/projects/page.tsx app/categories/page.tsx app/tags/page.tsx app/archive/page.tsx
git commit -m "refactor(list-pages): 统一 PageHeader/Container"
```

---

### Task 2.5: 详情/二级页与 Footer 精修（categories/[category]、tags/[tag]、about、footprint、search、Footer）

**Files:**
- Modify: `app/categories/[category]/page.tsx`
- Modify: `app/tags/[tag]/page.tsx`
- Modify: `app/about/page.tsx`
- Modify: `app/footprint/page.tsx`
- Modify: `app/search/page.tsx`
- Modify: `components/Footer.tsx`

- [ ] **Step 1: 统一容器/页头/空态**

逐页 `Read` 后接入 `Container`/`PageHeader`；列表为空时用 `EmptyState`。`Footer`：版权年份用 `new Date().getFullYear()`，补齐栏目对齐与间距。

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add "app/categories/[category]/page.tsx" "app/tags/[tag]/page.tsx" app/about/page.tsx app/footprint/page.tsx app/search/page.tsx components/Footer.tsx
git commit -m "refactor(pages): 二级页统一容器/页头/空态 + Footer 精修"
```

---

## 阶段 3｜响应式与可用性边界

### Task 3.1: EmptyState 增强（支持图标）

**Files:**
- Modify: `components/ui/EmptyState.tsx`

- [ ] **Step 1: 替换为支持图标 + Button 的版本**

```tsx
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: { label: string; href: string };
}

export function EmptyState({
  title = "暂无内容",
  description,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="mb-4 h-12 w-12 text-[var(--muted)]/50" />
      <p className="mb-2 text-lg text-[var(--muted)]">{title}</p>
      {description && (
        <p className="mb-6 text-sm text-[var(--muted)]">{description}</p>
      )}
      {action && (
        <Button href={action.href} size="md">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add components/ui/EmptyState.tsx
git commit -m "feat(ui): EmptyState 支持图标 + Button"
```

---

### Task 3.2: 动效组件遵守 reduced-motion + 移动端禁用

**Files:**
- Modify: `components/ui/ParticleNetwork.tsx`
- Modify: `components/ui/MouseFollow.tsx`
- Modify: `components/ui/ClickEffect.tsx`

- [ ] **Step 1: 各组件早返回**

在每个组件内（`"use client"`），用 `useEffect` 读取 `window.matchMedia("(prefers-reduced-motion: reduce)").matches` 与 `window.matchMedia("(pointer: coarse)").matches`（触屏），任一为真则不渲染/不启动动画。示例（ParticleNetwork 顶部）：
```tsx
const [enabled, setEnabled] = useState(true);
useEffect(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  setEnabled(!reduce && !coarse);
}, []);
if (!enabled) return null;
```
对 MouseFollow / ClickEffect 同样处理（鼠标类动效在触屏一律关闭）。

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add components/ui/ParticleNetwork.tsx components/ui/MouseFollow.tsx components/ui/ClickEffect.tsx
git commit -m "fix(a11y): 动效遵守 prefers-reduced-motion 并在触屏禁用"
```

---

### Task 3.3: a11y 与长内容核查

**Files:**
- Modify: `app/layout.tsx`（加"跳到主内容"）
- Modify: `components/Header.tsx`（`aria-current`）

- [ ] **Step 1: 跳到主内容链接**

在 `app/layout.tsx` 的 `<body>` 内、Header 前加：
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-white"
>
  跳到主内容
</a>
```
并给主内容容器加 `id="main-content"`（若 layout 用 `{children}`，包一层 `<main id="main-content">`，注意不要与既有 main 重复——先 Read 确认）。在 `globals.css` 确认有 `.sr-only`（Tailwind 自带 `sr-only` 工具类，无需额外定义）。

- [ ] **Step 2: Header 导航 aria-current**

在 `components/Header.tsx` 桌面与移动导航的当前项 `<Link>` 上加 `aria-current={isActive ? "page" : undefined}`（`isActive` 即现有 active 判断表达式）。

- [ ] **Step 3: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add app/layout.tsx components/Header.tsx
git commit -m "feat(a11y): 跳到主内容链接 + 导航 aria-current"
```

---

## 阶段 4｜后台管理体验

### Task 4.1: Toast 反馈系统

**Files:**
- Create: `components/admin/Toast.tsx`

- [ ] **Step 1: 创建零依赖 Toast（Context + Provider + hook）**

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}
interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast 必须在 ToastProvider 内使用");
  return ctx;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const Icon = icons[item.type];
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const tone =
    item.type === "success"
      ? "text-green-500"
      : item.type === "error"
        ? "text-red-500"
        : "text-[var(--primary)]";
  return (
    <div className="glass flex items-center gap-2 rounded-lg px-4 py-3 shadow-[var(--shadow-lg)] animate-slide-up">
      <Icon className={`h-4 w-4 shrink-0 ${tone}`} />
      <span className="text-sm text-[var(--foreground)]">{item.message}</span>
      <button onClick={onClose} aria-label="关闭" className="ml-2 text-[var(--muted)]">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 在 AdminShell 包裹 ToastProvider**

在 `components/admin/AdminShell.tsx` 顶层用 `ToastProvider` 包裹返回的根 `<div>`：
```tsx
import { ToastProvider } from "./Toast";
```
```tsx
return (
  <ToastProvider>
    <div className="min-h-screen flex ...">
      ...
    </div>
  </ToastProvider>
);
```

- [ ] **Step 3: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add components/admin/Toast.tsx components/admin/AdminShell.tsx
git commit -m "feat(admin): 统一 Toast 反馈系统"
```

---

### Task 4.2: 后台保存反馈接入 Toast（替换 alert）

**Files:**
- Modify: 后台编辑器页面中使用 `alert(` 的位置（先用 grep 定位）

- [ ] **Step 1: 定位 alert 调用**

Run:
```bash
grep -rn "alert(" app/admin components/admin --include="*.tsx"
```
Expected: 列出所有保存/错误处的 `alert`。

- [ ] **Step 2: 逐处替换**

在对应组件（须为 `"use client"`，且在 `ToastProvider` 内）用 `const { show } = useToast();` 替换：
- 成功：`show("保存成功", "success")`
- 失败：`show("保存失败：" + 错误信息, "error")`
> 注意：仅替换在 AdminShell 子树内的客户端组件中的 alert。若某 alert 在 Provider 之外（如 login 页），保留原样。

- [ ] **Step 3: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add -A
git commit -m "refactor(admin): 保存反馈改用 Toast"
```

---

### Task 4.3: 后台表单与编辑器窄屏可用性

**Files:**
- Modify: `components/admin/MarkdownEditor/Toolbar.tsx`
- Modify: 相关后台表单页（按需）

- [ ] **Step 1: 工具栏窄屏可滚动**

`Read` `Toolbar.tsx`，给工具栏容器加 `flex-wrap` 或 `overflow-x-auto`（横向滚动），确保窄屏不溢出、按钮可达。

- [ ] **Step 2: 表单容器响应式**

后台编辑页表单容器宽度加 `max-w-` 限制并 `px-4`，输入控件 `w-full`。

- [ ] **Step 3: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add -A
git commit -m "fix(admin): 编辑器工具栏与表单窄屏可用性"
```

---

## 阶段 5｜新功能

### Task 5.1: ShareButtons 增强（微博 + 微信二维码）

**Files:**
- Modify: `components/blog/ShareButtons.tsx`

- [ ] **Step 1: 增加微博分享与微信二维码**

在现有"复制链接 + Twitter/X"基础上新增：
- 微博：`window.open("https://service.weibo.com/share/share.php?url=" + url + "&title=" + title, ...)`。
- 微信：点击弹出一个就地生成的二维码（用 giscus 同款无依赖方式不可行——改为：点击复制链接并 `show`/提示"已复制，可在微信粘贴"；**不引入二维码库**以遵守零新依赖）。
图标用 lucide 的 `Share2`/`MessageCircle`。

- [ ] **Step 2: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add components/blog/ShareButtons.tsx
git commit -m "feat(share): 新增微博分享与微信复制提示"
```

---

### Task 5.2: 文章元信息组件统一展示

**Files:**
- Create: `components/blog/PostMeta.tsx`
- Modify: `app/blog/[slug]/page.tsx`（接入）

- [ ] **Step 1: 创建 PostMeta**

```tsx
import { Calendar, Clock, FileText } from "lucide-react";
import { formatDate } from "../../lib/utils";
import { Badge } from "../ui/Badge";

interface PostMetaProps {
  date: string;
  readingTime: string;
  wordCount: number;
  category?: string;
}

export function PostMeta({ date, readingTime, wordCount, category }: PostMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
      <span className="inline-flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        {formatDate(date)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-4 w-4" />
        {readingTime}
      </span>
      <span className="inline-flex items-center gap-1">
        <FileText className="h-4 w-4" />
        {wordCount} 字
      </span>
      {category && <Badge tone="accent">{category}</Badge>}
    </div>
  );
}
```

- [ ] **Step 2: 详情页接入**

`Read` `app/blog/[slug]/page.tsx`，将文章头部分散的日期/时长/字数/分类替换为 `<PostMeta .../>`（字段来自 `post`）。

- [ ] **Step 3: 验证 + 提交**

```bash
npm run type-check && npm run lint && npm run build
git add components/blog/PostMeta.tsx "app/blog/[slug]/page.tsx"
git commit -m "feat(blog): 统一文章元信息组件 PostMeta"
```

---

### Task 5.3: TOC 与 ReadingProgress 收尾核查

**Files:**
- Modify: `components/Toc.tsx`（如需）

- [ ] **Step 1: 核查滚动高亮**

`Toc` 已有 `IntersectionObserver` 高亮逻辑。在 `npm run dev` 下打开一篇长文，确认：滚动时当前章节高亮、点击平滑跳转、暗色样式正常、reduced-motion 下无异常。如发现高亮不准（多 h2 同时 intersect），调整 `rootMargin` 为 `-10% 0% -80% 0%` 并只在 `entry.isIntersecting` 时取第一个。

- [ ] **Step 2: 验证 + 提交（若有改动）**

```bash
npm run type-check && npm run lint && npm run build
git add components/Toc.tsx
git commit -m "fix(toc): 滚动高亮核查与微调"
```

---

## 阶段收尾

### Task 6.1: 全量验证 + 收尾

- [ ] **Step 1: 全量验证**

```bash
npm run type-check && npm run lint && npm run build
```
Expected: 三者全部通过。

- [ ] **Step 2: dev 人工巡检**

`npm run dev`，逐项核查：首页/博客列表/详情(含评论占位或 giscus)/项目/分类/标签/归档/搜索/关于/足迹/后台各编辑页；切换暗色；缩到移动端宽度确认无横向溢出；键盘 Tab 焦点可见。

- [ ] **Step 3: 提交剩余改动（如有）并准备合并**

依据 superpowers:finishing-a-development-branch 决定合并/PR。

---

## Self-Review 记录

- **Spec 覆盖**：阶段 0（评论）✓ Task0.1-0.4；阶段 1（设计系统）✓ Task1.1-1.5；阶段 2（视觉精修）✓ Task2.1-2.5；阶段 3（响应式/可用性）✓ Task3.1-3.3；阶段 4（后台）✓ Task4.1-4.3；阶段 5（新功能 ★ TOC/元信息/分享）✓ Task5.1-5.3。
- **占位扫描**：无 TODO/TBD；每个新建文件给出完整代码；逐页精修任务因需基于现有代码增量修改，明确要求先 Read 再按具体描述改动，并给出关键代码片段与提交命令。
- **类型一致**：`isGiscusConfigured`、`Button`(href/button)、`Card hover`、`Badge tone`、`PageHeader count/countLabel`、`useToast().show` 在各处签名一致。
- **依赖约束**：全程未新增运行时依赖（微信分享改为复制提示，规避二维码库）。
