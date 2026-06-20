# 设计稿：前后端分离 / 独立管理后台（架构拆分 A）

- 日期：2026-06-20
- 状态：待用户评审（**仅设计，本轮不实现**）
- 承接：[[session-2026-06-20-glass-four-sections]]（B 展示端已上线）

## 背景

现状：blog 是单体 Next 应用——公开展示页 + `/admin` 后台 + 写接口 + AI 辅助 + SQLite 全在一个进程，systemd `:3000` 上线。用户要走「独立管理后台」式前后端分离。

**已锁定决策**
1. 管理端形态 = **在线 web 后台**（浏览器访问 + 登录，从 blog 独立成单独进程）
2. 仓库 = **同仓库 monorepo**（npm workspaces：apps/blog + apps/manager + packages/*）
3. 同步 = **同机共享 `content/` 与 `data/blog.db`**；manager 写文件后调 blog 的 **revalidate webhook** 即时生效（免 git CI）
4. 鉴权 = **复用现有** session-token + `ADMIN_PASSWORD`

**待评审决策**
- manager 入口：子域 `admin.huweiastar.deepai.icu`（推荐）vs 路径 `/manage`
- monorepo 工具：**npm workspaces**（推荐，零额外依赖）vs Turborepo
- 只读 GET 接口归属（见下表，逐个定）

## 目标拓扑

单服务器、双 Next 进程，共享同一份内容与数据库：

```
monorepo (一个 git 仓库, npm workspaces)
├── apps/
│   ├── blog/        只读展示端  → systemd :3000 → nginx 主域
│   └── manager/     在线管理端  → systemd :3002 → nginx admin 子域(带登录)
├── packages/
│   ├── content/     内容读写 lib（posts/notes/chatters/friends/gallery/projects/about/categories/regenerate/atomic-file/content-media/word-count …）
│   ├── db/          SQLite + 运行时数据（db/likes/analytics/visitor/revisions/storage）
│   ├── auth/        鉴权（auth/session-token/auth-version/login-guard）
│   └── shared/      seo/utils/types 等公用
├── content/         共享内容文件（两 app 同读，manager 写）
└── data/blog.db     共享 SQLite（WAL，多进程读 + 单写）
```

## 谁去哪：接口/页面拆迁清单

**留在 blog（只读展示 + 访客运行时）**
- 全部公开页面（/、/blog、/notes、/chatters、/friends、/about、/gallery、/tags … 含本期 B 成果）
- `/api/likes [GET,POST]`、`/api/analytics [GET,POST]`（访客运行时写 SQLite，必须留 blog）
- `/api/theme [GET]`（公开读主题）
- **新增** `/api/revalidate [POST]`（token 保护，仅按路径失效缓存，不写内容）

**迁到 manager（内容管理 + 写）**
- 全部 `/admin/*` 页面（12 个：admin/theme/about/notes/projects/articles/content-health/login/categories + edit 子页）
- 写接口：`/api/about [PUT]`、`/api/posts [POST,PUT,DELETE]`、`/api/projects [POST,PUT,DELETE]`、`/api/categories [POST,PUT,DELETE]`、`/api/publish [POST]`、`/api/upload [POST]`、`/api/theme [PUT]`
- `/api/assistant/{assist,chat,write} [POST]`（AI 辅助）
- `/api/admin/{index-status,media,overview,preview,reindex,revisions}`
- `/api/auth/{login,logout} [POST]`、`/api/feishu [POST]`

**逐个定（只读 GET，当前公私混用）**
| 接口 | 公开页面是否用 | 建议 |
|---|---|---|
| `/api/about [GET]` | about 直出走 lib，非此 API | 迁 manager |
| `/api/posts [GET]` | 列表走 lib sync | 迁 manager（仅后台用）|
| `/api/projects [GET]` | 同上 | 迁 manager |
| `/api/categories [GET]` | 同上 | 迁 manager |
| `/api/auth/version [GET]` | 鉴权探活 | 看 middleware 依赖，多半迁 manager |

> 原则：公开页面一律走**构建期/服务端 lib 直读**（已是现状），不依赖运行时 GET API；故绝大多数 GET 可随写接口迁走，blog 侧只保留 likes/analytics/theme-GET/revalidate。实现期逐个核对引用再定。

## 同步机制

manager 与 blog **同机共享 `content/` 与 `data/blog.db`**：
- manager 写内容文件（沿用现有 atomic-file 原子写）→ 写后 `POST {blogOrigin}/api/revalidate`，body 带 `token` + 受影响 `paths[]`
- blog `/api/revalidate` 校验 token（环境变量 `REVALIDATE_TOKEN`）后 `revalidatePath(...)`，复用现有 `refreshAfterContentChange`/`revalidateContentPaths` 逻辑
- SQLite WAL 支持双进程：blog 写 likes/analytics，manager 写 revisions/media，并发安全（单写锁由 SQLite 处理）

## 鉴权

- manager 整站置于登录后：复用 `packages/auth`（session-token + `ADMIN_PASSWORD` + auth-version 失效）；manager 自己的 middleware 守卫全站
- blog 不再承载后台鉴权；仅 `/api/revalidate` 用独立 `REVALIDATE_TOKEN`
- `.env.local`：`ADMIN_PASSWORD`、`REVALIDATE_TOKEN`、`GEMINI_API_KEY`（AI 辅助）等按 app 分配

## 部署

- 两个 systemd unit：`micro-ai-blog`(:3000)、`micro-ai-manager`(:3002)
- nginx：主域 → blog；**`admin.huweiastar.deepai.icu`**（推荐）→ manager，独立 certbot 证书 + 登录
- `deploy.sh`：改为 workspaces 构建两 app（蓝绿 + 各自健康检查 + 回滚），或拆成 `deploy-blog.sh`/`deploy-manager.sh`
- 共享 `content/`、`data/` 路径：两 app `process.cwd()` 都指向仓库根（或用绝对 env 路径），部署不动 data/

## 分阶段实施（每阶段保持可部署、可回滚）

> 每阶段独立成 plan，走 type-check/lint/隔离构建/Playwright，blog 全程在线。

- **A1 — 引入 workspaces + 抽共享包**：建 npm workspaces，把 `lib/*` 按 content/db/auth/shared 抽到 `packages/*`，blog 改为从包导入。**无行为变化**，blog 仍是单体。验证：构建+全测通过、线上不变。
- **A2 — 脚手架 manager**：建 `apps/manager` 空 Next app，接通 `packages/auth` 登录 + 一个最小迁移样例（如主题写）打通「写→revalidate」链路。
- **A3 — 迁移后台**：把全部 `/admin/*` 页面 + 写接口 + assistant + admin API 移入 manager（引用共享包）。manager 自洽可用。
- **A4 — blog 瘦身**：删除 blog 内已迁走的 admin 页面与写接口；新增 `/api/revalidate`；manager 写后回调 blog 失效。blog 攻击面收敛为只读 + 访客运行时。
- **A5 — 部署拓扑**：第二 systemd + nginx admin 子域 + TLS；`deploy.sh` 适配双 app；冒烟。

## 风险与对策

- **大重构**：严格分阶段，每阶段保持 blog 可部署、可回滚（保留 `.next.old`）。
- **共享路径**：两 app 同机共享 `content/`、`data/blog.db`；务必同机部署，勿跨机（否则文件/DB 不共享，需改 git/网络同步）。
- **依赖重复**：workspaces 下 lucide/next 等各 app 各装；锁版本一致（lucide 锁 0.474，见 [[session-2026-06-17-next16-upgrade]]）。
- **构建产物隔离**：沿用 `NEXT_DIST_DIR` 隔离手法，勿污染生产 `.next`（见 incident 记忆）。
- **rollback**：A1 抽包阶段最易回滚（纯重构）；A4/A5 删除+拓扑变更前打 tag。

## 非目标

- 不改内容格式（仍 MDX + YAML）、不重写后台 UI（原样搬迁）
- 不换鉴权方案、不引第三方 CMS
- 不动访客数据语义（likes/analytics 仍 blog 运行时写）
- 不上 Turborepo/容器化（除非评审时选）

## 评审问题

1. manager 入口：子域 `admin.*`（推荐）vs 路径 `/manage`？
2. monorepo 工具：npm workspaces（推荐）vs Turborepo？
3. 只读 GET 接口归属是否同意「随写接口迁 manager、blog 仅留 likes/analytics/theme-GET/revalidate」？
4. 是否认可分阶段 A1→A5、每阶段单独 plan 推进？
