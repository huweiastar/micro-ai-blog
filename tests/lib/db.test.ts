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
