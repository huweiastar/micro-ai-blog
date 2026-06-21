# A3a：抽出共享内容读包 `@pkg/content` 设计文档

> 日期：2026-06-21 ｜ 分支：`feat/split-a3a-content-pkg`（基于 main）
> 上位背景：前后端分离架构拆分 A（[[2026-06-20-backend-split-design]]）的 A3 第一子项目。A1/A2/A5 已上线。

## 目标

把 blog 的「内容域层」（MDX/YAML 的读+写：posts/categories/notes/chatters/projects/about + 依赖工具与类型）整体抽成共享 npm workspace 包 `@pkg/content`，供后续 A3b 的 manager 复用。**blog 行为零变化、访客零可见差异**。

本子项目只做「搬家 + 接线」，不迁移写接口/admin 页/assistant（那是 A3b），不动 db/likes/analytics（留 blog）。

## 范围

**范围内**
- 新建 `packages/content`，把内容域模块、其依赖工具、相关类型 `git mv` 进去。
- blog 改为依赖 `@pkg/content`；用 re-export shim 把 blog 应用代码改动压到最小。
- 内容相关 vitest 仍全过；隔离构建通过。

**范围外（后续子项目）**
- 写接口 / `/admin/*` 页 / 编辑器 AI（assistant write/assist）迁入 manager —— **A3b**。
- blog 瘦身（删除迁走的代码）+ 全量 revalidate 回调 —— **A4**。
- 抽 `@pkg/db`（SQLite）—— 推迟到 manager 真正需要时（A3b 内或单列）。
- assistant `chat`（访客 AI 问答）、likes、analytics、留言板等访客运行时 —— **永久留 blog**。

## 架构

### 移入 `packages/content/src/`（`git mv` 保留历史）

| 类别 | 模块 |
|------|------|
| 内容模块（含读+写函数，整体搬） | `posts`, `categories`, `notes`, `chatters`, `projects`, `about`, `content-media` |
| 工具 | `paths`, `word-count`, `atomic-file`, `rehype-callouts`, `rehype-mark`, `rehype-content-enhance`, `rehype-code-header` |
| 类型 | `types/blog`, `types/project`, `types/about` |

依据依赖图（侦察确认）：内容模块仅依赖上述工具/类型与外部库（gray-matter/remark/rehype/js-yaml），**不依赖 db、不依赖 config、不依赖 components**，切割面干净。

### 留在 blog

- `seo`（引 `config/site`，应用专属）—— 仅需把它对 `about` 的引用改成 `@pkg/content`。
- `db`, `analytics`, `likes`, `auth`, `auth-version`, `login-guard`（db/访客运行时侧）。
- `config/*`、所有 `components/*`、`app/*`。

### 依赖与接线

- `packages/content/package.json`：name `@pkg/content`，把内容域用到的运行时依赖（`gray-matter`、`remark*`、`rehype*`、`rehype-pretty-code`/`shiki`、`js-yaml`、`reading-time`/字数相关等——按实际 import 收敛）声明在此包；npm workspaces 自动 hoist。
- `packages/content/tsconfig.json`：参照 `packages/auth`。
- blog `package.json`：加 `"@pkg/content": "*"`；`apps/blog/next.config.mjs` 的 `transpilePackages` 增 `@pkg/content`。
- 包内 `paths.ts` 继续读 `process.env.CONTENT_DIR/DATA_DIR`（blog/manager 的 next.config 已注入），无需改。

### 兼容策略：re-export shim（核心决策，最低风险）

- blog 内被大量引用的模块保留**一行再导出 shim**，使现有导入点零改动：
  - `apps/blog/lib/posts.ts` → `export * from "@pkg/content/posts";`
  - 同理 `categories/notes/chatters/projects/about/content-media/paths/word-count/atomic-file` 及各 `rehype-*`。
  - `apps/blog/types/blog.ts`、`types/project.ts`、`types/about.ts` → `export * from "@pkg/content/types/<x>";`
- 这样 blog 数百处 `../lib/posts`、`../types/blog` 等导入**一律不动**，行为完全不变。
- shim 是过渡产物；A4 可选择把导入点直接改成 `@pkg/content` 后删除 shim（本子项目不强制）。
- **包用 subpath exports**（`exports` 字段逐一暴露 `./posts`、`./categories`、…、`./types/blog` 等子路径），shim 与子路径 1:1 对应。不走 flat `index.ts` 汇总，避免跨模块同名导出冲突。

## 数据流（不变）

```
content/*.{mdx,yaml} ──(@pkg/content 读)──> shim(apps/blog/lib/*) ──> blog app/components（导入点不变）
```
构建/SSR 时读，无运行时依赖；与现状一致。

## 测试

- 内容相关现有 vitest（`posts`、`categories`、`notes`、`chatters`、`projects`、`about`、`content-media`、`word-count` 等及其 `*.test.ts`）**随模块一起迁入 `packages/content`**（测试与代码同住），import 改为包内相对路径。`packages/content` 加自己的 `test`(vitest) 脚本；根 `package.json` 的 `test` 聚合脚本同时跑 blog 与 content 两套（数量不减）。
- 验证：`npm run type-check -w @app/blog` + `npm run lint -w @app/blog` + `npm test`（全测，数量不减）+ 隔离构建（`NEXT_DIST_DIR=.next.verify`，构建后删）成功。
- 因 blog 行为零变化，A3a 可不单独部署（访客无可见差异）；部署留待 A3b/A4。

## 风险与回滚

- 纯搬家 + 接线，行为保持。最大风险是包 `exports` 子路径 / transpile / 依赖 hoist 配置不当导致构建失败——靠隔离构建在合并前拦住。
- 失败 `git reset --hard` 到分支起点；不碰生产。
- 已知坑（沿用历史经验）：Next16 在 workspace 下会打印 `Failed to patch lockfile / pnpm registry` 噪声但构建仍 exit 0（非致命）；切分支跑 `npm install` 会动 `node_modules/@pkg/*` 软链，合并后需 `npm install` 重链。
