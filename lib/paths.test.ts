import { describe, it, expect, afterEach } from "vitest";
import path from "path";
import { contentDir, dataDir } from "./paths";

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
