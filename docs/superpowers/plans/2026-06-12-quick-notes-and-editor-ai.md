# 随手记（Quick Notes）+ 编辑器细粒度 AI 辅助 实施计划

> **日期**: 2026-06-12
> **目标**: 降低"学到东西→沉淀成文章"的摩擦。
> Wave A：随手记快速发布通道（note 类型内容 + 时间线页 + 后台快速记录）。
> Wave B：编辑器细粒度 AI 辅助（选区润色/扩写/通俗化、一键生成摘要、相关文章内链建议）。
> **执行方式**: inline 自主执行，每个 Task 完成后验证并 commit（中文 conventional commit）。

## 背景与关键事实

- `lib/posts.ts` 的 `BlogPost` 是独立类型（与 `types/blog.ts` 的同名类型无关），当前**无 type 字段**。
- `app/api/posts/route.ts` 的 `buildFrontmatter` 不写 type；`ArticleEditor.tsx` 的 save payload 不含 type ⇒ **PUT 必须保留既有 type，否则编辑 note 会丢类型**。
- 中文标题 `deriveSlug` 会回退 `article-${Date.now()}` ⇒ 随手记客户端显式传 `note-<ts36>` slug。
- `getSeriesContext` 对无 category 文章返回 null ⇒ 随手记不填分类即自动无专栏框。
- SSE 范本：服务端 `app/api/assistant/write/route.ts`，客户端 `components/admin/ai-write-modal.tsx`。
- `lib/assistant/generator.ts` 的 `generateAIAnswerStream` 含完整双协议（anthropic / openai-compatible）流式逻辑，但 SYSTEM_PROMPT 硬编码 ⇒ 抽出通用 `streamLLM`。
- 鉴权：`middleware.ts` `WRITE_API_PATHS` 需加 `"/api/assistant/assist"`。
- RAG：`retrieve(query, {mode:"blog", limit})` 返回 `{chunks, sources}`，chunk 含 slug/url/title/sourceType。

---

## Wave A：随手记

### Task 1: 数据层 — type 字段 + lib/notes.ts 纯函数（TDD）

1. `tests/lib/notes.test.ts`（先写测试）：
   - `deriveNoteTitle("今天学了 **Rust** 的所有权\n第二行", 40)` → `今天学了 Rust 的所有权`（取首行、剥离 markdown 标记、超长截断加 `…`）
   - 空内容 → `随手记`
   - `deriveNoteSlug(ts)` → `note-${ts.toString(36)}`，匹配 `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`
2. 新建 `lib/notes.ts`：`deriveNoteTitle(content, maxLength=40)`、`deriveNoteSlug(now=Date.now())`。
3. `lib/posts.ts`：
   - `BlogPost` 加 `type: "article" | "note"`；`parsePostFile` 中 `type: data.type === "note" ? "note" : "article"`。
   - 新增 `getAllArticlesSync()`（过滤 type==="article"）与 `getAllNotesSync()`（过滤 note）。
4. 验证：`npm test`、`npm run type-check`。Commit: `feat(notes): 数据层支持 note 类型 + 标题/slug 派生纯函数`

### Task 2: posts API 支持 type

`app/api/posts/route.ts`：
- `buildFrontmatter` 加可选 `type`，仅为 "note" 时写 `type: note` 行。
- POST 接收 `body.type`（仅接受 "note"，否则忽略）。
- PUT：`type: body.type === "note" ? "note" : existing type`（从已读 frontmatter 保留）。
- GET（单篇与列表）返回 type。
- 验证 + Commit: `feat(notes): posts API 读写 note 类型并在编辑时保留`

### Task 3: 公开页面

- 新建 `app/notes/page.tsx`（server component）：`getAllNotesSync()` 时间线，每条 `renderMarkdownToHtml` 全文渲染 + date + tags + 永久链接到 `/blog/[slug]`；空态文案。metadata title "随手记"。
- `config/nav.ts`："博客"后加 `{ title: "随手记", href: "/notes" }`。
- `app/blog/page.tsx`、`app/page.tsx` 改用 `getAllArticlesSync()`。
- `app/blog/[slug]/page.tsx`：summary 仅在 `summary && summary !== title` 时渲染；note 的返回链接指向 `/notes`。
- 验证（含 build）+ Commit: `feat(notes): 随手记公开时间线页 + 博客列表排除 note`

### Task 4: 后台快速记录

- 新建 `app/admin/notes/page.tsx`（"use client"）：
  - 快速记录卡：textarea autofocus + 可选 tags 输入 + 发布按钮 + ⌘/Ctrl+Enter 提交。
  - POST `/api/posts` `{title: deriveNoteTitle(content), slug: deriveNoteSlug(), content, tags, type:"note", draft:false}`；成功 toast + 清空 + 刷新列表。
  - 下方最近随手记列表（GET `/api/posts` 过滤 type）：编辑跳 `/admin/articles/edit?slug=`，删除带 confirm。
- `components/admin/Sidebar.tsx` 内容组与 `components/admin/NewMenu.tsx` 加入口（StickyNote 图标）。
- 验证 + Commit: `feat(notes): 后台随手记快速发布页 + 侧栏/新建入口`

---

## Wave B：编辑器 AI 辅助

### Task 5: generator.ts 抽出 streamLLM

`lib/assistant/generator.ts`：新增导出 `streamLLM({system, user, maxTokens}): AsyncGenerator<string>`，封装现有 anthropic/openai 双协议 fetch+SSE 解析；`generateAIAnswerStream` 改为调用它（行为不变，保留本地回退）。验证 + Commit: `refactor(assistant): 抽出通用 streamLLM 流式调用`

### Task 6: editor-assist 业务层（TDD 纯函数）

新建 `lib/assistant/editor-assist.ts`：
- `AssistAction = "polish" | "expand" | "simplify" | "summarize"`；`isAssistAction` 守卫。
- `clampAssistInput(action, text)`：选区类截 6000 字，summarize 截 16000。
- `PROMPTS`：润色（保持原意与 Markdown 结构）/ 扩写（补充示例，1.5–2 倍）/ 通俗化（面向初学者、用类比）/ 摘要（50–120 字纯文本，无引号）。
- `buildAssistMessages(action, text, articleTitle?)` → `{system, user}`。
- `generateAssistStream(action, text, title?)` → 调 `streamLLM`。
- `pickLinkSuggestions(chunks, currentSlug?, limit=5)` 纯函数：blog 类型、有 url+slug、按 slug 去重、排除当前。
- `suggestRelatedLinks(text, currentSlug?)`：`retrieve(text.slice(0,300), {mode:"blog", limit:12})` + pick。
- `tests/lib/editor-assist.test.ts` 测 isAssistAction / clampAssistInput / buildAssistMessages / pickLinkSuggestions。
- 验证 + Commit: `feat(assistant): 编辑器 AI 辅助业务层（动作提示词 + 内链建议）`

### Task 7: assist API 路由 + 鉴权

- 新建 `app/api/assistant/assist/route.ts`：POST `{action, text, title?, slug?}`；
  - `action === "links"` → JSON `{links}`；
  - 其余：`resolveAIConfig()` 为 null → 503 `{error:"未配置 AI_API_KEY"}`；否则 SSE 流（start/chunk/done/error 事件，格式同 write 路由）；
  - IP 限流 20/min。
- `middleware.ts` `WRITE_API_PATHS` 加 `"/api/assistant/assist"`。
- 验证 + Commit: `feat(assistant): /api/assistant/assist 流式辅助路由（登录保护 + 限流）`

### Task 8: 编辑器选区 AI 菜单

- 新建 `components/admin/hooks/useAssistStream.ts`：status/output/error/start(action,text,title)/stop/reset，SSE 消费照 ai-write-modal。
- 新建 `components/admin/MarkdownEditor/dialogs/AIAssistDialog.tsx`：挂载即开流；显示原文 + 流式结果；按钮：替换选区 / 重新生成 / 复制 / 关闭。
- `Toolbar.tsx` 加 `onAiAction?: (action) => void`，渲染 Sparkles 下拉（润色选区/扩写选区/通俗化）。
- `MarkdownEditor/index.tsx`：aiDialog state；handleAiAction 校验有选区（无选区显示瞬时提示）；onReplace 用 `onChange(value.slice(0,start) + newText + value.slice(end))`。
- 验证 + Commit: `feat(editor): 选区 AI 润色/扩写/通俗化（流式弹窗）`

### Task 9: ArticleEditor 摘要生成 + 内链建议

- 摘要 InspectorSection 加 "AI 生成" 按钮：useAssistStream(action=summarize, text=正文)，流式写入 articleSummary。
- 新增 "内链建议" InspectorSection（defaultOpen=false）：按钮 POST action=links，text=`${articleTitle}\n${articleContent.slice(0,1200)}`；点击建议复制 `[title](url)` + toast。
- 验证 + Commit: `feat(editor): 一键生成摘要 + 相关文章内链建议`

### Task 10: 全量验证

`npm test` → `npm run type-check` → `npm run lint` → `npm run build` 全绿。如有遗漏修复后补 commit。

## 自检清单

- [ ] 编辑既有 note 不丢 type（PUT 保留）
- [ ] 随手记 slug 永远合法（note-ts36）
- [ ] /blog 与首页不出现 note；/notes 不出现 article
- [ ] 未配置 AI key 时 assist 接口返回 503 且 UI 提示友好
- [ ] assist 接口未登录不可访问（middleware）
