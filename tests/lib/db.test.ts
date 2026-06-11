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
  delete process.env.BLOG_DB_PATH;
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

  it("返回同一个单例实例", () => {
    expect(getDb()).toBe(getDb());
  });

  it("closeDb 后再次 getDb 得到新连接", () => {
    const a = getDb();
    closeDb();
    const b = getDb();
    expect(a).not.toBe(b);
  });
});
