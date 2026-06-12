import { describe, expect, it } from "vitest";
import {
  isAssistAction,
  clampAssistInput,
  buildAssistMessages,
  pickLinkSuggestions,
} from "../../lib/assistant/editor-assist";
import type { KnowledgeChunk } from "../../lib/assistant/types";

describe("isAssistAction", () => {
  it("接受四种合法动作", () => {
    for (const action of ["polish", "expand", "simplify", "summarize"]) {
      expect(isAssistAction(action)).toBe(true);
    }
  });

  it("拒绝非法值", () => {
    expect(isAssistAction("links")).toBe(false);
    expect(isAssistAction("")).toBe(false);
    expect(isAssistAction(123)).toBe(false);
    expect(isAssistAction(undefined)).toBe(false);
  });
});

describe("clampAssistInput", () => {
  it("选区类动作截断到 6000 字", () => {
    const long = "a".repeat(7000);
    expect(clampAssistInput("polish", long).length).toBe(6000);
  });

  it("摘要动作截断到 16000 字", () => {
    const long = "a".repeat(20000);
    expect(clampAssistInput("summarize", long).length).toBe(16000);
  });

  it("短文本原样返回", () => {
    expect(clampAssistInput("expand", "短文本")).toBe("短文本");
  });
});

describe("buildAssistMessages", () => {
  it("各动作返回非空 system/user", () => {
    for (const action of ["polish", "expand", "simplify", "summarize"] as const) {
      const { system, user } = buildAssistMessages(action, "测试文本");
      expect(system.length).toBeGreaterThan(10);
      expect(user).toContain("测试文本");
    }
  });

  it("提供文章标题时拼入上下文", () => {
    const { user } = buildAssistMessages("polish", "正文", "我的文章标题");
    expect(user).toContain("我的文章标题");
  });
});

function chunk(partial: Partial<KnowledgeChunk>): KnowledgeChunk {
  return {
    id: partial.id || "id",
    sourceType: partial.sourceType || "blog",
    title: partial.title || "标题",
    content: partial.content || "内容",
    ...partial,
  };
}

describe("pickLinkSuggestions", () => {
  it("只保留有 url+slug 的 blog 块并按 slug 去重", () => {
    const chunks = [
      chunk({ id: "1", slug: "a", url: "/blog/a", title: "A" }),
      chunk({ id: "2", slug: "a", url: "/blog/a", title: "A-dup" }),
      chunk({ id: "3", slug: "b", url: "/blog/b", title: "B" }),
      chunk({ id: "4", sourceType: "project", slug: "p", url: "/projects/p" }),
      chunk({ id: "5", slug: "c" }), // 无 url
    ];
    const links = pickLinkSuggestions(chunks);
    expect(links.map((l) => l.slug)).toEqual(["a", "b"]);
  });

  it("排除当前文章并遵守 limit", () => {
    const chunks = Array.from({ length: 8 }, (_, i) =>
      chunk({ id: String(i), slug: `s${i}`, url: `/blog/s${i}`, title: `T${i}` })
    );
    const links = pickLinkSuggestions(chunks, "s0", 3);
    expect(links.length).toBe(3);
    expect(links.some((l) => l.slug === "s0")).toBe(false);
  });
});
