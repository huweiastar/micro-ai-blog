/**
 * rehype 插件：把文本中的 ==高亮== 语法转换为 <mark> 元素。
 *
 * remark-gfm 不支持 ==…==，编辑器工具栏的「高亮」按钮产出的语法
 * 在这里落地渲染。跳过 code/pre/script/style，避免改写代码示例。
 * 纯手写 hast 遍历，无额外依赖（与 rehype-callouts 同风格）。
 */

interface HNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

const SKIP_TAGS = new Set(["code", "pre", "script", "style"]);

const MARK_PATTERN = /==([^=\n][^=\n]*?)==/g;

/** 把一个文本节点按 ==…== 切分为文本/<mark> 节点序列；无命中返回 null。 */
function splitTextNode(text: string): HNode[] | null {
  MARK_PATTERN.lastIndex = 0;
  if (!MARK_PATTERN.test(text)) return null;
  MARK_PATTERN.lastIndex = 0;

  const out: HNode[] = [];
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = MARK_PATTERN.exec(text)) !== null) {
    if (m.index > cursor) {
      out.push({ type: "text", value: text.slice(cursor, m.index) });
    }
    out.push({
      type: "element",
      tagName: "mark",
      properties: {},
      children: [{ type: "text", value: m[1] }],
    });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) {
    out.push({ type: "text", value: text.slice(cursor) });
  }
  return out;
}

function walk(node: HNode): void {
  if (!node.children) return;
  if (node.tagName && SKIP_TAGS.has(node.tagName)) return;

  const next: HNode[] = [];
  for (const child of node.children) {
    if (child.type === "text" && typeof child.value === "string") {
      const replaced = splitTextNode(child.value);
      if (replaced) {
        next.push(...replaced);
        continue;
      }
    } else {
      walk(child);
    }
    next.push(child);
  }
  node.children = next;
}

export function rehypeMark() {
  return (tree: unknown) => {
    walk(tree as HNode);
  };
}
