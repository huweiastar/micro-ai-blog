# A3a：抽出共享内容读包 `@pkg/content` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 blog 的内容域层（MDX/YAML 读+写模块及其工具/类型）整体迁入新 workspace 包 `@pkg/content`，blog 用 re-export shim 保持行为零变化。

**Architecture:** `git mv` 把 14 个模块 + 2 个类型迁入 `packages/content/src`；包用 subpath exports 暴露子路径；blog 在原 `lib/*`、`types/*` 留一行 `export * from "@pkg/content/*"` 的 shim，使 blog 数百处导入点不动。db/likes/analytics/seo/components 全部留 blog（seo 经 shim 自动解析，无需改）。

**Tech Stack:** npm workspaces、TypeScript、Next 16 `transpilePackages`、vitest。命令在仓库根执行；blog=`@app/blog`，新包=`@pkg/content`。blog 测试/构建带 `CONTENT_DIR=../../content DATA_DIR=../../data`。

**前置：** 分支 `feat/split-a3a-content-pkg`（已建，基于 main）。参照现成 `packages/auth` 包范式（main/types/exports 指向 `.ts` 源码，靠 transpilePackages）。

---

### Task 1: 脚手架 `packages/content` + 接线 blog

**Files:**
- Create: `packages/content/package.json`
- Create: `packages/content/tsconfig.json`
- Create: `packages/content/src/.gitkeep`（占位，后续任务删）
- Modify: `apps/blog/package.json`（加依赖）
- Modify: `apps/blog/next.config.mjs`（transpilePackages 增项）
- Modify: `package.json`（根，test 聚合）

- [ ] **Step 1: 建 `packages/content/package.json`**

```json
{
  "name": "@pkg/content",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "test": "CONTENT_DIR=../../content DATA_DIR=../../data vitest run",
    "type-check": "tsc --noEmit"
  },
  "exports": {
    "./posts": "./src/posts.ts",
    "./categories": "./src/categories.ts",
    "./notes": "./src/notes.ts",
    "./chatters": "./src/chatters.ts",
    "./projects": "./src/projects.ts",
    "./about": "./src/about.ts",
    "./content-media": "./src/content-media.ts",
    "./paths": "./src/paths.ts",
    "./word-count": "./src/word-count.ts",
    "./atomic-file": "./src/atomic-file.ts",
    "./types/project": "./src/types/project.ts",
    "./types/about": "./src/types/about.ts"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "js-yaml": "^4.1.0",
    "github-slugger": "^2.0.0",
    "reading-time": "^1.5.0",
    "rehype-autolink-headings": "^7.1.0",
    "rehype-pretty-code": "^0.13.0",
    "rehype-slug": "^6.0.0",
    "rehype-stringify": "^10.0.0",
    "remark": "^15.0.1",
    "remark-gfm": "^4.0.0",
    "remark-rehype": "^11.1.2",
    "shiki": "^1.3.0"
  }
}
```

- [ ] **Step 2: 建 `packages/content/tsconfig.json`**（参照 packages/auth）

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 占位文件**

```bash
mkdir -p packages/content/src/types && touch packages/content/src/.gitkeep
```

- [ ] **Step 4: blog 加依赖**

在 `apps/blog/package.json` 的 `dependencies` 加一行（与 `@pkg/auth` 同级）：
```json
    "@pkg/content": "*",
```

- [ ] **Step 5: blog next.config transpile**

`apps/blog/next.config.mjs` 里 `transpilePackages` 数组加入 `@pkg/content`（现有应已含 `@pkg/auth`），即：
```js
  transpilePackages: ["@pkg/auth", "@pkg/content"],
```

- [ ] **Step 6: 根 test 聚合**

`package.json`（根）的 `scripts.test` 由 `npm run test -w @app/blog` 改为：
```json
    "test": "npm run test -w @app/blog && npm run test -w @pkg/content",
```

- [ ] **Step 7: 安装链接**

Run: `npm install --no-audit --no-fund`
Expected: 成功；`ls -la node_modules/@pkg/content` 是指向 `../../packages/content` 的软链。

- [ ] **Step 8: 基线校验（尚未迁模块，blog 应不受影响）**

Run: `npm run type-check -w @app/blog`
Expected: 无错误。

- [ ] **Step 9: 提交**

```bash
git add packages/content apps/blog/package.json apps/blog/next.config.mjs package.json package-lock.json
git commit -m "feat(content-pkg): 脚手架 @pkg/content + 接线 blog(依赖/transpile/根test聚合)"
```

---

### Task 2: 迁移无依赖叶子模块 + 类型 + 对应测试 + shim

**Files（git mv 进包；新建 shim）:**
- Move: `apps/blog/lib/{paths,word-count,atomic-file,notes,rehype-callouts,rehype-mark,rehype-content-enhance,rehype-code-header}.ts` → `packages/content/src/`
- Move: `apps/blog/types/{project,about}.ts` → `packages/content/src/types/`
- Move(test): `apps/blog/lib/paths.test.ts` → `packages/content/src/paths.test.ts`；`apps/blog/tests/lib/notes.test.ts` → `packages/content/src/notes.test.ts`
- Create(shim): `apps/blog/lib/{paths,word-count,atomic-file,notes}.ts`、`apps/blog/types/{project,about}.ts`

这些模块依赖图：`paths`/`word-count`/`notes`/4×`rehype-*` 无相对依赖；`atomic-file` 仅 fs/path；`types/*` 纯类型。先迁它们不会有未解析引用。`rehype-*` 在 blog 无直接引用（仅 posts 用），**不建 shim**。

- [ ] **Step 1: git mv 模块与类型**

```bash
cd /home/ubuntu/projects/micro-ai-blog
rm -f packages/content/src/.gitkeep
git mv apps/blog/lib/paths.ts packages/content/src/paths.ts
git mv apps/blog/lib/word-count.ts packages/content/src/word-count.ts
git mv apps/blog/lib/atomic-file.ts packages/content/src/atomic-file.ts
git mv apps/blog/lib/notes.ts packages/content/src/notes.ts
git mv apps/blog/lib/rehype-callouts.ts packages/content/src/rehype-callouts.ts
git mv apps/blog/lib/rehype-mark.ts packages/content/src/rehype-mark.ts
git mv apps/blog/lib/rehype-content-enhance.ts packages/content/src/rehype-content-enhance.ts
git mv apps/blog/lib/rehype-code-header.ts packages/content/src/rehype-code-header.ts
git mv apps/blog/types/project.ts packages/content/src/types/project.ts
git mv apps/blog/types/about.ts packages/content/src/types/about.ts
```

- [ ] **Step 2: git mv 测试并修 import**

```bash
git mv apps/blog/lib/paths.test.ts packages/content/src/paths.test.ts
git mv apps/blog/tests/lib/notes.test.ts packages/content/src/notes.test.ts
```
把 `packages/content/src/notes.test.ts` 里 `from "../../lib/notes"` 改为 `from "./notes"`。
检查 `packages/content/src/paths.test.ts` 的 import：若为 `from "./paths"` 保持不变；若为其它相对路径，改为 `./paths`。

- [ ] **Step 3: 建 shim（仅 blog 直接引用者）**

`apps/blog/lib/paths.ts`:
```ts
export * from "@pkg/content/paths";
```
`apps/blog/lib/word-count.ts`:
```ts
export * from "@pkg/content/word-count";
```
`apps/blog/lib/atomic-file.ts`:
```ts
export * from "@pkg/content/atomic-file";
```
`apps/blog/lib/notes.ts`:
```ts
export * from "@pkg/content/notes";
```
`apps/blog/types/project.ts`:
```ts
export * from "@pkg/content/types/project";
```
`apps/blog/types/about.ts`:
```ts
export * from "@pkg/content/types/about";
```

- [ ] **Step 4: 校验**

Run:
```bash
npm run type-check -w @pkg/content && npm run type-check -w @app/blog
npm run test -w @pkg/content
```
Expected: 两个 type-check 无错误；包测试通过（paths + notes 用例）。

- [ ] **Step 5: 提交**

```bash
git add apps/blog packages/content
git commit -m "feat(content-pkg): 迁移叶子模块(paths/word-count/atomic-file/notes/rehype-*)+类型+测试，blog 留 shim"
```

---

### Task 3: 迁移 posts / chatters / content-media + 测试 + shim

**Files:**
- Move: `apps/blog/lib/{posts,chatters,content-media}.ts` → `packages/content/src/`
- Move(test): `apps/blog/lib/chatters.test.ts` → `packages/content/src/chatters.test.ts`；`apps/blog/lib/posts.notes-fields.test.ts` → `packages/content/src/posts.notes-fields.test.ts`
- Create(shim): `apps/blog/lib/{posts,chatters,content-media}.ts`

`posts` 依赖 `paths`/`word-count`/4×`rehype-*`（Task 2 已迁，包内相对引用 `./paths` 等可解析）；`chatters`/`content-media` 依赖 `paths`。

- [ ] **Step 1: git mv 模块与测试**

```bash
cd /home/ubuntu/projects/micro-ai-blog
git mv apps/blog/lib/posts.ts packages/content/src/posts.ts
git mv apps/blog/lib/chatters.ts packages/content/src/chatters.ts
git mv apps/blog/lib/content-media.ts packages/content/src/content-media.ts
git mv apps/blog/lib/chatters.test.ts packages/content/src/chatters.test.ts
git mv apps/blog/lib/posts.notes-fields.test.ts packages/content/src/posts.notes-fields.test.ts
```

- [ ] **Step 2: 修包内 import**

确认迁入的 `posts.ts`/`chatters.ts`/`content-media.ts` 对 `./paths`、`./word-count`、`./rehype-*` 的相对引用在包内仍正确（同目录，路径不变，无需改）。
确认两个测试文件对被测模块的 import 为同目录相对路径（`./posts`、`./chatters`）；若原为 `./posts` 保持，若为其它则改正。

- [ ] **Step 3: 建 shim**

`apps/blog/lib/posts.ts`:
```ts
export * from "@pkg/content/posts";
```
`apps/blog/lib/chatters.ts`:
```ts
export * from "@pkg/content/chatters";
```
`apps/blog/lib/content-media.ts`:
```ts
export * from "@pkg/content/content-media";
```

- [ ] **Step 4: 校验**

Run:
```bash
npm run type-check -w @pkg/content && npm run type-check -w @app/blog
npm run test -w @pkg/content
```
Expected: 无类型错误；包测试通过（含 chatters、posts.notes-fields）。

- [ ] **Step 5: 提交**

```bash
git add apps/blog packages/content
git commit -m "feat(content-pkg): 迁移 posts/chatters/content-media+测试，blog 留 shim"
```

---

### Task 4: 迁移 categories / projects / about + shim

**Files:**
- Move: `apps/blog/lib/{categories,projects,about}.ts` → `packages/content/src/`
- Create(shim): `apps/blog/lib/{categories,projects,about}.ts`

`categories` 依赖 `paths`/`atomic-file`/`posts`（均已在包内）；`projects` 依赖 `paths`/`atomic-file`/`types/project`（已迁）；`about` 依赖 `paths`/`atomic-file`/`types/about`（已迁）。包内对 `./types/project` 的相对引用：原 blog 是 `../types/project`，迁入 `src/` 后类型在 `src/types/`，需把引用改为 `./types/project`。

- [ ] **Step 1: git mv**

```bash
cd /home/ubuntu/projects/micro-ai-blog
git mv apps/blog/lib/categories.ts packages/content/src/categories.ts
git mv apps/blog/lib/projects.ts packages/content/src/projects.ts
git mv apps/blog/lib/about.ts packages/content/src/about.ts
```

- [ ] **Step 2: 修包内类型引用**

在 `packages/content/src/projects.ts` 把 `from "../types/project"` 改为 `from "./types/project"`。
在 `packages/content/src/about.ts` 把 `from "../types/about"` 改为 `from "./types/about"`。
（`categories.ts` 引用的 `./paths`/`./atomic-file`/`./posts` 同目录，不变。）

- [ ] **Step 3: 建 shim**

`apps/blog/lib/categories.ts`:
```ts
export * from "@pkg/content/categories";
```
`apps/blog/lib/projects.ts`:
```ts
export * from "@pkg/content/projects";
```
`apps/blog/lib/about.ts`:
```ts
export * from "@pkg/content/about";
```

- [ ] **Step 4: 校验**

Run:
```bash
npm run type-check -w @pkg/content && npm run type-check -w @app/blog
```
Expected: 无类型错误。

- [ ] **Step 5: 提交**

```bash
git add apps/blog packages/content
git commit -m "feat(content-pkg): 迁移 categories/projects/about，blog 留 shim"
```

---

### Task 5: 终验（全测 + lint + 隔离构建 + 无残留断引用）

**Files:** 无（仅验证；如发现遗漏 shim/引用再补）

- [ ] **Step 1: 无断引用检查**

Run:
```bash
cd /home/ubuntu/projects/micro-ai-blog
grep -rn "from \"\.\./types/project\"\|from \"\.\./types/about\"" packages/content/src
```
Expected: 无输出（包内类型引用已全部改为 `./types/...`）。

再确认 blog 无指向已删除原文件的断引用：
```bash
npm run type-check -w @app/blog
```
Expected: 无错误（shim 覆盖所有引用点）。

- [ ] **Step 2: lint 两侧**

Run: `npm run lint -w @app/blog`
Expected: 无错误（shim 文件是合法 re-export；若 lint 报 `@pkg/content` 解析问题，确认 `node_modules/@pkg/content` 软链存在，必要时 `npm install`）。

- [ ] **Step 3: 全测（数量不减）**

Run: `npm test`
Expected: blog 与 @pkg/content 两套都跑；总用例数与迁移前一致（迁移前 83；内容相关 4 个测试文件从 blog 移到包，总数不变）。两套均通过。

- [ ] **Step 4: 隔离构建 blog**

Run:
```bash
NEXT_DIST_DIR=.next.verify CONTENT_DIR=../../content DATA_DIR=../../data npm run build -w @app/blog > /tmp/a3a.log 2>&1; echo "exit=$?"
grep -E "Compiled successfully" /tmp/a3a.log
rm -rf apps/blog/.next.verify
```
Expected: exit=0、`Compiled successfully`。（Next16 可能打印 `Failed to patch lockfile/pnpm` 噪声，非致命，忽略。）

- [ ] **Step 5: 提交（如有补漏）**

```bash
git add -A && git commit -m "chore(content-pkg): A3a 终验补漏（如有）" || echo "无补漏，跳过"
```

---

## 自检对照（spec 覆盖）
- 内容域 14 模块 + 2 类型迁入 @pkg/content → Task 2/3/4 ✓
- subpath exports（12 子路径，与 shim 1:1）→ Task 1 Step 1 ✓
- re-export shim 使 blog 导入零改动（含 seo→about、categories→posts 经 shim/包内解析）→ Task 2/3/4 建 shim ✓
- 测试随模块迁入包（paths/notes/chatters/posts.notes-fields 共 4 个）→ Task 2/3 ✓
- 根 test 聚合 blog+content、数量不减 → Task 1 Step 6 + Task 5 Step 3 ✓
- db/likes/analytics/seo/components 留 blog（不在迁移清单）✓
- 行为零变化、可不单独部署 → 终验只到隔离构建，无部署步骤 ✓

## 回滚
纯搬家+接线；任一步失败 `git reset --hard` 到分支起点（spec 提交 a04ace9 之后）即可，生产零影响。合并到 main 后需 `npm install` 重链 workspace 包。
