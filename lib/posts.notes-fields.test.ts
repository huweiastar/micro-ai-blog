import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import { extractMomentFields } from "./posts";

describe("说说 frontmatter 字段", () => {
  it("透传 mood / images / location", () => {
    const { data } = matter(
      [
        "---",
        "type: note",
        "mood: 思考",
        "location: 北京",
        "images:",
        "  - /a.jpg",
        "  - /b.jpg",
        "---",
        "正文",
      ].join("\n")
    );
    expect(extractMomentFields(data)).toEqual({
      mood: "思考",
      location: "北京",
      images: ["/a.jpg", "/b.jpg"],
    });
  });

  it("缺省时全部为 undefined/空", () => {
    const { data } = matter(["---", "type: note", "---", "x"].join("\n"));
    expect(extractMomentFields(data)).toEqual({
      mood: undefined,
      location: undefined,
      images: [],
    });
  });
});
