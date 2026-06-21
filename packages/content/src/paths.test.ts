import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import { contentDir, dataDir } from "./paths";

// 清掉运行器注入的 CONTENT_DIR/DATA_DIR，确保"默认值"用例确定性。
beforeEach(() => {
  delete process.env.CONTENT_DIR;
  delete process.env.DATA_DIR;
});
afterEach(() => {
  delete process.env.CONTENT_DIR;
  delete process.env.DATA_DIR;
});

describe("paths", () => {
  it("contentDir 默认 = cwd/content", () => {
    expect(contentDir()).toBe(path.join(process.cwd(), "content"));
  });
  it("dataDir 默认 = cwd/data", () => {
    expect(dataDir()).toBe(path.join(process.cwd(), "data"));
  });
  it("尊重 CONTENT_DIR 覆盖", () => {
    process.env.CONTENT_DIR = "/tmp/x/content";
    expect(contentDir()).toBe("/tmp/x/content");
  });
  it("尊重 DATA_DIR 覆盖", () => {
    process.env.DATA_DIR = "/tmp/x/data";
    expect(dataDir()).toBe("/tmp/x/data");
  });
});
