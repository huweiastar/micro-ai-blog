# Wave S 安全加固 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复登录暴力破解、会话密钥派生与吊销、安全响应头三个安全缺口，并把 vitest 接入 CI。

**Architecture:** 纯 token 逻辑抽到 `lib/session-token.ts`（Node crypto，可单测）；会话版本号与登录限流落 SQLite（`lib/db.ts` 既有单例）；middleware（edge runtime，读不了 SQLite）通过内部 fetch `/api/auth/version`（60s 缓存）做版本校验，取不到时 fail-open 只验签名。安全头放 `next.config.mjs` 的 `headers()`，CSP 先 Report-Only。

**Tech Stack:** Next.js 14 App Router、better-sqlite3、vitest、node:crypto / Web Crypto（middleware）。

**环境纪律（执行前必读）：**
- 本目录即生产。`npm run build` 验证必须带 `NEXT_DIST_DIR=.next.verify`，绝不能动 `.next`。
- dev 预览用 `NEXT_DIST_DIR=.next.dev PORT=3001 npm run dev`，3000 是生产 next-server 勿杀。
- prebuild 会重写 `public/{sitemap.xml,rss.xml,knowledge-index.json,search-index.json}` 和 tsconfig.json（自动加 `.next.*/types` 行），**commit 前 `git checkout` 还原这些文件**。
- token 格式从三段改四段：上线后现有登录会话全部失效一次，属预期（单用户，重新登录即可）。

---

## Task 1: 纯 token 签发/校验模块（lib/session-token.ts）

**Files:**
- Create: `lib/session-token.ts`
- Test: `tests/lib/session-token.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/session-token.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signToken, verifyToken, SESSION_MAX_AGE } from "../../lib/session-token";

beforeEach(() => {
  process.env.SESSION_SECRET = "a".repeat(48);
});

afterEach(() => {
  delete process.env.SESSION_SECRET;
  delete process.env.ADMIN_PASSWORD;
});

describe("signToken / verifyToken", () => {
  it("签发的 token 验证通过且带回版本号", () => {
    const token = signToken(3);
    expect(verifyToken(token)).toEqual({ valid: true, version: 3 });
  });

  it("篡改任一段都验证失败", () => {
    const token = signToken(1);
    const parts = token.split(".");
    for (let i = 0; i < 4; i++) {
      const tampered = [...parts];
      tampered[i] = i === 3 ? "0".repeat(64) : "zz" + tampered[i];
      expect(verifyToken(tampered.join(".")).valid).toBe(false);
    }
  });

  it("过期 token 验证失败", () => {
    const issued = Date.now() - (SESSION_MAX_AGE * 1000 + 1000);
    const token = signToken(1, issued);
    expect(verifyToken(token).valid).toBe(false);
  });

  it("换密钥后旧 token 失效", () => {
    const token = signToken(1);
    process.env.SESSION_SECRET = "b".repeat(48);
    expect(verifyToken(token).valid).toBe(false);
  });

  it("旧三段式 token 一律拒绝", () => {
    expect(verifyToken("abc.def.ghi").valid).toBe(false);
  });

  it("未配置 SESSION_SECRET 时回退到密码派生密钥", () => {
    delete process.env.SESSION_SECRET;
    process.env.ADMIN_PASSWORD = "pw";
    const token = signToken(1);
    expect(verifyToken(token).valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/session-token.test.ts`
Expected: FAIL —— `Cannot find module '../../lib/session-token'`

- [ ] **Step 3: Write implementation**

```ts
// lib/session-token.ts
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // seconds

/**
 * 会话签名密钥：优先用独立的 SESSION_SECRET（≥32 字符）。
 * 未配置时回退到旧的 sha256(ADMIN_PASSWORD) 派生方式以兼容存量部署——
 * 但那样密码强度直接决定 token 可伪造性，应尽快配置独立密钥。
 */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (secret) {
    console.warn("[auth] SESSION_SECRET 过短（<32 字符），已回退到密码派生密钥");
  }
  return createHash("sha256").update(process.env.ADMIN_PASSWORD || "").digest("hex");
}

/** token 格式 v2：`版本36.随机payload.签发时间36.HMAC签名`，签名覆盖前三段 */
export function signToken(version: number, now = Date.now()): string {
  const head = `${version.toString(36)}.${randomBytes(32).toString("hex")}.${now.toString(36)}`;
  const sig = createHmac("sha256", getSessionSecret()).update(head).digest("hex");
  return `${head}.${sig}`;
}

export function verifyToken(
  token: string,
  now = Date.now()
): { valid: boolean; version: number } {
  const invalid = { valid: false, version: 0 };
  const parts = token.split(".");
  if (parts.length !== 4) return invalid;

  const [v36, payload, ts36, sig] = parts;
  const expected = createHmac("sha256", getSessionSecret())
    .update(`${v36}.${payload}.${ts36}`)
    .digest("hex");
  if (sig.length !== expected.length) return invalid;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return invalid;
    }
  } catch {
    return invalid;
  }

  const issuedAt = parseInt(ts36, 36);
  if (isNaN(issuedAt) || now - issuedAt > SESSION_MAX_AGE * 1000) return invalid;

  const version = parseInt(v36, 36);
  if (isNaN(version)) return invalid;

  return { valid: true, version };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/session-token.test.ts`
Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
git add lib/session-token.ts tests/lib/session-token.test.ts
git commit -m "feat(auth): token 签发/校验抽为独立模块，支持 SESSION_SECRET 与版本号"
```

---

## Task 2: 会话版本号存储（SQLite auth_kv）

**Files:**
- Modify: `lib/db.ts`（migrate() 函数末尾加两张表）
- Create: `lib/auth-version.ts`
- Test: `tests/lib/auth-version.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/auth-version.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { closeDb } from "../../lib/db";
import { getSessionVersion, bumpSessionVersion } from "../../lib/auth-version";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blogdb-"));
  process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
});

afterEach(() => {
  closeDb();
  delete process.env.BLOG_DB_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("auth-version", () => {
  it("默认版本为 1", () => {
    expect(getSessionVersion()).toBe(1);
  });

  it("bump 后版本 +1 且持久化", () => {
    expect(bumpSessionVersion()).toBe(2);
    expect(getSessionVersion()).toBe(2);
    expect(bumpSessionVersion()).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/auth-version.test.ts`
Expected: FAIL —— `Cannot find module '../../lib/auth-version'`

- [ ] **Step 3: 在 lib/db.ts 的 migrate() SQL 末尾（like_voters 表之后）追加两张表**

```sql
    -- 会话版本号等认证状态（key-value）。版本号 +1 = 吊销所有已签发会话
    CREATE TABLE IF NOT EXISTS auth_kv (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    -- 登录失败计数与锁定（ip='__global__' 行为全局滑动窗口计数）
    CREATE TABLE IF NOT EXISTS login_attempts (
      ip           TEXT PRIMARY KEY,
      fail_count   INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0,
      window_start INTEGER NOT NULL DEFAULT 0
    );
```

- [ ] **Step 4: Write lib/auth-version.ts**

```ts
// lib/auth-version.ts
import { getDb } from "./db";

/**
 * 会话版本号：签发 token 时嵌入当前版本，校验时要求一致。
 * 「退出所有设备」= 版本 +1，所有旧 token 立即失效（middleware 侧有 ≤60s 缓存延迟）。
 */
export function getSessionVersion(): number {
  const row = getDb()
    .prepare("SELECT value FROM auth_kv WHERE key = 'session_version'")
    .get() as { value: string } | undefined;
  return row ? parseInt(row.value, 10) : 1;
}

export function bumpSessionVersion(): number {
  const next = getSessionVersion() + 1;
  getDb()
    .prepare(
      `INSERT INTO auth_kv (key, value) VALUES ('session_version', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(String(next));
  return next;
}
```

- [ ] **Step 5: Run tests to verify they pass（含 db 表存在性回归）**

Run: `npx vitest run tests/lib/auth-version.test.ts tests/lib/db.test.ts`
Expected: 全部 passed

- [ ] **Step 6: Commit**

```bash
git add lib/db.ts lib/auth-version.ts tests/lib/auth-version.test.ts
git commit -m "feat(auth): SQLite 存储会话版本号，支持吊销所有已签发会话"
```

---

## Task 3: 登录限流（lib/login-guard.ts）

**Files:**
- Create: `lib/login-guard.ts`
- Test: `tests/lib/login-guard.test.ts`

策略：单 IP 前 4 次失败免锁；第 5 次起指数退避锁定 60s→120s→240s…封顶 1h。全局（跨 IP）1 小时滑动窗口内失败 ≥50 次 → 全局锁 10 分钟（防分布式低速爆破）。登录成功清零该 IP。

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/login-guard.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { closeDb } from "../../lib/db";
import {
  checkLoginAllowed,
  recordLoginFailure,
  recordLoginSuccess,
} from "../../lib/login-guard";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blogdb-"));
  process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
});

afterEach(() => {
  closeDb();
  delete process.env.BLOG_DB_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("login-guard 单 IP", () => {
  it("前 4 次失败不锁定", () => {
    for (let i = 0; i < 4; i++) recordLoginFailure("1.2.3.4");
    expect(checkLoginAllowed("1.2.3.4").allowed).toBe(true);
  });

  it("第 5 次失败锁定 60s，第 6 次翻倍", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) recordLoginFailure("1.2.3.4", now);
    const r1 = checkLoginAllowed("1.2.3.4", now);
    expect(r1.allowed).toBe(false);
    expect(r1.retryAfterSec).toBe(60);

    recordLoginFailure("1.2.3.4", now);
    const r2 = checkLoginAllowed("1.2.3.4", now);
    expect(r2.retryAfterSec).toBe(120);
  });

  it("锁定时长封顶 1 小时", () => {
    const now = 1_000_000;
    for (let i = 0; i < 30; i++) recordLoginFailure("1.2.3.4", now);
    expect(checkLoginAllowed("1.2.3.4", now).retryAfterSec).toBe(3600);
  });

  it("锁定到期后放行", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) recordLoginFailure("1.2.3.4", now);
    expect(checkLoginAllowed("1.2.3.4", now + 61_000).allowed).toBe(true);
  });

  it("登录成功清零计数", () => {
    for (let i = 0; i < 5; i++) recordLoginFailure("1.2.3.4");
    recordLoginSuccess("1.2.3.4");
    expect(checkLoginAllowed("1.2.3.4").allowed).toBe(true);
  });

  it("不同 IP 互不影响", () => {
    for (let i = 0; i < 5; i++) recordLoginFailure("1.2.3.4");
    expect(checkLoginAllowed("5.6.7.8").allowed).toBe(true);
  });
});

describe("login-guard 全局窗口", () => {
  it("1 小时内跨 IP 累计 50 次失败触发全局锁", () => {
    const now = 1_000_000;
    for (let i = 0; i < 50; i++) recordLoginFailure(`10.0.0.${i}`, now);
    const r = checkLoginAllowed("99.99.99.99", now);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSec).toBe(600);
  });

  it("窗口过期后全局计数重置", () => {
    const now = 1_000_000;
    for (let i = 0; i < 49; i++) recordLoginFailure(`10.0.0.${i}`, now);
    // 窗口（1h）过期后再失败一次，只算新窗口的第 1 次
    recordLoginFailure("10.0.1.1", now + 3_600_001);
    expect(checkLoginAllowed("99.99.99.99", now + 3_600_001).allowed).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/login-guard.test.ts`
Expected: FAIL —— `Cannot find module '../../lib/login-guard'`

- [ ] **Step 3: Write implementation**

```ts
// lib/login-guard.ts
import { getDb } from "./db";

const GLOBAL_KEY = "__global__";
const PER_IP_FREE_ATTEMPTS = 4; // 第 5 次失败开始锁定
const BASE_LOCK_MS = 60_000;
const MAX_LOCK_MS = 3_600_000;
const GLOBAL_WINDOW_MS = 3_600_000;
const GLOBAL_THRESHOLD = 50;
const GLOBAL_LOCK_MS = 600_000;

type AttemptRow = {
  ip: string;
  fail_count: number;
  locked_until: number;
  window_start: number;
};

function getRow(ip: string): AttemptRow | undefined {
  return getDb()
    .prepare("SELECT * FROM login_attempts WHERE ip = ?")
    .get(ip) as AttemptRow | undefined;
}

function upsertRow(row: AttemptRow): void {
  getDb()
    .prepare(
      `INSERT INTO login_attempts (ip, fail_count, locked_until, window_start)
       VALUES (@ip, @fail_count, @locked_until, @window_start)
       ON CONFLICT(ip) DO UPDATE SET
         fail_count = excluded.fail_count,
         locked_until = excluded.locked_until,
         window_start = excluded.window_start`
    )
    .run(row);
}

export function checkLoginAllowed(
  ip: string,
  now = Date.now()
): { allowed: boolean; retryAfterSec: number } {
  for (const key of [ip, GLOBAL_KEY]) {
    const row = getRow(key);
    if (row && row.locked_until > now) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil((row.locked_until - now) / 1000),
      };
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordLoginFailure(ip: string, now = Date.now()): void {
  // 单 IP：超过免费次数后指数退避
  const row = getRow(ip);
  const failCount = (row?.fail_count ?? 0) + 1;
  let lockedUntil = row?.locked_until ?? 0;
  if (failCount > PER_IP_FREE_ATTEMPTS) {
    const lockMs = Math.min(
      BASE_LOCK_MS * 2 ** (failCount - PER_IP_FREE_ATTEMPTS - 1),
      MAX_LOCK_MS
    );
    lockedUntil = now + lockMs;
  }
  upsertRow({
    ip,
    fail_count: failCount,
    locked_until: lockedUntil,
    window_start: row?.window_start ?? now,
  });

  // 全局：滑动小时窗，防止换 IP 低速爆破
  const g = getRow(GLOBAL_KEY);
  const windowExpired = !g || now - g.window_start > GLOBAL_WINDOW_MS;
  const gCount = windowExpired ? 1 : g.fail_count + 1;
  upsertRow({
    ip: GLOBAL_KEY,
    fail_count: gCount,
    locked_until: gCount >= GLOBAL_THRESHOLD ? now + GLOBAL_LOCK_MS : (g?.locked_until ?? 0),
    window_start: windowExpired ? now : g.window_start,
  });
}

export function recordLoginSuccess(ip: string): void {
  getDb().prepare("DELETE FROM login_attempts WHERE ip = ?").run(ip);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/login-guard.test.ts`
Expected: 8 passed

- [ ] **Step 5: Commit**

```bash
git add lib/login-guard.ts tests/lib/login-guard.test.ts
git commit -m "feat(auth): 登录失败限流——单 IP 指数退避 + 全局滑动窗口"
```

---

## Task 4: 接线——auth.ts / 路由 / middleware / 前端表单

**Files:**
- Modify: `lib/auth.ts`（删除内部 token 函数，改用 session-token + 版本）
- Modify: `app/api/auth/login/route.ts`（限流接入）
- Modify: `app/api/auth/logout/route.ts`（`{all:true}` 吊销所有会话，需已登录）
- Create: `app/api/auth/version/route.ts`
- Modify: `middleware.ts`（密钥来源、四段 token、版本校验）
- Modify: `components/admin/Topbar.tsx`（「全部退出」按钮）
- Modify: `app/admin/login/LoginForm.client.tsx`（429 倒计时）
- Modify: `.env.example`（SESSION_SECRET 说明）

- [ ] **Step 1: 重写 lib/auth.ts**

```ts
// lib/auth.ts
import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { signToken, verifyToken, SESSION_MAX_AGE } from "./session-token";
import { getSessionVersion } from "./auth-version";

const COOKIE_NAME = "admin_session";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPasswordHash(inputHash: string, expectedHash: string): boolean {
  if (inputHash.length !== expectedHash.length) return false;
  return timingSafeEqual(Buffer.from(inputHash, "hex"), Buffer.from(expectedHash, "hex"));
}

export async function createSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = signToken(getSessionVersion());
  const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires,
    path: "/",
  });

  return true;
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return false;

  const result = verifyToken(sessionCookie.value);
  if (!result.valid) return false;
  // Node 侧实时校验版本（middleware 侧有 ≤60s 缓存，这里无延迟兜底）
  return result.version === getSessionVersion();
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME, SESSION_MAX_AGE };
```

注意：`cookies()` 在 Next 14 是同步函数，原代码就 `await` 了它（无害），保持原样即可。

- [ ] **Step 2: Create app/api/auth/version/route.ts**

```ts
// app/api/auth/version/route.ts
import { NextResponse } from "next/server";
import { getSessionVersion } from "../../../../lib/auth-version";

// middleware（edge runtime）读不了 SQLite，通过本接口间接读会话版本号。
// 版本号只是个计数器，不泄露敏感信息，公开可读。
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ v: getSessionVersion() });
}
```

- [ ] **Step 3: 重写 app/api/auth/login/route.ts**

```ts
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSession, hashPassword, verifyPasswordHash } from "../../../../lib/auth";
import {
  checkLoginAllowed,
  recordLoginFailure,
  recordLoginSuccess,
} from "../../../../lib/login-guard";

function clientIp(req: NextRequest): string {
  // nginx 反代设置了 X-Forwarded-For（见 scripts/nginx.conf），取第一跳
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);

    const gate = checkLoginAllowed(ip);
    if (!gate.allowed) {
      return NextResponse.json(
        { error: "尝试次数过多，请稍后再试", retryAfter: gate.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "请输入密码" }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: "管理员密码未配置" }, { status: 500 });
    }

    if (!verifyPasswordHash(hashPassword(password), hashPassword(adminPassword))) {
      recordLoginFailure(ip);
      console.warn(`[auth] 登录失败 ip=${ip}`);
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    recordLoginSuccess(ip);
    await createSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "登录失败，请稍后重试" }, { status: 500 });
  }
}
```

- [ ] **Step 4: 重写 app/api/auth/logout/route.ts**

```ts
// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../../lib/auth";
import { bumpSessionVersion } from "../../../../lib/auth-version";

export async function POST(req: NextRequest) {
  // {all:true} = 吊销所有设备的会话。必须已登录才允许，
  // 否则任何人都能把管理员从所有设备踢下线。
  let all = false;
  try {
    const body = await req.json();
    all = body?.all === true;
  } catch {
    // 无 body 的普通退出
  }
  if (all && (await verifySession())) {
    bumpSessionVersion();
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return response;
}
```

- [ ] **Step 5: 修改 middleware.ts**

替换原 `verifyToken` 函数（middleware.ts:84-102），并在其上方加入密钥与版本工具：

```ts
async function getSessionSecretEdge(): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  return sha256Hex(process.env.ADMIN_PASSWORD || "");
}

// 会话版本：从 /api/auth/version 拉取并缓存 60s。middleware 是 edge runtime
// 读不了 SQLite，用内部 fetch 间接读；接口故障时沿用旧缓存或 fail-open
// （只验签名），避免把管理员锁在门外。该 fetch 不带 cookie，不会递归触发鉴权。
let cachedVersion: number | null = null;
let cachedAt = 0;

async function getCurrentSessionVersion(origin: string): Promise<number | null> {
  if (cachedVersion !== null && Date.now() - cachedAt < 60_000) return cachedVersion;
  try {
    const res = await fetch(`${origin}/api/auth/version`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.v === "number") {
        cachedVersion = data.v;
        cachedAt = Date.now();
      }
    }
  } catch {
    // 网络失败：保留旧缓存值
  }
  return cachedVersion;
}

async function verifyToken(token: string, origin: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [v36, payload, timestamp, signature] = parts;
  const secret = await getSessionSecretEdge();
  const expectedSignature = await hmacSha256Hex(secret, `${v36}.${payload}.${timestamp}`);

  if (!timingSafeEqualHex(signature, expectedSignature)) return false;

  const issuedAt = parseInt(timestamp, 36);
  if (isNaN(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE) return false;

  const tokenVersion = parseInt(v36, 36);
  if (isNaN(tokenVersion)) return false;
  const currentVersion = await getCurrentSessionVersion(origin);
  if (currentVersion !== null && tokenVersion !== currentVersion) return false;

  return true;
}
```

调用点（middleware 函数第一行附近）改为：

```ts
  const isAuthenticated =
    !!sessionCookie?.value &&
    (await verifyToken(sessionCookie.value, request.nextUrl.origin));
```

删除原先 `const secret = await sha256Hex(password);` 的密码派生逻辑（已被 `getSessionSecretEdge` 取代）。原 `verifyToken` 里的 `const password = process.env.ADMIN_PASSWORD; if (!password) return false;` 保护改为：`if (!process.env.SESSION_SECRET && !process.env.ADMIN_PASSWORD) return false;`。

- [ ] **Step 6: Topbar 加「全部退出」**

`components/admin/Topbar.tsx` 中 `handleLogout` 改为接受参数，按钮区改为两个按钮：

```tsx
  const handleLogout = async (all = false) => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all }),
    });
    router.push("/admin/login");
  };
```

```tsx
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleLogout(true)}
          title="使所有设备上的登录全部失效"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 transition-colors"
        >
          <ShieldOff className="w-4 h-4" /> 全部退出
        </button>
        <button
          onClick={() => handleLogout()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 transition-colors"
        >
          <LogOut className="w-4 h-4" /> 退出
        </button>
      </div>
```

import 行改为：`import { LogOut, Menu, ShieldOff } from "lucide-react";`

- [ ] **Step 7: LoginForm 429 倒计时**

`app/admin/login/LoginForm.client.tsx`：

新增 state 与倒计时 effect（放在现有 state 声明之后）：

```tsx
  const [lockSeconds, setLockSeconds] = useState(0);

  // 429 锁定倒计时
  useEffect(() => {
    if (lockSeconds <= 0) return;
    const t = setTimeout(() => setLockSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [lockSeconds]);
```

`handleSubmit` 中 `const data = await res.json();` 之后、`if (data.success)` 之前插入：

```tsx
      if (res.status === 429) {
        setLockSeconds(Number(data.retryAfter) || 60);
        setError("");
        setLoading(false);
        return;
      }
```

错误提示区之后（success 提示之前）插入锁定提示：

```tsx
            {lockSeconds > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-2">
                <span className="mt-0.5 text-xs">⏳</span>
                <span>尝试次数过多，请 {lockSeconds} 秒后再试</span>
              </div>
            )}
```

提交按钮 disabled 条件改为：

```tsx
              disabled={loading || success || lockSeconds > 0 || !password.trim()}
```

- [ ] **Step 8: .env.example 补 SESSION_SECRET**

在 `ADMIN_PASSWORD` 块之后插入：

```
# 会话签名密钥（独立于密码，≥32 字符随机串；生成：openssl rand -hex 32）
# 不配置时回退到由 ADMIN_PASSWORD 派生（不安全，仅作兼容）
SESSION_SECRET=
```

- [ ] **Step 9: 本地验证（dev 3001）**

```bash
npm run type-check && npm run lint && npm test
# 给生产 env 配真实密钥（本目录即生产；dev 共用 .env.local）
grep -q SESSION_SECRET .env.local || echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env.local
NEXT_DIST_DIR=.next.dev PORT=3001 npm run dev &   # 起 dev 后逐项 curl
# 1) 错误密码 5 次 → 第 5 次后应 429 + Retry-After
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3001/api/auth/login -H 'content-type: application/json' -d '{"password":"wrong"}'; done
# 2) 正确密码登录拿 cookie → 访问受保护接口 200
# 3) POST /api/auth/logout {"all":true}（带 cookie）→ 旧 cookie 再访问受保护接口 401
# 4) GET /api/auth/version 返回 {"v":N}
```

Expected: 序列 401,401,401,401,429,429；登出全部后旧 cookie 失效。验证完 kill dev 进程（用 `ss -ltnp` 找 3001 的 pid，勿动 3000），还原 tsconfig.json / public 产物。

- [ ] **Step 10: Commit**

```bash
git add lib/auth.ts app/api/auth middleware.ts components/admin/Topbar.tsx app/admin/login/LoginForm.client.tsx .env.example
git commit -m "feat(auth): 登录限流接入 + SESSION_SECRET 独立密钥 + 会话版本吊销（全部退出）"
```

---

## Task 5: 安全响应头 + 主题脚本外置

**Files:**
- Create: `public/theme-init.js`
- Modify: `app/layout.tsx`（内联脚本 → 外链）
- Modify: `next.config.mjs`（headers()）
- Modify: `scripts/nginx.conf`（删 X-XSS-Protection）

- [ ] **Step 1: Create public/theme-init.js**

```js
// 首访默认暗色（写入 localStorage 供 next-themes 接管）。
// 外置成静态文件而非内联 <script>，为后续收紧 CSP（去 'unsafe-inline'）做准备。
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (!stored) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  } catch (e) {}
})();
```

- [ ] **Step 2: app/layout.tsx 替换内联脚本**

`<head>` 内的 `<script dangerouslySetInnerHTML={{...}} />` 整块替换为：

```tsx
        {/* 同步执行（不加 async/defer），保证首帧前完成暗色判定，避免闪白 */}
        <script src="/theme-init.js" />
```

- [ ] **Step 3: next.config.mjs 加 headers()**

在 `nextConfig` 对象中（`redirects()` 旁）加入：

```js
  async headers() {
    // CSP 先以 Report-Only 观察（违规仅在浏览器控制台报告，不拦截），
    // 稳定一周后把 key 切换为 Content-Security-Policy 正式启用。
    // script-src 暂保留 'unsafe-inline'：App Router 自身会注入内联 RSC 数据脚本，
    // 去掉它需要 nonce 方案，留待后续。
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://giscus.app",
      "style-src 'self' 'unsafe-inline' https://giscus.app",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://giscus.app",
      "frame-src https://giscus.app",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
```

- [ ] **Step 4: scripts/nginx.conf 删除已废弃头**

删除这一行（X-Frame-Options 与 X-Content-Type-Options 保留）：

```
    add_header X-XSS-Protection "1; mode=block";
```

注：服务器上实际生效的 nginx 配置需手动同步（用户人工待办，见计划末尾）。

- [ ] **Step 5: 验证**

```bash
npm run type-check && npm run lint
NEXT_DIST_DIR=.next.verify npm run build
# build 后还原 prebuild 重写的产物：
git checkout -- public/sitemap.xml public/rss.xml public/knowledge-index.json public/search-index.json 2>/dev/null
git diff --quiet tsconfig.json || git checkout -- tsconfig.json
```

Expected: build 成功；dev 3001 上 `curl -sI localhost:3001/ | grep -i -E "strict-transport|referrer|permissions|security-policy"` 能看到 4 个头；首页暗色无闪白。

- [ ] **Step 6: Commit**

```bash
git add public/theme-init.js app/layout.tsx next.config.mjs scripts/nginx.conf
git commit -m "feat(security): 安全响应头（HSTS/CSP Report-Only/Referrer/Permissions）+ 主题脚本外置"
```

---

## Task 6: CI 接入测试

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: 在 Type Check 步骤后加测试步骤，并删除冗余的 generate:search 步骤**

`Generate search index` 步骤删除（`npm run build` 的 prebuild 会重新生成）。在 `Type Check` 与 `Build` 之间插入：

```yaml
      - name: Test
        run: npm test
```

- [ ] **Step 2: 本地全量回归**

Run: `npm test && npm run type-check && npm run lint`
Expected: 全绿（此时测试文件应有 9 个：原 6 + 新 3）

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: 接入 vitest，移除冗余的搜索索引预生成步骤"
```

---

## 收尾

- [ ] 全量验证：`npm test && npm run type-check && npm run lint && NEXT_DIST_DIR=.next.verify npm run build`，还原 prebuild 产物后确认 `git status` 干净。
- [ ] 部署：`./deploy.sh`（用户确认后）。部署前确认 `.env.local` 已有 SESSION_SECRET。
- [ ] 上线后验证：公网 `curl -sI https://huweiastar.deepai.icu | grep -i strict-transport`；错误密码 5 次触发 429；重新登录后台正常。
- [ ] **用户人工待办**：
  1. 服务器 nginx 实际配置删掉 `X-XSS-Protection` 行（`sudo nginx -t && sudo systemctl reload nginx`）。
  2. 更换 ADMIN_PASSWORD 为强口令（现口令偏弱；改完后台重新登录即可）。
  3. 一周后观察浏览器控制台无 CSP 违规 → 把 `Content-Security-Policy-Report-Only` 改为 `Content-Security-Policy` 正式启用。
