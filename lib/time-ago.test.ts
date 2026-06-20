import { describe, it, expect } from "vitest";
import { timeAgo } from "./utils";

describe("timeAgo", () => {
  const now = new Date("2026-06-20T12:00:00Z").getTime();
  it("一分钟内→刚刚", () => {
    expect(timeAgo("2026-06-20T11:59:30Z", now)).toBe("刚刚");
  });
  it("分钟级", () => {
    expect(timeAgo("2026-06-20T11:30:00Z", now)).toBe("30 分钟前");
  });
  it("小时级", () => {
    expect(timeAgo("2026-06-20T09:00:00Z", now)).toBe("3 小时前");
  });
  it("超过一天→年.月.日", () => {
    expect(timeAgo("2026-06-18T09:00:00Z", now)).toBe("2026.06.18");
  });
});
