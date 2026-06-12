import { describe, expect, it } from "vitest";
import { applyMarkdownInsert } from "../../components/admin/MarkdownEditor/utils";
import { rehypeMark } from "../../lib/rehype-mark";

describe("applyMarkdownInsert 包裹", () => {
  it("有选区时包裹选区", () => {
    const r = applyMarkdownInsert("hello world", 0, 5, "**", "**");
    expect(r.value).toBe("**hello** world");
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe("hello");
  });

  it("无选区时插入占位文字并选中", () => {
    const r = applyMarkdownInsert("", 0, 0, "**", "**", "粗体文字");
    expect(r.value).toBe("**粗体文字**");
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe("粗体文字");
  });
});

describe("applyMarkdownInsert 再次点击取消", () => {
  it("选区外侧已有标记时移除（不再套一层）", () => {
    // "**hello**" 中选中 hello（即点完按钮后的状态）
    const r = applyMarkdownInsert("**hello** world", 2, 7, "**", "**");
    expect(r.value).toBe("hello world");
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe("hello");
  });

  it("连同标记一起选中时剥掉标记", () => {
    const r = applyMarkdownInsert("**hello** world", 0, 9, "**", "**");
    expect(r.value).toBe("hello world");
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe("hello");
  });

  it("HTML 标签包裹同样可取消", () => {
    const r = applyMarkdownInsert("<u>下划线</u>", 3, 6, "<u>", "</u>");
    expect(r.value).toBe("下划线");
  });

  it("高亮 == 标记可取消", () => {
    const r = applyMarkdownInsert("a ==高亮== b", 4, 6, "==", "==");
    expect(r.value).toBe("a 高亮 b");
  });

  it("不同标记不会误判取消", () => {
    const r = applyMarkdownInsert("*hello* world", 1, 6, "**", "**");
    expect(r.value).toBe("***hello*** world");
  });
});

type HNode = {
  type: string;
  tagName?: string;
  value?: string;
  children?: HNode[];
};

function root(children: HNode[]): HNode {
  return { type: "root", children };
}

describe("rehypeMark", () => {
  it("把 ==文字== 转为 mark 元素", () => {
    const tree = root([
      { type: "element", tagName: "p", children: [{ type: "text", value: "前 ==重点== 后" }] },
    ]);
    rehypeMark()(tree);
    const p = tree.children![0];
    expect(p.children!.map((c) => c.type)).toEqual(["text", "element", "text"]);
    expect(p.children![1].tagName).toBe("mark");
    expect(p.children![1].children![0].value).toBe("重点");
  });

  it("代码块内不转换", () => {
    const tree = root([
      {
        type: "element",
        tagName: "pre",
        children: [
          { type: "element", tagName: "code", children: [{ type: "text", value: "a ==b== c" }] },
        ],
      },
    ]);
    rehypeMark()(tree);
    const code = tree.children![0].children![0];
    expect(code.children![0].value).toBe("a ==b== c");
  });

  it("无标记的文本原样保留", () => {
    const tree = root([
      { type: "element", tagName: "p", children: [{ type: "text", value: "普通 = 文本" }] },
    ]);
    rehypeMark()(tree);
    expect(tree.children![0].children![0].value).toBe("普通 = 文本");
  });
});
