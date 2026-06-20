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
