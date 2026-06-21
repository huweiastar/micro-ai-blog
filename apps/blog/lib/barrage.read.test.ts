import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("fs", () => ({
  default: { readFileSync: vi.fn() },
}));

import fs from "fs";
import { readBarrage } from "./barrage";

const mockedRead = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.clearAllMocks());

describe("readBarrage", () => {
  it("文件缺失时回退 {enabled:false, items:[]}", () => {
    mockedRead.mockImplementation(() => {
      throw new Error("ENOENT");
    });
    expect(readBarrage()).toEqual({ enabled: false, items: [] });
  });

  it("正常 JSON 正确解析并清洗（去空行）", () => {
    mockedRead.mockReturnValue(JSON.stringify({ enabled: true, items: ["a", "  ", "b"] }));
    expect(readBarrage()).toEqual({ enabled: true, items: ["a", "b"] });
  });

  it("损坏 JSON 回退而非抛错", () => {
    mockedRead.mockReturnValue("{not valid json");
    expect(readBarrage()).toEqual({ enabled: false, items: [] });
  });
});
