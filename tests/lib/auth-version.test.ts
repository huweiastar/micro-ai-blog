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
