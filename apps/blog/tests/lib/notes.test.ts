import { describe, expect, it } from "vitest";
import { deriveNoteTitle, deriveNoteSlug } from "../../lib/notes";

const CUSTOM_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("deriveNoteTitle", () => {
  it("取首行作为标题", () => {
    expect(deriveNoteTitle("今天学了 Rust 的所有权\n第二行内容")).toBe(
      "今天学了 Rust 的所有权"
    );
  });

  it("剥离 Markdown 标记", () => {
    expect(deriveNoteTitle("## 今天学了 **Rust** 的`所有权`")).toBe(
      "今天学了 Rust 的所有权"
    );
    expect(deriveNoteTitle("- [链接文字](https://example.com) 后缀")).toBe(
      "链接文字 后缀"
    );
  });

  it("超长时截断并加省略号", () => {
    const long = "一".repeat(60);
    const title = deriveNoteTitle(long, 40);
    expect(title.length).toBe(40);
    expect(title.endsWith("…")).toBe(true);
  });

  it("空内容回退默认标题", () => {
    expect(deriveNoteTitle("")).toBe("随手记");
    expect(deriveNoteTitle("   \n\n  ")).toBe("随手记");
  });

  it("跳过空首行取第一个非空行", () => {
    expect(deriveNoteTitle("\n\n第一个非空行\n更多")).toBe("第一个非空行");
  });
});

describe("deriveNoteSlug", () => {
  it("生成 note- 前缀的 36 进制时间戳 slug", () => {
    const ts = 1718180000000;
    expect(deriveNoteSlug(ts)).toBe(`note-${ts.toString(36)}`);
  });

  it("符合自定义 slug 规则", () => {
    expect(deriveNoteSlug()).toMatch(CUSTOM_SLUG_PATTERN);
  });
});
