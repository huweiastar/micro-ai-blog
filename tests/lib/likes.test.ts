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
  delete process.env.BLOG_DB_PATH;
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
