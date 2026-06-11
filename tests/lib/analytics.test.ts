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
  delete process.env.BLOG_DB_PATH;
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
