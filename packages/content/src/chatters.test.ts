import { describe, it, expect } from "vitest";
import { getAllChattersSync, getChatterBySlug } from "./chatters";

describe("chatters loader", () => {
  it("读到示例并按日期倒序", () => {
    const list = getAllChattersSync();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("slug");
    expect(list[0]).toHaveProperty("title");
  });
  it("按 slug 取详情", () => {
    const list = getAllChattersSync();
    const one = getChatterBySlug(list[0].slug);
    expect(one?.title).toBe(list[0].title);
    expect(typeof one?.content).toBe("string");
  });
  it("不存在的 slug 返回 null", () => {
    expect(getChatterBySlug("nope-xxx")).toBeNull();
  });
});
