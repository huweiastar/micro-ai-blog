# 首页弹幕 Hero + 后台文案管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用后台可维护的横向弹幕（barrage）替换首页 Hero 区的粒子网络背景。

**Architecture:** 弹幕文案存 `config/barrage.json`（原子写，沿用 theme.json 范式），服务端 `lib/barrage.ts` 读出后经 `page.tsx`→`page.client.tsx` 透传给纯 CSS 动画的 `BarrageHero` 客户端组件。后台 `/admin/barrage` + `/api/barrage`（GET/PUT，admin 中间件保护，PUT 后 revalidate 首页）。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript、Tailwind、vitest、Playwright。所有命令在仓库根执行（monorepo），blog 包名 `@app/blog`，工作目录文件在 `apps/blog/`。

**前置：** 分支 `feat/homepage-barrage`（已建，基于 main）。blog 测试/构建需带 `CONTENT_DIR=../../content DATA_DIR=../../data`。

---

### Task 1: `lib/barrage.ts` — 读取配置 + 输入清洗（纯函数，TDD）

**Files:**
- Create: `apps/blog/lib/barrage.ts`
- Test: `apps/blog/lib/barrage.test.ts`
- Create (种子数据): `apps/blog/config/barrage.json`

- [ ] **Step 1: 写失败测试**

`apps/blog/lib/barrage.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { sanitizeBarrageInput, type BarrageConfig } from "./barrage";

describe("sanitizeBarrageInput", () => {
  it("trim 并丢弃空行/纯空白行", () => {
    const out = sanitizeBarrageInput({ enabled: true, items: ["  你好 ", "", "   ", "世界"] });
    expect(out).toEqual<BarrageConfig>({ enabled: true, items: ["你好", "世界"] });
  });

  it("enabled 转布尔，items 非数组时回退空数组", () => {
    expect(sanitizeBarrageInput({ enabled: "yes", items: "nope" })).toEqual({ enabled: true, items: [] });
    expect(sanitizeBarrageInput({})).toEqual({ enabled: false, items: [] });
  });

  it("单条超过 120 字截断，条数超过 200 截断", () => {
    const long = "a".repeat(200);
    const many = Array.from({ length: 250 }, (_, i) => `x${i}`);
    expect(sanitizeBarrageInput({ enabled: true, items: [long] }).items[0]).toHaveLength(120);
    expect(sanitizeBarrageInput({ enabled: true, items: many }).items).toHaveLength(200);
  });

  it("丢弃非字符串条目", () => {
    expect(sanitizeBarrageInput({ enabled: true, items: ["ok", 1, null, {}] }).items).toEqual(["ok"]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -w @app/blog -- barrage`
Expected: FAIL（`./barrage` 模块不存在）

- [ ] **Step 3: 写实现**

`apps/blog/lib/barrage.ts`:
```ts
import fs from "fs";
import path from "path";

export interface BarrageConfig {
  enabled: boolean;
  items: string[];
}

const MAX_LEN = 120;
const MAX_ITEMS = 200;

const barragePath = path.join(process.cwd(), "config/barrage.json");

/** 清洗任意外部输入为合法 BarrageConfig：布尔化 enabled、过滤非字符串、trim、去空、限长限量。 */
export function sanitizeBarrageInput(body: unknown): BarrageConfig {
  const obj = (body ?? {}) as Record<string, unknown>;
  const enabled = Boolean(obj.enabled);
  const raw = Array.isArray(obj.items) ? obj.items : [];
  const items = raw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => (s.length > MAX_LEN ? s.slice(0, MAX_LEN) : s))
    .slice(0, MAX_ITEMS);
  return { enabled, items };
}

/** 服务端读取 config/barrage.json；缺失/损坏时回退为关闭+空列表，绝不抛错拖垮首页。 */
export function readBarrage(): BarrageConfig {
  try {
    const content = fs.readFileSync(barragePath, "utf-8");
    return sanitizeBarrageInput(JSON.parse(content));
  } catch {
    return { enabled: false, items: [] };
  }
}
```

- [ ] **Step 4: 建种子数据文件**

`apps/blog/config/barrage.json`:
```json
{
  "enabled": true,
  "items": [
    "欢迎来到微观AI ✨",
    "大模型 · Agent · RAG",
    "代码改变世界，咖啡改变代码 ☕",
    "今天也要好好学习呀",
    "Bug 是成长的好朋友 🐛",
    "愿你被这个世界温柔以待"
  ]
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npm test -w @app/blog -- barrage`
Expected: PASS（4 个用例）

- [ ] **Step 6: 提交**

```bash
git add apps/blog/lib/barrage.ts apps/blog/lib/barrage.test.ts apps/blog/config/barrage.json
git commit -m "feat(barrage): config 读取 + 输入清洗 lib（含单测与种子数据）"
```

---

### Task 2: `/api/barrage` — GET/PUT 路由

**Files:**
- Create: `apps/blog/app/api/barrage/route.ts`

参照 `apps/blog/app/api/theme/route.ts` 的写法（`atomicWriteFile`、`dynamic = "force-dynamic"`）。

- [ ] **Step 1: 写实现**

`apps/blog/app/api/barrage/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { revalidatePath } from "next/cache";
import { atomicWriteFile } from "../../../lib/atomic-file";
import { readBarrage, sanitizeBarrageInput } from "../../../lib/barrage";

// 保存后需立即生效：禁止把 GET 静态缓存成构建期旧值。
export const dynamic = "force-dynamic";

const barragePath = path.join(process.cwd(), "config/barrage.json");

export async function GET() {
  return NextResponse.json(readBarrage());
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const sanitized = sanitizeBarrageInput(body);
    atomicWriteFile(barragePath, JSON.stringify(sanitized, null, 2));
    // 弹幕显示在首页，写完让首页缓存失效以立即生效。
    revalidatePath("/");
    return NextResponse.json({ success: true, message: "弹幕已更新", data: sanitized });
  } catch (error) {
    console.error("更新弹幕失败:", error);
    return NextResponse.json({ success: false, message: "更新失败" }, { status: 500 });
  }
}
```

> 鉴权：`/api/*` 与 `/admin/*` 由现有 admin middleware 保护，无需在路由内另加。

- [ ] **Step 2: type-check**

Run: `npm run type-check -w @app/blog`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add apps/blog/app/api/barrage/route.ts
git commit -m "feat(barrage): /api/barrage GET/PUT（原子写 + revalidate 首页）"
```

---

### Task 3: `BarrageHero` 组件 + keyframes

**Files:**
- Create: `apps/blog/components/ui/BarrageHero.tsx`
- Modify: `apps/blog/app/globals.css`（追加 `@keyframes barrage-scroll`）

设计要点：SSR 安全——逐条样式由 index 经确定性伪随机推导（服务端/客户端一致，避免 hydration 不匹配），不要在 render 里用 `Math.random()`。

- [ ] **Step 1: 写组件**

`apps/blog/components/ui/BarrageHero.tsx`:
```tsx
"use client";

interface BarrageHeroProps {
  items: string[];
}

const TRACKS = 6; // 轨道数（行数）

// 确定性伪随机：同一 index 在 server/client 得到相同值，避免水合不匹配。
function hash(n: number): number {
  let h = (n + 1) * 2654435761;
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}

/**
 * 首页 Hero 横向弹幕背景：纯 CSS 动画，多轨道循环飘字。
 * 颜色走 CSS 变量，亮暗自适应；处于标题下层（z 低）。
 * reduced-motion 下全局 globals.css 会把动画时长压到 ~0 → 弹幕滑出视野即不显示。
 */
export function BarrageHero({ items }: BarrageHeroProps) {
  if (items.length === 0) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {items.map((text, i) => {
        const track = i % TRACKS;
        const topPct = 8 + track * (84 / TRACKS); // 8%~92% 纵向均分
        const duration = 10 + (hash(i) % 7); // 10~16s
        const delay = (hash(i * 7) % 120) / 10; // 0~12s
        const tone = ["var(--primary)", "var(--accent)", "var(--muted)"][hash(i * 3) % 3];
        return (
          <span
            key={i}
            className="absolute whitespace-nowrap text-sm sm:text-base font-medium select-none"
            style={{
              top: `${topPct}%`,
              left: 0,
              color: tone,
              opacity: 0.55,
              animation: `barrage-scroll ${duration}s linear ${delay}s infinite`,
              willChange: "transform",
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 追加 keyframes 到 globals.css**

在 `apps/blog/app/globals.css` 文件**末尾**追加：
```css
/* 首页 Hero 弹幕：从右侧屏外飘到左侧屏外，纯 transform（GPU 友好）。 */
@keyframes barrage-scroll {
  from {
    transform: translateX(100vw);
  }
  to {
    transform: translateX(-100%);
  }
}
```

- [ ] **Step 3: type-check**

Run: `npm run type-check -w @app/blog`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add apps/blog/components/ui/BarrageHero.tsx apps/blog/app/globals.css
git commit -m "feat(barrage): BarrageHero 纯 CSS 弹幕组件 + keyframes"
```

---

### Task 4: 首页接线 — 替换粒子、删除 mousePos、删 ParticleNetwork

**Files:**
- Modify: `apps/blog/app/page.tsx`（读 barrage 并透传）
- Modify: `apps/blog/app/page.client.tsx`（换组件、删 mousePos）
- Delete: `apps/blog/components/ui/ParticleNetwork.tsx`

- [ ] **Step 1: `page.tsx` 读取 barrage 并传入**

在 `apps/blog/app/page.tsx` 顶部 import 区加：
```ts
import { readBarrage } from "../lib/barrage";
```
在构造 `initialVisits` 之后、`return` 之前加：
```ts
  const barrage = readBarrage();
```
把渲染处（约 77 行）：
```tsx
      <HomeClient stats={stats} columns={columns} initialVisits={initialVisits} />
```
改为：
```tsx
      <HomeClient
        stats={stats}
        columns={columns}
        initialVisits={initialVisits}
        barrage={barrage}
      />
```

- [ ] **Step 2: `page.client.tsx` 改 props 与渲染**

改 import（约第 5 行），删除 ParticleNetwork、加 BarrageHero 与类型：
```tsx
// 删除： import { ParticleNetwork } from "../components/ui/ParticleNetwork";
import { BarrageHero } from "../components/ui/BarrageHero";
import type { BarrageConfig } from "../lib/barrage";
```
`HomeClientProps` 接口加字段：
```tsx
interface HomeClientProps {
  stats: StatsData;
  columns: ColumnTheme[];
  initialVisits: { pv: number; uv: number };
  barrage: BarrageConfig;
}
```
函数签名解构加 `barrage`：
```tsx
export function HomeClient({ stats, columns, initialVisits, barrage }: HomeClientProps) {
```
**删除** mousePos 相关三段（原 35、43-50 行）：`const [mousePos, setMousePos] = ...`、`handleMouseMove`、`handleMouseLeave`。同时 import 里 `useState, useCallback, useEffect` 中 `useCallback` 若仅此处用则去掉（保留 `useState`/`useEffect`，它们 visitStats 仍用）。
`<section>`（约 99-103 行）去掉 `onMouseMove`/`onMouseLeave`，把 `<ParticleNetwork .../>` 替换：
```tsx
      <section
        className="relative min-h-[58vh] flex items-center justify-center overflow-hidden py-16"
      >
        {barrage.enabled && barrage.items.length > 0 && (
          <BarrageHero items={barrage.items} />
        )}
```

- [ ] **Step 3: 删除粒子组件**

```bash
git rm apps/blog/components/ui/ParticleNetwork.tsx
```

- [ ] **Step 4: 确认无残留引用**

Run: `grep -rn "ParticleNetwork\|mousePos\|handleMouseMove\|handleMouseLeave" apps/blog/app apps/blog/components`
Expected: 无输出

- [ ] **Step 5: type-check + lint**

Run: `npm run type-check -w @app/blog && npm run lint -w @app/blog`
Expected: 均无错误

- [ ] **Step 6: 提交**

```bash
git add apps/blog/app/page.tsx apps/blog/app/page.client.tsx
git commit -m "feat(barrage): 首页 Hero 用弹幕替换粒子网络，移除 mousePos 逻辑"
```

---

### Task 5: 后台 `/admin/barrage` 页面 + 侧栏入口

**Files:**
- Create: `apps/blog/app/admin/barrage/page.tsx`
- Modify: `apps/blog/components/admin/Sidebar.tsx`（加入口）

- [ ] **Step 1: 写后台页面**

`apps/blog/app/admin/barrage/page.tsx`（参照其它 admin client 页风格；用 textarea 每行一条）:
```tsx
"use client";

import { useEffect, useState } from "react";

export default function AdminBarragePage() {
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/barrage")
      .then((r) => r.json())
      .then((d: { enabled: boolean; items: string[] }) => {
        setEnabled(Boolean(d.enabled));
        setText((d.items ?? []).join("\n"));
      })
      .catch(() => setMsg("加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const items = text.split("\n").map((s) => s.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/barrage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, items }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setText((data.data?.items ?? items).join("\n"));
        setMsg("已保存，首页即时生效");
      } else {
        setMsg(data.message || "保存失败");
      }
    } catch {
      setMsg("网络错误");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-[var(--muted)]">加载中…</div>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">首页弹幕</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">每行一条文案，飘过首页顶部 Hero 区。</p>

      <label className="mt-6 flex items-center gap-3">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span className="text-sm">启用弹幕</span>
      </label>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder="每行一条弹幕…"
        className="mt-4 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--primary)]"
      />

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 侧栏加入口**

在 `apps/blog/components/admin/Sidebar.tsx`：import 增加 `MessagesSquare`（来自 lucide-react，第 7 行那组）：
```tsx
import { FileText, FolderOpen, Rocket, User, Palette, Stethoscope, StickyNote, MessagesSquare } from "lucide-react";
```
在「站点」组 items（约 27-31 行）`theme` 之后加一条：
```tsx
      { href: "/admin/barrage", label: "弹幕", Icon: MessagesSquare },
```

- [ ] **Step 3: type-check + lint**

Run: `npm run type-check -w @app/blog && npm run lint -w @app/blog`
Expected: 均无错误

- [ ] **Step 4: 提交**

```bash
git add apps/blog/app/admin/barrage/page.tsx apps/blog/components/admin/Sidebar.tsx
git commit -m "feat(barrage): 后台 /admin/barrage 文案管理页 + 侧栏入口"
```

---

### Task 6: 终验（构建 + 全测 + 双模式视觉）

**Files:** 无（仅验证）

- [ ] **Step 1: 隔离构建**

Run:
```bash
NEXT_DIST_DIR=.next.verify CONTENT_DIR=../../content DATA_DIR=../../data npm run build -w @app/blog 2>&1 | tail -5
rm -rf apps/blog/.next.verify
```
Expected: 构建成功（exit 0）；输出含 `/api/barrage` 与 `/admin/barrage`。

- [ ] **Step 2: 全测**

Run: `npm test -w @app/blog`
Expected: 全部通过（含新增 barrage 用例）。

- [ ] **Step 3: 起 dev 做视觉验证**

```bash
cd apps/blog && nohup env NEXT_DIST_DIR=.next.dev CONTENT_DIR=../../content DATA_DIR=../../data npm run dev -- -p 3001 > /tmp/blog-dev.log 2>&1 & disown
```
用 Playwright 打开 `http://127.0.0.1:3001/`：
- 亮色：Hero 区有弹幕横向飘动、居中标题清晰可读、无粒子线条。
- 暗色（`document.documentElement.classList.add('dark')`）：弹幕颜色随主题、对比足够。
- 后台关闭弹幕（PUT enabled:false）后刷新首页 → Hero 区干净无弹幕。
验证完 `pkill -f "next dev -p 3001"`、`rm -rf apps/blog/.next.dev`。

- [ ] **Step 4:（如有视觉微调）提交**

```bash
git add -A && git commit -m "fix(barrage): 视觉微调（按需）"
```

---

## 自检对照（spec 覆盖）

- 后台单独维护文案列表 → Task 1（存储）+ Task 5（编辑）✓
- 总开关 → `enabled` 贯穿 Task 1/2/4/5 ✓
- 粒子彻底移除 → Task 4 删除组件与引用 ✓
- 纯 CSS 多轨道弹幕、亮暗自适应、放射状遮罩保留 → Task 3 + Task 4（遮罩在 page.client 原样保留）✓
- PUT 后 revalidate 首页 → Task 2 ✓
- 输入清洗（trim/去空/限长限量/布尔化）→ Task 1 单测覆盖 ✓
- 服务端读、无运行时依赖 → Task 1 `readBarrage` + Task 4 page.tsx 注入 ✓
- 测试：lib 单测 + Playwright 双模式 → Task 1 + Task 6 ✓

## 回滚
纯新增 + 局部替换；失败 `git reset --hard` 到分支起点（spec 提交之后）即可，生产零影响。
