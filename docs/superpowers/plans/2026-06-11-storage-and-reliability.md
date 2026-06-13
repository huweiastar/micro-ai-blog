# 存储与数据可靠性优化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除"数据只存在于一台 VPS 磁盘"的单点风险——每日异地备份、运行时数据从 JSON 文件迁到 SQLite、图片迁到对象存储 + CDN、后台发布内容自动 git 提交推送。

**Architecture:** 文章保持 MDX 文件 + git 作为唯一可信源（后台写入后自动 commit/push）；点赞/访问统计从"整文件读写 JSON"迁到 better-sqlite3 单文件库（事务原子、无并发丢写）；图片上传链路改为 sharp 压缩后写入 S3 兼容对象存储（未配置时自动回退本地，开发环境零依赖）；最外层用每日 cron 备份兜底。

**Tech Stack:** better-sqlite3、vitest（仅 lib 层最小测试）、@aws-sdk/client-s3（厂商无关，OSS/COS/R2/七牛均兼容）、sharp、bash + cron + rclone。

---

## 0. 决策点（请先逐项确认 ✅/✏️）

| # | 决策 | 本计划默认值 | 备选 |
|---|------|-------------|------|
| D1 | 对象存储厂商 | ✅ **已确认：七牛云 Kodo**（10GB 存储免费额度；S3 兼容协议，代码厂商无关）。注意：bucket 绑定的访问域名需为自有已备案域名（七牛测试域名 30 天过期，不可用于生产） | — |
| D2 | 备份异地目的地 | **rclone remote**（可指向另一个 OSS bucket / OneDrive / 坚果云 WebDAV）；未配置 rclone 时仅本机 `/home/ubuntu/backups` 保留 14 天 | scp 到另一台机器 |
| D3 | `.env.local` 密钥 | **不进入自动备份包**（避免密钥随备份扩散）；请手动抄一份到密码管理器 | 加入备份但对包加密 |
| D4 | git push 鉴权 | **SSH Deploy Key（写权限）**，origin 切到 SSH 地址 | HTTPS + PAT；或 `GIT_SYNC_PUSH=0` 先只本地 commit 不 push |
| D5 | 测试框架 | **引入 vitest**，只给 lib/db、analytics、likes 写最小单测（项目目前零测试） | 不引入，仅手工验证（不推荐） |
| D6 | 自制修订快照 `data/revisions` | **本计划保留不动**；git-sync 稳定运行一段时间后再考虑删除（后续工作） | — |

**Phase 依赖关系：** Phase 1/2/3 相互独立、可单独上线；Phase 4 必须在 Phase 2 之后（否则 `data/analytics.json` 每个 PV 都弄脏工作区，自动提交会被污染）。

---

## 文件结构总览

| 文件 | 操作 | 职责 |
|------|------|------|
| `scripts/backup.sh` | 新建 | 每日备份打包 + 轮转 + rclone 异地同步 |
| `lib/db.ts` | 新建 | SQLite 单例连接 + 建表 migration |
| `lib/analytics.ts` | 重写 | PV/UV 读写改走 SQLite（导出签名不变） |
| `lib/likes.ts` | 重写 | 点赞读写改走 SQLite（导出签名不变） |
| `scripts/migrate-json-to-sqlite.ts` | 新建 | 一次性迁移 analytics.json / likes.json 存量数据 |
| `tests/lib/analytics.test.ts` | 新建 | analytics 单测 |
| `tests/lib/likes.test.ts` | 新建 | likes 单测 |
| `lib/storage.ts` | 新建 | S3 兼容对象存储封装（put/list/delete/keyFromUrl） |
| `app/api/upload/route.ts` | 修改 | sharp 压缩 + S3/本地双模式上传 |
| `app/api/admin/media/route.ts` | 修改 | 媒体库合并列出 S3 + 本地遗留文件，双模式删除 |
| `scripts/migrate-images-to-s3.ts` | 新建 | 存量图片上桶 + 重写 content 内引用 |
| `lib/git-sync.ts` | 新建 | 内容变更后串行化 git add/commit/push |
| `lib/regenerate.ts` | 修改 | `refreshAfterContentChange` 末尾挂接 git-sync |
| `next.config.mjs` | 修改 | `serverComponentsExternalPackages` + CDN remotePattern |
| `.gitignore` / `package.json` | 修改 | 忽略 db 文件与生成产物；新增 scripts/依赖 |

---

# Phase 1 — 每日备份 cron（先止血）

### Task 1: 备份脚本与定时任务

**Files:**
- Create: `scripts/backup.sh`

- [ ] **Step 1: 安装 sqlite3 CLI（用于在线一致性备份，Phase 2 后生效）**

```bash
sudo apt-get install -y sqlite3
```

- [ ] **Step 2: 创建 `scripts/backup.sh`**

```bash
#!/usr/bin/env bash
#
# micro-ai-blog 每日备份：content/（文章）、data/（点赞/统计/快照）、public/images/（图片）。
# 本机保留 14 天；若配置了 rclone remote `blog-backup:` 则同步到异地。
# 注册 cron：0 3 * * * /home/ubuntu/projects/micro-ai-blog/scripts/backup.sh >> /home/ubuntu/backups/micro-ai-blog/backup.log 2>&1
#
set -euo pipefail

APP_DIR="/home/ubuntu/projects/micro-ai-blog"
BACKUP_DIR="/home/ubuntu/backups/micro-ai-blog"
KEEP_DAYS=14
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# SQLite 正在写入时直接 tar 可能拿到不一致快照，先用 .backup 导出一致副本（文件不存在则跳过）
if [ -f "$APP_DIR/data/blog.db" ] && command -v sqlite3 >/dev/null; then
  sqlite3 "$APP_DIR/data/blog.db" ".backup '$APP_DIR/data/blog.db.bak'"
fi

tar czf "$BACKUP_DIR/blog-$STAMP.tar.gz" \
  --exclude='data/blog.db' --exclude='data/blog.db-wal' --exclude='data/blog.db-shm' \
  -C "$APP_DIR" content data public/images

# 本机轮转
find "$BACKUP_DIR" -name 'blog-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

# 异地同步（可选）：rclone config 里存在名为 blog-backup 的 remote 才执行
if command -v rclone >/dev/null && rclone listremotes 2>/dev/null | grep -q '^blog-backup:'; then
  rclone copy "$BACKUP_DIR" blog-backup:micro-ai-blog-backups --max-age 48h
fi

echo "[$(date -Is)] backup ok: blog-$STAMP.tar.gz ($(du -h "$BACKUP_DIR/blog-$STAMP.tar.gz" | cut -f1))"
```

- [ ] **Step 3: 赋执行权限并手动跑一次**

Run: `chmod +x scripts/backup.sh && ./scripts/backup.sh`
Expected: 输出 `backup ok: blog-<时间戳>.tar.gz (...)`，`/home/ubuntu/backups/micro-ai-blog/` 下出现 tar 包。

- [ ] **Step 4: 验证备份可恢复（演练一次还原）**

```bash
LATEST=$(ls -t /home/ubuntu/backups/micro-ai-blog/blog-*.tar.gz | head -1)
mkdir -p /tmp/restore-test && tar xzf "$LATEST" -C /tmp/restore-test
diff /tmp/restore-test/content/blog/llm-architecture.md content/blog/llm-architecture.md && echo RESTORE-OK
rm -rf /tmp/restore-test
```

Expected: 输出 `RESTORE-OK`。

- [ ] **Step 5: 注册 cron（每天凌晨 3 点）**

```bash
( crontab -l 2>/dev/null; echo '0 3 * * * /home/ubuntu/projects/micro-ai-blog/scripts/backup.sh >> /home/ubuntu/backups/micro-ai-blog/backup.log 2>&1' ) | crontab -
crontab -l
```

Expected: `crontab -l` 输出包含该行。

- [ ] **Step 6: （决策 D2）配置 rclone 异地 remote**

```bash
sudo apt-get install -y rclone
rclone config   # 交互式创建名为 blog-backup 的 remote（指向 OSS 另一 bucket / OneDrive / WebDAV）
./scripts/backup.sh && rclone ls blog-backup:micro-ai-blog-backups | head
```

Expected: 异地能列出刚上传的 tar 包。未确认 D2 前可跳过本步，脚本会自动只做本机备份。

- [ ] **Step 7: Commit**

```bash
git add scripts/backup.sh
git commit -m "chore(ops): 新增每日备份脚本（content/data/images，本机轮转+可选 rclone 异地）"
```

---

# Phase 2 — 运行时数据迁 SQLite

### Task 2: 安装依赖与基础配置

**Files:**
- Modify: `package.json`
- Modify: `next.config.mjs`

- [ ] **Step 1: 安装依赖**

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3 vitest
```

- [ ] **Step 2: `package.json` 增加 scripts**

在 `"scripts"` 中加入：

```json
"test": "vitest run",
"migrate:db": "tsx scripts/migrate-json-to-sqlite.ts"
```

- [ ] **Step 3: `next.config.mjs` 把 better-sqlite3 标记为外部包**

better-sqlite3 是原生模块，Next 14 默认会尝试打包导致构建失败，必须外置。在 `nextConfig` 对象中加入：

```js
experimental: {
  serverComponentsExternalPackages: ["better-sqlite3"],
},
```

- [ ] **Step 4: 验证依赖可加载**

Run: `node -e "const db = require('better-sqlite3')(':memory:'); db.exec('CREATE TABLE t(x)'); console.log('sqlite-ok')"`
Expected: `sqlite-ok`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json next.config.mjs
git commit -m "chore(deps): 引入 better-sqlite3 + vitest，next 外置原生模块"
```

### Task 3: `lib/db.ts` — 连接单例与建表

**Files:**
- Create: `lib/db.ts`
- Test: `tests/lib/db.test.ts`

- [ ] **Step 1: 写失败测试 `tests/lib/db.test.ts`**

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { getDb, closeDb } from "../../lib/db";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blogdb-"));
  process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
});

afterEach(() => {
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("getDb", () => {
  it("创建所有表", () => {
    const db = getDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as Array<{ name: string }>;
    const names = tables.map((t) => t.name);
    for (const t of ["path_stats", "path_visitors", "page_view_events", "likes", "like_voters"]) {
      expect(names).toContain(t);
    }
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/lib/db.test.ts`
Expected: FAIL（`lib/db` 不存在）

- [ ] **Step 3: 实现 `lib/db.ts`**

```ts
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db: Database.Database | null = null;

/**
 * SQLite 单例连接。所有运行时可变数据（PV/UV、点赞）存放于 data/blog.db，
 * 替代原先整文件读写的 analytics.json / likes.json：事务原子、无并发丢写。
 * 测试可通过 BLOG_DB_PATH 指向临时库。
 */
export function getDb(): Database.Database {
  if (db) return db;
  const dbPath =
    process.env.BLOG_DB_PATH || path.join(process.cwd(), "data", "blog.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function migrate(d: Database.Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS path_stats (
      path       TEXT PRIMARY KEY,
      pv         INTEGER NOT NULL DEFAULT 0,
      uv         INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS path_visitors (
      path       TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      PRIMARY KEY (path, visitor_id)
    );
    -- 带时间戳的明细事件：为后台「最近 N 天趋势」预留，当前只写不读
    CREATE TABLE IF NOT EXISTS page_view_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      path       TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      viewed_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_viewed_at ON page_view_events (viewed_at);
    CREATE TABLE IF NOT EXISTS likes (
      slug       TEXT PRIMARY KEY,
      count      INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS like_voters (
      slug       TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      PRIMARY KEY (slug, visitor_id)
    );
  `);
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/lib/db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts tests/lib/db.test.ts
git commit -m "feat(data): SQLite 连接层与建表（path_stats/visitors/events/likes/voters）"
```

### Task 4: 重写 `lib/analytics.ts`

**Files:**
- Modify: `lib/analytics.ts`（整文件重写，导出签名兼容现有调用方 `app/page.tsx`、`app/api/analytics/route.ts`）
- Test: `tests/lib/analytics.test.ts`

> 兼容性说明：原 `PathAnalytics` 含 `visitorIds` 字段，但两个调用方都只用 `pv/uv/updatedAt`（route 还特意剥离 visitorIds）。新实现直接去掉该字段，访客标识只存库不出库，类型检查可证明无破坏。

- [ ] **Step 1: 写失败测试 `tests/lib/analytics.test.ts`**

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { closeDb } from "../../lib/db";
import {
  getAnalytics,
  getAnalyticsSummary,
  getPathAnalytics,
  recordPageView,
} from "../../lib/analytics";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blogdb-"));
  process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
});

afterEach(() => {
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("recordPageView", () => {
  it("首次访问：全站与路径 pv/uv 各 +1", () => {
    const r = recordPageView("visitor-a", "/blog/x");
    expect(r.global).toEqual({ pv: 1, uv: 1 });
    expect(r.path.pv).toBe(1);
    expect(r.path.uv).toBe(1);
  });

  it("同一访客重复访问：pv 增加，uv 不变", () => {
    recordPageView("visitor-a", "/blog/x");
    const r = recordPageView("visitor-a", "/blog/x");
    expect(r.global).toEqual({ pv: 2, uv: 1 });
    expect(r.path).toMatchObject({ pv: 2, uv: 1 });
  });

  it("不同访客：uv 增加", () => {
    recordPageView("visitor-a", "/blog/x");
    const r = recordPageView("visitor-b", "/blog/x");
    expect(r.global).toEqual({ pv: 2, uv: 2 });
    expect(r.path).toMatchObject({ pv: 2, uv: 2 });
  });
});

describe("getPathAnalytics", () => {
  it("未知路径返回 0", () => {
    expect(getPathAnalytics("/nope")).toMatchObject({ pv: 0, uv: 0 });
  });
});

describe("getAnalyticsSummary", () => {
  it("按 pv 降序且不含全站伪路径", () => {
    recordPageView("a", "/hot");
    recordPageView("b", "/hot");
    recordPageView("a", "/cold");
    const s = getAnalyticsSummary();
    expect(s.pv).toBe(3);
    expect(s.paths.map((p) => p.path)).toEqual(["/hot", "/cold"]);
    expect(s.paths.some((p) => p.path === "__global__")).toBe(false);
  });
});

describe("getAnalytics", () => {
  it("空库返回 0", () => {
    expect(getAnalytics()).toEqual({ pv: 0, uv: 0 });
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/lib/analytics.test.ts`
Expected: FAIL（旧实现读 JSON，且 `recordPageView` 返回 `path.visitorIds`、测试库为空时行为不匹配）

> 注意：旧实现不认 `BLOG_DB_PATH`，这一步会真实写入仓库里的 `data/analytics.json` 几条计数，无害；该文件在 Task 7 会移出 git 跟踪。

- [ ] **Step 3: 重写 `lib/analytics.ts`（整文件替换为）**

```ts
import { getDb } from "./db";

// 全站汇总复用 path_stats 表，用伪路径一行存储，读写逻辑与普通路径一致。
const GLOBAL_PATH = "__global__";

export type PathAnalytics = {
  pv: number;
  uv: number;
  updatedAt: string;
};

export type AnalyticsSummary = {
  pv: number;
  uv: number;
  updatedAt: string;
  paths: Array<{ path: string; pv: number; uv: number; updatedAt: string }>;
};

type StatsRow = { pv: number; uv: number; updated_at: string };

function readStats(p: string): StatsRow | undefined {
  return getDb()
    .prepare("SELECT pv, uv, updated_at FROM path_stats WHERE path = ?")
    .get(p) as StatsRow | undefined;
}

export function getAnalytics(): { pv: number; uv: number } {
  const row = readStats(GLOBAL_PATH);
  return { pv: row?.pv ?? 0, uv: row?.uv ?? 0 };
}

export function getPathAnalytics(pagePath: string): PathAnalytics {
  const row = readStats(pagePath);
  return {
    pv: row?.pv ?? 0,
    uv: row?.uv ?? 0,
    updatedAt: row?.updated_at ?? new Date().toISOString(),
  };
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const db = getDb();
  const globalRow = readStats(GLOBAL_PATH);
  const rows = db
    .prepare(
      "SELECT path, pv, uv, updated_at FROM path_stats WHERE path != ? ORDER BY pv DESC"
    )
    .all(GLOBAL_PATH) as Array<{
    path: string;
    pv: number;
    uv: number;
    updated_at: string;
  }>;
  return {
    pv: globalRow?.pv ?? 0,
    uv: globalRow?.uv ?? 0,
    updatedAt: globalRow?.updated_at ?? new Date().toISOString(),
    paths: rows.map((r) => ({
      path: r.path,
      pv: r.pv,
      uv: r.uv,
      updatedAt: r.updated_at,
    })),
  };
}

function bumpPath(pagePath: string, visitorId: string, now: string): void {
  const db = getDb();
  const inserted = db
    .prepare("INSERT OR IGNORE INTO path_visitors (path, visitor_id) VALUES (?, ?)")
    .run(pagePath, visitorId);
  const uvDelta = inserted.changes > 0 ? 1 : 0;
  db.prepare(
    `INSERT INTO path_stats (path, pv, uv, updated_at) VALUES (?, 1, ?, ?)
     ON CONFLICT(path) DO UPDATE SET pv = pv + 1, uv = uv + ?, updated_at = ?`
  ).run(pagePath, uvDelta, now, uvDelta, now);
}

export function recordPageView(
  visitorId: string,
  pagePath: string
): { global: { pv: number; uv: number }; path: PathAnalytics } {
  const db = getDb();
  const now = new Date().toISOString();
  const txn = db.transaction(() => {
    db.prepare(
      "INSERT INTO page_view_events (path, visitor_id, viewed_at) VALUES (?, ?, ?)"
    ).run(pagePath, visitorId, now);
    bumpPath(GLOBAL_PATH, visitorId, now);
    bumpPath(pagePath, visitorId, now);
  });
  txn();
  return { global: getAnalytics(), path: getPathAnalytics(pagePath) };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/lib/analytics.test.ts`
Expected: PASS（5 个用例全绿）

- [ ] **Step 5: 类型检查确认调用方兼容**

Run: `npm run type-check`
Expected: 无错误（route 与首页只消费 pv/uv/updatedAt）

- [ ] **Step 6: Commit**

```bash
git add lib/analytics.ts tests/lib/analytics.test.ts
git commit -m "refactor(data): 访问统计迁 SQLite，事务原子化并预留事件明细表"
```

### Task 5: 重写 `lib/likes.ts`

**Files:**
- Modify: `lib/likes.ts`（整文件重写，导出签名不变）
- Test: `tests/lib/likes.test.ts`

- [ ] **Step 1: 写失败测试 `tests/lib/likes.test.ts`**

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { closeDb } from "../../lib/db";
import { getLikes, toggleLike } from "../../lib/likes";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blogdb-"));
  process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
});

afterEach(() => {
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("toggleLike", () => {
  it("点赞 → 取消 → 再点赞", () => {
    expect(toggleLike("post-a", "v1")).toEqual({ count: 1, liked: true });
    expect(toggleLike("post-a", "v1")).toEqual({ count: 0, liked: false });
    expect(toggleLike("post-a", "v1")).toEqual({ count: 1, liked: true });
  });

  it("多访客累计", () => {
    toggleLike("post-a", "v1");
    expect(toggleLike("post-a", "v2")).toEqual({ count: 2, liked: true });
  });
});

describe("getLikes", () => {
  it("未点赞文章返回 0/false", () => {
    expect(getLikes("nope", "v1")).toEqual({ count: 0, liked: false });
  });

  it("返回指定访客的点赞状态", () => {
    toggleLike("post-a", "v1");
    expect(getLikes("post-a", "v1")).toEqual({ count: 1, liked: true });
    expect(getLikes("post-a", "v2")).toEqual({ count: 1, liked: false });
    expect(getLikes("post-a")).toEqual({ count: 1, liked: false });
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/lib/likes.test.ts`
Expected: FAIL（旧实现读写 data/likes.json，不受 BLOG_DB_PATH 控制）

- [ ] **Step 3: 重写 `lib/likes.ts`（整文件替换为）**

```ts
import { getDb } from "./db";

/** 读取某篇文章的点赞数，以及指定访客是否已点赞。 */
export function getLikes(
  slug: string,
  visitorId?: string
): { count: number; liked: boolean } {
  const db = getDb();
  const row = db.prepare("SELECT count FROM likes WHERE slug = ?").get(slug) as
    | { count: number }
    | undefined;
  const liked = visitorId
    ? Boolean(
        db
          .prepare("SELECT 1 FROM like_voters WHERE slug = ? AND visitor_id = ?")
          .get(slug, visitorId)
      )
    : false;
  return { count: row?.count ?? 0, liked };
}

/** 切换点赞状态（同一访客点赞/取消）。返回最新计数与状态。 */
export function toggleLike(
  slug: string,
  visitorId: string
): { count: number; liked: boolean } {
  const db = getDb();
  const now = new Date().toISOString();
  const txn = db.transaction((): { count: number; liked: boolean } => {
    const removed = db
      .prepare("DELETE FROM like_voters WHERE slug = ? AND visitor_id = ?")
      .run(slug, visitorId);
    let liked: boolean;
    if (removed.changes > 0) {
      db.prepare(
        "UPDATE likes SET count = MAX(0, count - 1), updated_at = ? WHERE slug = ?"
      ).run(now, slug);
      liked = false;
    } else {
      db.prepare("INSERT INTO like_voters (slug, visitor_id) VALUES (?, ?)").run(
        slug,
        visitorId
      );
      db.prepare(
        `INSERT INTO likes (slug, count, updated_at) VALUES (?, 1, ?)
         ON CONFLICT(slug) DO UPDATE SET count = count + 1, updated_at = ?`
      ).run(slug, now, now);
      liked = true;
    }
    const row = db.prepare("SELECT count FROM likes WHERE slug = ?").get(slug) as
      | { count: number }
      | undefined;
    return { count: row?.count ?? 0, liked };
  });
  return txn();
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/lib/likes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/likes.ts tests/lib/likes.test.ts
git commit -m "refactor(data): 点赞迁 SQLite，点赞/取消事务原子化"
```

### Task 6: 存量数据迁移脚本

**Files:**
- Create: `scripts/migrate-json-to-sqlite.ts`

- [ ] **Step 1: 创建 `scripts/migrate-json-to-sqlite.ts`**

```ts
/**
 * 一次性迁移：data/analytics.json + data/likes.json → data/blog.db。
 * 幂等：path_stats 非空即认为已迁移，直接退出，可重复执行。
 * 用法：npm run migrate:db
 */
import fs from "fs";
import path from "path";
import { getDb, closeDb } from "../lib/db";

const GLOBAL_PATH = "__global__";

type JsonPathStats = {
  pv: number;
  uv: number;
  visitorIds: string[];
  updatedAt: string;
};

type JsonAnalytics = JsonPathStats & { paths: Record<string, JsonPathStats> };

type JsonLikes = {
  slugs: Record<string, { count: number; voterIds: string[]; updatedAt: string }>;
};

function readJson<T>(file: string): T | null {
  const p = path.join(process.cwd(), "data", file);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

const db = getDb();

const existing = db.prepare("SELECT COUNT(*) AS c FROM path_stats").get() as {
  c: number;
};
if (existing.c > 0) {
  console.log("path_stats 非空，疑似已迁移，跳过。如需重迁请先删除 data/blog.db。");
  closeDb();
  process.exit(0);
}

const insertStats = db.prepare(
  "INSERT INTO path_stats (path, pv, uv, updated_at) VALUES (?, ?, ?, ?)"
);
const insertVisitor = db.prepare(
  "INSERT OR IGNORE INTO path_visitors (path, visitor_id) VALUES (?, ?)"
);
const insertLike = db.prepare(
  "INSERT INTO likes (slug, count, updated_at) VALUES (?, ?, ?)"
);
const insertVoter = db.prepare(
  "INSERT OR IGNORE INTO like_voters (slug, visitor_id) VALUES (?, ?)"
);

const migrateAll = db.transaction(() => {
  const analytics = readJson<JsonAnalytics>("analytics.json");
  let pathCount = 0;
  if (analytics) {
    insertStats.run(GLOBAL_PATH, analytics.pv, analytics.uv, analytics.updatedAt);
    for (const id of analytics.visitorIds || []) insertVisitor.run(GLOBAL_PATH, id);
    for (const [p, s] of Object.entries(analytics.paths || {})) {
      insertStats.run(p, s.pv, s.uv, s.updatedAt);
      for (const id of s.visitorIds || []) insertVisitor.run(p, id);
      pathCount++;
    }
  }

  const likes = readJson<JsonLikes>("likes.json");
  let likeCount = 0;
  if (likes) {
    for (const [slug, l] of Object.entries(likes.slugs || {})) {
      insertLike.run(slug, l.count, l.updatedAt || new Date().toISOString());
      for (const id of l.voterIds || []) insertVoter.run(slug, id);
      likeCount++;
    }
  }

  console.log(
    `迁移完成：analytics ${analytics ? `全站 pv=${analytics.pv} uv=${analytics.uv}，路径 ${pathCount} 条` : "无文件"}；likes ${likeCount} 篇`
  );
});

migrateAll();
closeDb();
```

- [ ] **Step 2: 本地执行并核对数字**

```bash
npm run migrate:db
node -e "
const db = require('better-sqlite3')('data/blog.db', { readonly: true });
console.log('global:', db.prepare(\"SELECT pv, uv FROM path_stats WHERE path='__global__'\").get());
console.log('paths:', db.prepare(\"SELECT COUNT(*) c FROM path_stats\").get().c - 1);
console.log('likes:', db.prepare('SELECT slug, count FROM likes').all());
"
```

Expected: global 的 pv/uv 与 `data/analytics.json` 顶层数字一致；likes 与 `data/likes.json` 一致。

- [ ] **Step 3: 验证幂等**

Run: `npm run migrate:db`
Expected: 输出"疑似已迁移，跳过"。

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-json-to-sqlite.ts package.json
git commit -m "feat(data): JSON→SQLite 存量迁移脚本（幂等）"
```

### Task 7: 收尾——gitignore、移除被跟踪的 analytics.json、全量验证、上线

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: `.gitignore` 末尾追加**

```gitignore
# SQLite 运行时数据库（每日备份脚本负责备份）
/data/blog.db
/data/blog.db-wal
/data/blog.db-shm
/data/blog.db.bak

# 已迁移到 SQLite 的旧 JSON（保留磁盘文件作为迁移底档，不再跟踪）
/data/analytics.json
```

- [ ] **Step 2: 把 analytics.json 移出 git 跟踪（保留磁盘文件）**

```bash
git rm --cached data/analytics.json
```

- [ ] **Step 3: 全量验证**

```bash
npm run test && npm run type-check && npm run lint && npm run build
```

Expected: 全部通过。

- [ ] **Step 4: dev 手测**

Run: `npm run dev`，浏览器访问首页与任一文章页，然后：

```bash
node -e "
const db = require('better-sqlite3')('data/blog.db', { readonly: true });
console.log(db.prepare('SELECT path, pv, uv FROM path_stats ORDER BY updated_at DESC LIMIT 5').all());
"
```

Expected: 刚访问的路径 pv 有增长；文章页点赞按钮工作正常（点赞数 +1，刷新后状态保留）。

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git commit -m "chore(data): analytics.json 移出 git 跟踪，忽略 SQLite 数据库文件"
```

- [ ] **Step 6: 服务器上线（按此顺序执行）**

```bash
# 服务器上：先拉代码装依赖，再迁数据，最后蓝绿切换
cd /home/ubuntu/projects/micro-ai-blog
git pull
npm install --no-audit --no-fund
npm run migrate:db        # 旧服务仍在跑、仍写 JSON；此刻迁移存量
./deploy.sh               # 构建+切换，新代码开始读写 blog.db
```

已知取舍：`migrate:db` 到 `deploy.sh` 切换完成之间（几分钟）产生的新 PV/点赞会留在旧 JSON 里不被迁移，个人博客量级可接受。如在意，可在 deploy 完成后删除 `data/blog.db` 并立即重跑 `npm run migrate:db && sudo systemctl restart micro-ai-blog`（以 JSON 终值为准重迁一次）。

- [ ] **Step 7: 线上验证**

```bash
curl -s https://huweiastar.deepai.icu/api/analytics | head -c 200
```

Expected: 返回的 pv/uv 与迁移前 JSON 数字同量级（不归零）。后台「概览」页数字正常。

---

# Phase 3 — 图片迁对象存储 + CDN + sharp 压缩

> 前置（决策 D1，人工操作）：开通对象存储并准备好 6 个值——Endpoint、Region、Bucket、AccessKey/Secret、公开访问域名（CDN 或 bucket 域名）。Bucket 设为公共读、私有写；CDN 加速域名指向 bucket。

### Task 8: 依赖与环境变量

**Files:**
- Modify: `package.json`
- Modify: `.env.local`（不进 git）

- [ ] **Step 1: 安装依赖**

```bash
npm install @aws-sdk/client-s3 sharp
```

- [ ] **Step 2: `.env.local` 增加（本地与服务器都要配；值按 D1 实际开通结果填写）**

```bash
# 对象存储：七牛云 Kodo（S3 兼容协议）。endpoint/region 按 bucket 所在区域填写，
# 例：华东 cn-east-1 → s3.cn-east-1.qiniucs.com；华南 cn-south-1 → s3.cn-south-1.qiniucs.com。
# AK/SK 在七牛控制台「个人中心 → 密钥管理」获取。
# S3_PUBLIC_BASE_URL 填 bucket 绑定的自有 CDN 加速域名（需已备案，勿用 30 天过期的测试域名）。
S3_ENDPOINT=https://s3.cn-east-1.qiniucs.com
S3_REGION=cn-east-1
S3_BUCKET=micro-ai-blog
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_PUBLIC_BASE_URL=https://img.huweiastar.deepai.icu
S3_FORCE_PATH_STYLE=0
```

> 设计要点：**任一变量缺失时代码自动回退本地 `public/images/` 模式**，因此本地开发、未开通桶之前，一切照旧可用。

- [ ] **Step 3: Commit（仅 package.json）**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): 引入 @aws-sdk/client-s3 + sharp"
```

### Task 9: `lib/storage.ts` — 对象存储封装

**Files:**
- Create: `lib/storage.ts`

- [ ] **Step 1: 创建 `lib/storage.ts`**

```ts
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type StoredImage = {
  url: string;
  name: string;
  dir: string;
  size: number;
  mtime: number;
};

/** S3 五项必需配置齐全才启用对象存储，否则调用方回退本地文件模式。 */
export function s3Configured(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_PUBLIC_BASE_URL
  );
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "auto",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
  });
  return client;
}

function publicBase(): string {
  return (process.env.S3_PUBLIC_BASE_URL as string).replace(/\/$/, "");
}

/** 上传并返回公开访问 URL。文件名含时间戳随机串，天然不可变，缓存设一年。 */
export async function putImage(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${publicBase()}/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })
  );
}

/** 列出 images/ 前缀下全部对象（分页拉全）。 */
export async function listImages(): Promise<StoredImage[]> {
  const items: StoredImage[] = [];
  let token: string | undefined;
  do {
    const res = await getClient().send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix: "images/",
        ContinuationToken: token,
      })
    );
    for (const obj of res.Contents || []) {
      if (!obj.Key) continue;
      const rel = obj.Key.replace(/^images\//, "");
      const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
      items.push({
        url: `${publicBase()}/${obj.Key}`,
        name: rel.slice(rel.lastIndexOf("/") + 1),
        dir,
        size: obj.Size ?? 0,
        mtime: obj.LastModified ? obj.LastModified.getTime() : 0,
      });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return items;
}

/** 从公开 URL 反解出对象 Key；非本桶 URL 返回 null（调用方走本地删除）。 */
export function keyFromUrl(url: string): string | null {
  if (!s3Configured()) return null;
  const base = publicBase() + "/";
  return url.startsWith(base) ? url.slice(base.length) : null;
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run type-check`
Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add lib/storage.ts
git commit -m "feat(media): S3 兼容对象存储封装（put/list/delete，未配置自动判停）"
```

### Task 10: 改造上传接口（sharp 压缩 + 双模式）

**Files:**
- Modify: `app/api/upload/route.ts`

- [ ] **Step 1: 文件顶部新增 import 与压缩函数**（`slugify`、常量等其余部分保持不变）

```ts
import sharp from "sharp";
import { putImage, s3Configured } from "../../../lib/storage";

const MAX_WIDTH = 1920;

// gif 可能是动图（sharp 默认只取首帧），原样保留；其余统一限宽 1920 并转 webp。
async function optimizeImage(
  buffer: Buffer,
  ext: string
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  if (ext === "gif") return { buffer, ext: "gif", contentType: "image/gif" };
  const image = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  if (meta.width && meta.width > MAX_WIDTH) {
    image.resize({ width: MAX_WIDTH });
  }
  const out = await image.webp({ quality: 82 }).toBuffer();
  return { buffer: out, ext: "webp", contentType: "image/webp" };
}
```

- [ ] **Step 2: 重写 `POST` 的落盘段**。把现有「`let uploadDir: string;` 声明之后直到 `return NextResponse.json({ success: true, url })`」整段替换为：

```ts
    // 先压缩再决定最终扩展名
    const optimized = await optimizeImage(buffer, ext);

    let uploadDir: string;
    let baseName: string;

    if (type === "column-bg") {
      uploadDir = "column-bg";
      baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    } else if (type === "avatar") {
      uploadDir = "avatar";
      baseName = "avatar";
    } else if (type === "theme-bg") {
      uploadDir = "theme-bg";
      baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    } else if (type === "blog") {
      const category = (formData.get("category") as string) || "未分类";
      const articleTitle = (formData.get("articleTitle") as string) || "草稿";
      uploadDir = `blog/${slugify(category)}/${slugify(articleTitle)}`;
      baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    } else {
      uploadDir = "uploads";
      baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    const fileName = `${baseName}.${optimized.ext}`;

    // avatar/theme-bg 是站点门面资源（avatar 还是固定文件名，与 CDN 一年缓存冲突），
    // 始终留在本地 public/；文章图、通用上传、专栏背景在配置了对象存储时上桶。
    const useS3 =
      s3Configured() && (type === "blog" || type === "uploads" || type === "column-bg");

    if (useS3) {
      const key = `images/${uploadDir}/${fileName}`;
      const url = await putImage(key, optimized.buffer, optimized.contentType);
      return NextResponse.json({ success: true, url });
    }

    const dirPath = path.join(process.cwd(), "public/images", uploadDir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(path.join(dirPath, fileName), optimized.buffer);
    const url = `/images/${uploadDir}/${fileName}`;
    return NextResponse.json({ success: true, url });
```

> 注意：原代码里 `uploadDir` 用 `path.join` 拼接（Windows 兼容），新代码统一用 `/` 字面量拼接，S3 Key 与本地路径都适用（部署环境是 Linux），原来最后那行 `path.sep` 转换逻辑随之删除。

- [ ] **Step 3: 类型检查 + dev 手测本地回退模式**

```bash
npm run type-check
npm run dev
```

不配置 S3 环境变量，在后台编辑器上传一张 >2000px 的 png。
Expected: 返回 `/images/...webp` 本地 URL；落盘文件为 webp 且宽度 1920。验证命令：

```bash
node -e "
const sharp = require('sharp');
const f = process.argv[1];
sharp(f).metadata().then(m => console.log(m.format, m.width));
" public/images/uploads/<刚上传的文件>
```

Expected: `webp 1920`

- [ ] **Step 4: 配置 S3 环境变量后手测上桶模式**

`.env.local` 填入真实桶配置，重启 dev，再传一张图。
Expected: 返回 `https://<S3_PUBLIC_BASE_URL>/images/uploads/....webp`，浏览器直接打开该 URL 能看到图片，响应头含 `cache-control: public, max-age=31536000, immutable`。

- [ ] **Step 5: Commit**

```bash
git add app/api/upload/route.ts
git commit -m "feat(media): 上传改走对象存储（本地回退）+ sharp 限宽转 webp"
```

### Task 11: 改造媒体库接口（S3 + 本地合并列出，双模式删除）

**Files:**
- Modify: `app/api/admin/media/route.ts`

- [ ] **Step 1: 顶部新增 import**

```ts
import {
  deleteImage,
  keyFromUrl,
  listImages,
  s3Configured,
} from "../../../../lib/storage";
```

- [ ] **Step 2: `GET` 替换为（本地 `walk` 函数与 `MediaItem` 类型保留不动，`MediaItem` 与 `StoredImage` 字段相同）**

```ts
export async function GET() {
  const items: MediaItem[] = [];
  // 本地遗留文件（avatar/theme-bg 及未迁移历史图）
  if (fs.existsSync(IMAGES_ROOT)) {
    walk(IMAGES_ROOT, items);
  }
  // 对象存储中的文件
  if (s3Configured()) {
    try {
      items.push(...(await listImages()));
    } catch (err) {
      console.error("[media] 列出对象存储失败:", err);
    }
  }
  items.sort((a, b) => b.mtime - a.mtime);
  return NextResponse.json(items);
}
```

- [ ] **Step 3: `DELETE` 在现有本地删除逻辑**之前**插入 S3 分支**（拿到 `url` 并完成基本字符串校验后）：

```ts
    // 对象存储 URL：走 S3 删除
    const s3Key = typeof url === "string" ? keyFromUrl(url) : null;
    if (s3Key) {
      if (!IMAGE_EXTS.has(path.extname(s3Key).toLowerCase())) {
        return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
      }
      await deleteImage(s3Key);
      return NextResponse.json({ success: true });
    }
```

> 原有 `/images/` 本地路径校验和删除逻辑原样保留，作为 fallback 分支。

- [ ] **Step 4: 验证**

```bash
npm run type-check && npm run lint
```

dev 模式打开后台「媒体库」：
Expected: 同时能看到本地旧图与桶里新传的图；删除一张桶内图片成功且列表刷新后消失；删除一张本地旧图同样正常。

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/media/route.ts
git commit -m "feat(media): 媒体库合并展示对象存储与本地文件，删除按 URL 分流"
```

### Task 12: remotePatterns、存量图片迁移与上线

**Files:**
- Modify: `next.config.mjs`
- Create: `scripts/migrate-images-to-s3.ts`
- Modify: `package.json`

- [ ] **Step 1: `next.config.mjs` 把 CDN 域名加入 remotePatterns**（Next 在加载配置前已注入 .env.local）。在文件顶部加：

```js
const s3Host = process.env.S3_PUBLIC_BASE_URL
  ? new URL(process.env.S3_PUBLIC_BASE_URL).hostname
  : null;
```

`images.remotePatterns` 数组追加：

```js
...(s3Host ? [{ protocol: "https", hostname: s3Host }] : []),
```

- [ ] **Step 2: 创建 `scripts/migrate-images-to-s3.ts`**

```ts
/**
 * 存量图片迁移：public/images/{uploads,blog,column-bg} → 对象存储，
 * 并重写 content/ 下所有 .md/.mdx/.yaml 中的 /images/... 引用为 CDN URL。
 * 默认 dry-run 只打印计划；加 --apply 才真正执行。本地原文件保留，人工验证后再删。
 * 用法：npm run migrate:images [-- --apply]
 */
import fs from "fs";
import path from "path";
import { putImage, s3Configured } from "../lib/storage";

const MIGRATE_DIRS = ["uploads", "blog", "column-bg"];
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp"]);
const CONTENT_EXTS = new Set([".md", ".mdx", ".yaml", ".yml"]);
const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
};

const apply = process.argv.includes("--apply");
const root = process.cwd();
const imagesRoot = path.join(root, "public", "images");

function walkFiles(dir: string, filter: (f: string) => boolean, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, filter, out);
    else if (filter(full)) out.push(full);
  }
}

async function main(): Promise<void> {
  if (!s3Configured()) {
    console.error("S3 环境变量未配置完整，中止。");
    process.exit(1);
  }
  const base = (process.env.S3_PUBLIC_BASE_URL as string).replace(/\/$/, "");

  // 1. 收集并上传图片
  const files: string[] = [];
  for (const d of MIGRATE_DIRS) {
    walkFiles(
      path.join(imagesRoot, d),
      (f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()),
      files
    );
  }
  const mapping = new Map<string, string>(); // 旧本地 URL → 新 CDN URL
  for (const file of files) {
    const rel = path.relative(imagesRoot, file).split(path.sep).join("/");
    const key = `images/${rel}`;
    const newUrl = `${base}/${key}`;
    mapping.set(`/images/${rel}`, newUrl);
    if (apply) {
      const ext = path.extname(file).toLowerCase();
      await putImage(key, fs.readFileSync(file), CONTENT_TYPES[ext] || "application/octet-stream");
      console.log(`上传: ${key}`);
    } else {
      console.log(`[dry-run] 将上传: ${key} → ${newUrl}`);
    }
  }

  // 2. 重写 content/ 内引用
  const contentFiles: string[] = [];
  walkFiles(
    path.join(root, "content"),
    (f) => CONTENT_EXTS.has(path.extname(f).toLowerCase()),
    contentFiles
  );
  for (const file of contentFiles) {
    let text = fs.readFileSync(file, "utf-8");
    let hits = 0;
    for (const [oldUrl, newUrl] of mapping) {
      if (text.includes(oldUrl)) {
        hits += text.split(oldUrl).length - 1;
        text = text.split(oldUrl).join(newUrl);
      }
    }
    if (hits > 0) {
      if (apply) fs.writeFileSync(file, text, "utf-8");
      console.log(`${apply ? "改写" : "[dry-run] 将改写"}: ${path.relative(root, file)}（${hits} 处）`);
    }
  }

  console.log(`\n共 ${files.length} 个文件${apply ? "已迁移" : "待迁移（加 --apply 执行）"}。本地原文件未删除。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: `package.json` scripts 增加**

```json
"migrate:images": "tsx scripts/migrate-images-to-s3.ts"
```

- [ ] **Step 4: dry-run 核对清单后执行**

```bash
npm run migrate:images            # 检查打印的上传与改写清单
npm run migrate:images -- --apply
```

Expected: 列出的图片全部上传成功；引用了这些图的 content 文件被改写为 CDN URL。

- [ ] **Step 5: 全量验证 + 上线**

```bash
npm run test && npm run type-check && npm run lint && npm run build
git add next.config.mjs scripts/migrate-images-to-s3.ts package.json content
git commit -m "feat(media): 存量图片迁对象存储并改写内容引用"
```

服务器上：`.env.local` 配好同一套 S3 变量 → `git pull && ./deploy.sh` → 服务器上跑一次 `npm run migrate:images -- --apply`（迁移服务器上独有的、未进 git 的历史上传图）。

- [ ] **Step 6: 线上回归**

打开线上几篇文章页与后台媒体库：图片正常显示（URL 为 CDN 域名）、新上传走桶、旧图未 404。确认无误后（建议观察几天）再手动清理服务器 `public/images/uploads` 与 `public/images/blog` 下已迁移的本地文件。

---

# Phase 4 — 发布即提交（git-backed content）

> 前置依赖：Phase 2 已上线（analytics.json 不再弄脏工作区）。
> 前置（决策 D4，人工操作）：服务器生成 SSH Deploy Key 并加到 GitHub 仓库（勾选写权限）：
>
> ```bash
> ssh-keygen -t ed25519 -f ~/.ssh/blog_deploy -N "" -C "blog-deploy"
> cat ~/.ssh/blog_deploy.pub   # 粘贴到 GitHub → repo Settings → Deploy keys → Allow write access
> printf 'Host github.com\n  IdentityFile ~/.ssh/blog_deploy\n  IdentitiesOnly yes\n' >> ~/.ssh/config
> git remote set-url origin git@github.com:huweiastar/micro-ai-blog.git
> git ls-remote origin HEAD    # 验证：能输出 commit hash 即鉴权成功
> ```

### Task 13: 停止跟踪生成产物（避免污染自动提交）

**Files:**
- Modify: `.gitignore`

`public/search-index.json`、`sitemap.xml`、`rss.xml`、`knowledge-index.json` 由 prebuild 与 `lib/regenerate.ts` 自动生成，跟踪它们只会让每次构建/发文后工作区变脏（这也是之前「prebuild 重写 sitemap/rss 需还原」这个坑的根源）。

- [ ] **Step 1: `.gitignore` 末尾追加**

```gitignore
# 构建/发文时自动生成的产物（prebuild 与 lib/regenerate.ts 负责生成）
/public/search-index.json
/public/sitemap.xml
/public/rss.xml
/public/knowledge-index.json
```

- [ ] **Step 2: 移出跟踪并验证可再生**

```bash
git rm --cached public/search-index.json public/sitemap.xml public/rss.xml public/knowledge-index.json
npm run build   # prebuild 重新生成全部四个文件
ls -la public/search-index.json public/sitemap.xml public/rss.xml public/knowledge-index.json
```

Expected: build 成功，四个文件都在（由 prebuild 新生成）。

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: 生成产物（搜索索引/sitemap/rss/知识索引）移出 git 跟踪"
```

### Task 14: `lib/git-sync.ts` 与接入点

**Files:**
- Create: `lib/git-sync.ts`
- Modify: `lib/regenerate.ts:150-155`（`refreshAfterContentChange`）

- [ ] **Step 1: 创建 `lib/git-sync.ts`**

```ts
import { execFile } from "child_process";
import { promisify } from "util";

const run = promisify(execFile);

// 串行队列：并发保存文章时避免 git index.lock 冲突
let queue: Promise<void> = Promise.resolve();

/**
 * 内容变更后异步 git add/commit/push（fire-and-forget）。
 * 失败只记日志，绝不阻断发布主流程。
 * 环境开关：GIT_SYNC_DISABLED=1 完全关闭（本地开发建议开）；
 *          GIT_SYNC_PUSH=1 才推送远程（服务器开）。
 */
export function commitContentChange(message: string): void {
  if (process.env.GIT_SYNC_DISABLED === "1") return;
  queue = queue
    .then(() => doSync(message))
    .catch((err) => {
      console.error("[git-sync] 失败（不影响发布）:", err);
    });
}

async function doSync(message: string): Promise<void> {
  const cwd = process.cwd();
  await run("git", ["add", "content", "public/images"], { cwd });
  const { stdout } = await run(
    "git",
    ["status", "--porcelain", "content", "public/images"],
    { cwd }
  );
  if (!stdout.trim()) return; // 无实际变更（如重复保存）

  await run("git", ["commit", "-m", message], { cwd });

  if (process.env.GIT_SYNC_PUSH !== "1") return;
  try {
    // 先 rebase 远程（笔记本可能直接 push 过），失败则中止 rebase 并跳过本次 push
    await run("git", ["pull", "--rebase", "--autostash", "origin", "main"], { cwd });
  } catch (err) {
    await run("git", ["rebase", "--abort"], { cwd }).catch(() => undefined);
    console.error("[git-sync] rebase 失败，本次跳过 push（commit 已留在本地）:", err);
    return;
  }
  await run("git", ["push", "origin", "main"], { cwd });
}
```

- [ ] **Step 2: `lib/regenerate.ts` 接入**。顶部加 import：

```ts
import { commitContentChange } from "./git-sync";
```

`refreshAfterContentChange` 改为：

```ts
/** 内容变更后的统一刷新入口：重建产物 + 失效页面缓存 + git 自动提交。 */
export function refreshAfterContentChange(slug?: string) {
  const result = regenerateContentArtifacts();
  revalidateContentPaths(slug);
  commitContentChange(`chore(content): 后台更新 ${slug ?? "内容"}`);
  return result;
}
```

- [ ] **Step 3: 本地验证（不 push）**

`.env.local` 加 `GIT_SYNC_PUSH=0`（或不设），`npm run dev`，后台发一篇测试草稿，然后：

```bash
git log --oneline -2 && git status --short content
```

Expected: 最新 commit 为 `chore(content): 后台更新 <slug>`，content 目录干净。验证后 `git reset --hard HEAD~1` 撤掉测试提交、后台删除测试草稿。

- [ ] **Step 4: 全量验证**

```bash
npm run test && npm run type-check && npm run lint && npm run build
```

Expected: 全部通过。

- [ ] **Step 5: Commit**

```bash
git add lib/git-sync.ts lib/regenerate.ts
git commit -m "feat(content): 后台内容变更自动 git commit/push（串行队列+失败不阻断）"
```

- [ ] **Step 6: 服务器上线与端到端验证**

```bash
# 服务器：确认 git 身份与 Deploy Key 就绪（Task 14 前置）
git config user.name && git config user.email   # 为空则先 git config 设置
# .env.local 加 GIT_SYNC_PUSH=1
git pull && ./deploy.sh
```

线上后台改任意一篇文章保存，然后在**本地电脑** `git pull`：
Expected: 能拉到一条 `chore(content): 后台更新 <slug>` 的提交——从此线上写的文章自动具备异地副本与完整历史。

---

## 不在本计划范围内（后续可做）

- nginx 直接伺服 `/images/` 与 `/_next/static/`（Phase 3 完成后图片流量已走 CDN，收益变小）
- `regenerateContentArtifacts` 异步化（文章多了再做）
- 后台「最近 N 天访问趋势」图表（`page_view_events` 表已铺垫）
- 媒体库删除前检查 content 内引用，防止文章图 404
- 删除自制修订快照 `data/revisions`（git-sync 稳定后，见 D6）

## 整体回滚策略

- Phase 1：`crontab -e` 删掉该行即可。
- Phase 2：回滚代码后旧实现继续读写 JSON 文件（迁移期间 JSON 未删除，数字停留在迁移时刻）。
- Phase 3：上传接口回滚后新图回落本地；已上桶的图 URL 写在 content 里仍可访问（桶不删即不失效）。
- Phase 4：去掉 `refreshAfterContentChange` 里一行调用即可；已产生的 commit 无需处理。
