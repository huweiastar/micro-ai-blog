import { describe, it, expect } from "vitest";
import { latestContentDate } from "../../lib/seo";

describe("latestContentDate", () => {
  it("returns the max of date/updated across posts", () => {
    const posts = [
      { date: "2024-01-01" },
      { date: "2024-05-01", updated: "2024-06-10" },
      { date: "2024-03-01" },
    ];
    expect(latestContentDate(posts).toISOString().slice(0, 10)).toBe("2024-06-10");
  });

  it("falls back when empty", () => {
    const fb = new Date("2020-01-01");
    expect(latestContentDate([], fb)).toBe(fb);
  });

  it("ignores unparseable dates", () => {
    const posts = [{ date: "not-a-date" }, { date: "2023-07-15" }];
    expect(latestContentDate(posts).toISOString().slice(0, 10)).toBe("2023-07-15");
  });
});
