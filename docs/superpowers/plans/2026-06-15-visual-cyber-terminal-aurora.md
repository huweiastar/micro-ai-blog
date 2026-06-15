# 视觉体验优化实现计划：赛博终端极光

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将博客视觉升级为"赛博终端极光"风格——粒子网格背景、终端卡片组件、极光渐变、重动效，首页优先，最终开发端口预览（不上生产）。

**Architecture:** 纯增量改动，不删除任何现有功能。分层实现：先加 CSS tokens，再升级全局背景/粒子，然后改组件（Header→Hero→BlogCard→代码块→阅读进度条），最后加滚动揭入动效。每个任务独立可提交验证。

**Tech Stack:** Next.js 14.2 App Router, React 18, TypeScript, Tailwind CSS 3, Canvas API, CSS @keyframes, IntersectionObserver API。无需新增 npm 依赖。

**全局验证基线（每个任务完成前执行）:**
```bash
npm run type-check && npm run lint
```

---

## 文件改动总览

| 文件 | 操作 | 职责 |
|------|------|------|
| `app/globals.css` | 修改 | 新增 CSS 变量、terminal-blink keyframe、cyber-grid、reveal 工具类 |
| `components/ui/ParticleNetwork.tsx` | 修改 | 暗色模式粒子改为紫色+青色双色，增加辉光效果 |
| `components/ui/AnimatedBackground.tsx` | 修改 | 增强极光强度，新增青色极光团，暗色下叠加网格线 |
| `app/page.client.tsx` | 修改 | Hero 区加赛博网格遮罩、终端 badge、monospace 副标题、霓虹 Stats |
| `components/Header.tsx` | 修改 | Logo 加闪烁 `_` 光标，导航项加 `~/` 路径前缀 |
| `components/BlogCard.tsx` | 修改 | 顶部加终端标题栏（macOS 三色点 + 文件名） |
| `components/CodeCopyButton.tsx` | 修改 | 代码块头部左侧加 macOS 三色点 |
| `app/globals.css` | 修改 | 代码块头部改为两端对齐（三色点左 / 语言+复制右） |
| `components/ui/ReadingProgress.tsx` | 修改 | 进度条改为紫→青渐变 + 辉光 |
| `components/RevealList.tsx` | 新建 | 滚动揭入包装组件（IntersectionObserver） |
| `app/page.tsx` | 修改 | BlogCard 网格容器加滚动揭入动效 |

---

## Task 1: CSS 新增变量 + 工具类 + keyframe

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: 在 `:root` 中追加霓虹色和终端色变量**

在 `app/globals.css` 的 `:root` 块（`--ring: var(--primary);` 之后，第 27 行左右）追加：

```css
    --neon-cyan: #06b6d4;
    --neon-purple: #a78bfa;
    --terminal-bg: #161b22;
    --terminal-border: #30363d;
    --terminal-text: #8b949e;
    --cyber-grid-color: rgba(99, 102, 241, 0.10);
```

在 `.dark` 块（`--info: #60a5fa;` 之后）追加：

```css
    --neon-cyan: #22d3ee;
    --neon-purple: #c4b5fd;
    --cyber-grid-color: rgba(129, 140, 248, 0.12);
```

- [ ] **Step 2: 在 `@layer utilities` 中追加 terminal-blink、cyber-grid、reveal 工具类**

在 `app/globals.css` 的 `@layer utilities { ... }` 块末尾（`.ripple-ring-3` 之后，约第 586 行）追加：

```css
  /* 终端光标闪烁 */
  .animate-terminal-blink {
    animation: terminal-blink 1s step-end infinite;
  }

  /* 赛博网格覆盖层（仅在父元素 position:relative 下有效） */
  .cyber-grid {
    background-image:
      linear-gradient(var(--cyber-grid-color) 1px, transparent 1px),
      linear-gradient(90deg, var(--cyber-grid-color) 1px, transparent 1px);
    background-size: 32px 32px;
  }

  /* 滚动揭入动效：初始状态 */
  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  /* 滚动揭入动效：进入视口后 */
  .reveal.reveal-visible {
    opacity: 1;
    transform: translateY(0);
  }
```

- [ ] **Step 3: 在 keyframes 区追加 terminal-blink**

在 `app/globals.css` 末尾追加：

```css
@keyframes terminal-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
```

- [ ] **Step 4: 验证并提交**

```bash
npm run type-check && npm run lint
git add app/globals.css
git commit -m "style(tokens): 新增霓虹/终端 CSS 变量、terminal-blink、cyber-grid、reveal 工具类"
```

---

## Task 2: ParticleNetwork — 赛博双色粒子 + 辉光

**Files:**
- Modify: `components/ui/ParticleNetwork.tsx`

- [ ] **Step 1: 升级暗色模式粒子颜色 + 辉光效果**

将 `components/ui/ParticleNetwork.tsx` 中的 `animate` 函数内（约第 77 行）整段颜色常量替换为：

```typescript
    function animate() {
      const width = el.offsetWidth;
      const height = el.offsetHeight;

      c.clearRect(0, 0, width, height);

      const particleColor = isDark ? "rgba(129, 140, 248, " : "rgba(99, 102, 241, ";
      const lineColor     = isDark ? "rgba(6, 182, 212, "   : "rgba(99, 102, 241, ";
      const particleOpacity    = isDark ? "0.9)" : "0.5)";
      const lineOpacityFactor  = isDark ? 0.5 : 0.15;

      // 暗色下粒子辉光
      if (isDark) {
        c.shadowBlur  = 6;
        c.shadowColor = "rgba(129, 140, 248, 0.6)";
      } else {
        c.shadowBlur = 0;
      }
```

注意：这段代码替换原来的 `function animate() { ... const particleColor = ...` 开头部分，到 `// Update and draw particles` 注释之前。其余粒子更新/绘制/连线逻辑保持原样不变。

- [ ] **Step 2: 增加暗色模式粒子数量**

将 `components/ui/ParticleNetwork.tsx` 第 48 行改为：

```typescript
      const particleCount     = isMobile ? 50 : 110;
```

（原值为 `isMobile ? 40 : 80`）

- [ ] **Step 3: 验证并提交**

```bash
npm run type-check && npm run lint
git add components/ui/ParticleNetwork.tsx
git commit -m "feat(particles): 赛博双色粒子（紫粒子+青连线）+ 暗色辉光效果"
```

---

## Task 3: AnimatedBackground — 增强极光 + 青色团 + 暗色网格

**Files:**
- Modify: `components/ui/AnimatedBackground.tsx`

- [ ] **Step 1: 增强极光不透明度 + 新增青色极光团**

将 `components/ui/AnimatedBackground.tsx` 中 aurora mesh 区块（`{/* Aurora mesh */}` 部分）替换为：

```tsx
      {/* Aurora mesh — 暗色下 3 色极光团 */}
      <div className="absolute inset-0 opacity-60 dark:opacity-100">
        <div className="animate-aurora absolute -top-1/4 left-1/5 h-[38rem] w-[38rem] rounded-full bg-[var(--primary)]/[0.06] blur-[110px] dark:bg-[var(--primary)]/30" />
        <div className="animate-aurora-slow absolute top-1/4 right-1/6 h-[34rem] w-[34rem] rounded-full bg-[var(--accent)]/[0.06] blur-[110px] dark:bg-[var(--accent)]/25" />
        <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/[0.04] blur-[110px] dark:bg-fuchsia-500/15" />
        {/* 新增：青色极光（仅暗色下可见） */}
        <div className="animate-aurora absolute bottom-1/4 right-1/4 h-[28rem] w-[28rem] rounded-full opacity-0 blur-[90px] dark:opacity-100 dark:bg-[var(--neon-cyan)]/15" />
      </div>
```

- [ ] **Step 2: 在暗色模式下叠加赛博网格**

在 `components/ui/AnimatedBackground.tsx` 的 edge vignette div 之后（`return` 内的最后一个子元素位置）追加：

```tsx
      {/* 赛博网格遮罩（仅暗色下显示） */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 cyber-grid pointer-events-none" />
```

- [ ] **Step 3: 验证并提交**

```bash
npm run type-check && npm run lint
git add components/ui/AnimatedBackground.tsx
git commit -m "feat(bg): 增强暗色极光强度、新增青色极光团、叠加赛博网格"
```

---

## Task 4: Hero 区 — 终端 Badge + monospace 副标题 + 霓虹 Stats

**Files:**
- Modify: `app/page.client.tsx`

- [ ] **Step 1: 在 Hero section 加赛博网格遮罩层**

找到 `app/page.client.tsx` 中的：
```tsx
        <ParticleNetwork mousePos={mousePos} />

        {/* Subtle gradient overlay for readability */}
        <div className="absolute inset-0 bg-[var(--background)]/50 pointer-events-none" />
```

替换为：
```tsx
        <ParticleNetwork mousePos={mousePos} />

        {/* 赛博网格遮罩（暗色下加强层次感） */}
        <div className="absolute inset-0 cyber-grid opacity-0 dark:opacity-100 pointer-events-none" />

        {/* 渐变遮罩：保证文字可读性 */}
        <div className="absolute inset-0 bg-[var(--background)]/50 pointer-events-none" />
```

- [ ] **Step 2: 在 AvatarDisplay 之前插入终端 Badge**

找到 `app/page.client.tsx` 中的：
```tsx
          {/* Avatar */}
          <AvatarDisplay />
```

在其之前插入：
```tsx
          {/* 终端风格 Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--neon-purple)]/40 bg-[var(--neon-purple)]/10 px-3 py-1.5 text-[10px] font-mono tracking-widest text-[var(--neon-purple)] animate-fade-in-up">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-purple)] animate-pulse" />
            MICRO-AI BLOG · ONLINE
          </div>
```

- [ ] **Step 3: 升级副标题为 monospace 终端风格**

找到 `app/page.client.tsx` 中的：
```tsx
          <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            大数据研发工程师 · 探索大数据与大模型技术
          </p>
```

替换为：
```tsx
          <p className="font-mono text-sm text-[var(--neon-cyan)] max-w-2xl mx-auto mb-8 animate-fade-in-up tracking-wider" style={{ animationDelay: "0.2s" }}>
            <span className="text-[var(--neon-purple)] mr-1 select-none">$</span>
            大数据研发工程师 · LLM · Agent · 量化投资
          </p>
```

- [ ] **Step 4: 让 Stats 数字交替使用霓虹色（通过 index）**

找到 Stats 面板中渲染每个 statItem 的 `.map((item) =>` 改为 `.map((item, idx) =>`，
然后将数字 div：
```tsx
                <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text font-mono text-xl font-bold tabular-nums text-transparent sm:text-2xl">
                  {item.value}
                </div>
```

替换为：
```tsx
                <div
                  className="font-mono text-xl font-bold tabular-nums sm:text-2xl"
                  style={{
                    color: idx % 2 === 0 ? "var(--neon-purple)" : "var(--neon-cyan)",
                    textShadow: idx % 2 === 0
                      ? "0 0 12px rgba(167,139,250,0.6)"
                      : "0 0 12px rgba(6,182,212,0.6)",
                  }}
                >
                  {item.value}
                </div>
```

无需修改 `statItems` 数组的类型。

- [ ] **Step 5: 验证并提交**

```bash
npm run type-check && npm run lint
git add app/page.client.tsx
git commit -m "feat(hero): 终端 Badge、monospace 副标题、赛博网格遮罩、霓虹 Stats"
```

---

## Task 5: Header — 闪烁光标 Logo + 路径导航

**Files:**
- Modify: `components/Header.tsx`

- [ ] **Step 1: 在 Logo 末尾加闪烁 `_` 光标**

找到 `components/Header.tsx` 中的 Logo Link：
```tsx
          {profile?.name ?? "微观AI"}
```

替换为：
```tsx
          {profile?.name ?? "微观AI"}<span className="animate-terminal-blink ml-0.5 font-mono text-[var(--neon-cyan)]">_</span>
```

- [ ] **Step 2: 在导航项前加 `~/` 路径前缀**

找到 `components/Header.tsx` 中渲染导航项的 `<span className="relative z-10">{item.title}</span>`，替换为：

```tsx
              <span className="relative z-10">
                <span className="hidden font-mono text-[var(--neon-cyan)]/60 lg:inline">~/</span>{item.title}
              </span>
```

- [ ] **Step 3: 验证并提交**

```bash
npm run type-check && npm run lint
git add components/Header.tsx
git commit -m "feat(header): Logo 闪烁光标 + 路径风格导航前缀"
```

---

## Task 6: BlogCard — 终端标题栏（macOS 三色点 + 文件名）

**Files:**
- Modify: `components/BlogCard.tsx`

- [ ] **Step 1: 在卡片顶部插入终端标题栏**

找到 `components/BlogCard.tsx` 中：
```tsx
    <div
      style={{ "--cat": style.accent } as CSSProperties}
      className="group relative glass cursor-pointer overflow-hidden rounded-xl p-6 pl-7 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--cat)]/40 hover:shadow-[var(--shadow-lg)] active:scale-[0.99]"
      onClick={() => router.push(`/blog/${post.slug}`)}
    >
      {/* Category accent spine */}
```

在 `{/* Category accent spine */}` 之前（即 `<div ...>` 的第一个子元素）插入终端标题栏：

```tsx
      {/* 终端标题栏 */}
      <div className="absolute inset-x-0 top-0 flex items-center gap-1.5 border-b border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[10px] text-[var(--terminal-text)]">
          {post.slug}.mdx
        </span>
      </div>
```

- [ ] **Step 2: 为卡片内容区增加顶部留白（为终端栏腾出空间）**

找到 `components/BlogCard.tsx` 中：
```tsx
      <div className="relative z-10">
```

替换为：
```tsx
      <div className="relative z-10 mt-9">
```

（`mt-9` = 36px，终端栏高度约 38px，确保内容不被遮挡）

- [ ] **Step 3: 在卡片底部加渐变扫光线（hover 时出现）**

找到 `components/BlogCard.tsx` 最后一个 `</div>`（关闭外层 `group` div 的标签）之前，插入：

```tsx
      {/* hover 渐变扫光线 */}
      <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--neon-purple)] to-[var(--neon-cyan)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
```

- [ ] **Step 4: 验证并提交**

```bash
npm run type-check && npm run lint
git add components/BlogCard.tsx
git commit -m "feat(card): 终端标题栏（macOS 三色点+文件名）+ hover 扫光线"
```

---

## Task 7: 代码块 — macOS 三色点移至左侧

**Files:**
- Modify: `components/CodeCopyButton.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: 更新 CodeCopyButton 注入的 HTML，左侧加三色点**

找到 `components/CodeCopyButton.tsx` 中的 `header.innerHTML` 赋值，替换整个字符串为：

```typescript
        header.innerHTML = `
          <div style="display:flex;align-items:center;gap:5px;">
            <span style="width:10px;height:10px;border-radius:50%;background:#ff5f57;display:inline-block;"></span>
            <span style="width:10px;height:10px;border-radius:50%;background:#febc2e;display:inline-block;"></span>
            <span style="width:10px;height:10px;border-radius:50%;background:#28c840;display:inline-block;"></span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="code-lang-label">${lang}</span>
            <button class="copy-code-btn" title="复制代码">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
        `;
```

注意同时更新 `btn` 的 querySelector：
```typescript
        const btn = header.querySelector<HTMLButtonElement>(".copy-code-btn")!;
```
（原来是 `".copy-code-btn"`，不变，无需改动）

- [ ] **Step 2: 更新 globals.css 中代码块头部为两端对齐**

找到 `app/globals.css` 中：
```css
  .prose-custom pre .code-block-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
```

将 `justify-content: flex-end;` 改为 `justify-content: space-between;`

- [ ] **Step 3: 同步删除 `.code-lang-dot` 的单点样式（已被三色点替代）**

找到 `app/globals.css` 中：
```css
  .prose-custom pre .code-lang-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 0.375rem;
    background: color-mix(in srgb, var(--primary) 80%, var(--foreground));
    box-shadow: 0 0 6px color-mix(in srgb, var(--primary) 50%, transparent);
  }
```

删除整个 `.code-lang-dot` 规则块（共 8 行），因为注入的 HTML 已不再使用 `.code-lang-dot` class。

- [ ] **Step 4: 验证并提交**

```bash
npm run type-check && npm run lint
git add components/CodeCopyButton.tsx app/globals.css
git commit -m "feat(code-block): 代码块头部改为 macOS 三色点在左、语言+复制在右"
```

---

## Task 8: ReadingProgress — 紫→青渐变 + 辉光

**Files:**
- Modify: `components/ui/ReadingProgress.tsx`

- [ ] **Step 1: 将进度条改为渐变 + 辉光**

将 `components/ui/ReadingProgress.tsx` 中的进度条 div：
```tsx
      <div
        className="h-full bg-[var(--primary)] transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
```

替换为：
```tsx
      <div
        className="h-full transition-all duration-150"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, var(--primary), var(--neon-purple), var(--neon-cyan))",
          boxShadow: "0 0 8px rgba(6, 182, 212, 0.6)",
        }}
      />
```

- [ ] **Step 2: 验证并提交**

```bash
npm run type-check && npm run lint
git add components/ui/ReadingProgress.tsx
git commit -m "feat(progress): 阅读进度条改为紫→霓虹青渐变 + 辉光"
```

---

## Task 9: 滚动揭入动效

**Files:**
- Create: `components/RevealList.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: 为首页 BlogCard 列表包装揭入动效**

找到 `app/page.tsx` 中的最新文章 Section：
```tsx
      <Section title="最新文章" moreHref="/blog" className="mb-20">
        <div className="grid gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </Section>
```

由于 `app/page.tsx` 是 Server Component，不能直接用 hook。需要将带动效的包装提取为一个小型 Client Component。

在 `components/RevealList.tsx` 中创建：

```tsx
"use client";

import { useEffect, useRef } from "react";

interface RevealListProps {
  children: React.ReactNode;
  className?: string;
}

export function RevealList({ children, className }: RevealListProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const items = el.querySelectorAll<HTMLElement>(":scope > *");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    items.forEach((item, i) => {
      (item as HTMLElement).style.transitionDelay = `${i * 80}ms`;
      item.classList.add("reveal");
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: 在 app/page.tsx 中使用 RevealList**

在 `app/page.tsx` 顶部追加导入：
```typescript
import { RevealList } from "../components/RevealList";
```

将最新文章的 `<div className="grid gap-6">` 替换为：
```tsx
        <RevealList className="grid gap-6">
```
并关闭标签改为 `</RevealList>`。

- [ ] **Step 4: 验证并提交**

```bash
npm run type-check && npm run lint
git add hooks/useReveal.ts components/RevealList.tsx app/page.tsx
git commit -m "feat(reveal): 首页博客卡片滚动揭入错位动效"
```

---

## Task 10: 全量验证 + 开发端口预览

**Files:** 无代码改动，仅验证

- [ ] **Step 1: TypeScript 类型检查**

```bash
npm run type-check
```

预期输出：无错误（exit 0）

- [ ] **Step 2: ESLint 检查**

```bash
npm run lint
```

预期输出：无错误（exit 0）

- [ ] **Step 3: 构建验证**

```bash
npm run build
```

预期输出：构建成功，无报错。（prebuild 会重新生成 sitemap/RSS/索引）

- [ ] **Step 4: 启动开发服务器**

```bash
npm run dev
```

浏览器打开 `http://localhost:3000`，逐项检查：

1. **首页 Hero**：粒子网络颜色变为紫色/青色，有终端 Badge，副标题有 `$` 前缀，Stats 数字交替显示紫/青霓虹色
2. **Header**：Logo 末尾有 `_` 闪烁光标，导航项有 `~/` 前缀
3. **博客卡片**：顶部有终端标题栏（三色点 + 文件名），hover 时底部出现扫光线
4. **文章详情页**：阅读进度条为紫→青渐变，代码块头部有三色点在左
5. **滚动动效**：首页博客卡片列表从页面外滚入时有错位揭入效果
6. **暗色/亮色**：切换主题，检查两种模式下无视觉异常
7. **移动端**：浏览器开发者工具切换到移动视图，检查响应式是否正常

- [ ] **Step 5: 确认不上生产**

开发端口验证完成即告一段落。**不执行 `./deploy.sh`，不 push 到 main。**

---

## 实现顺序速查

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → Task 9 → Task 10
  CSS     粒子     背景      Hero     Header    BlogCard  代码块   进度条   滚动效果   预览
```
