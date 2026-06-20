/**
 * rehype 插件：将 GitHub 风格的提示块语法转换为样式化 callout。
 *
 *   > [!NOTE]
 *   > 正文内容
 *
 * 支持类型：NOTE / TIP / IMPORTANT / WARNING / CAUTION。
 * 纯手写 hast 遍历，无额外依赖。
 */

interface HNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

type CalloutType = "note" | "tip" | "important" | "warning" | "caution";

const LABELS: Record<CalloutType, string> = {
  note: "注记",
  tip: "提示",
  important: "重要",
  warning: "警告",
  caution: "注意",
};

const el = (tagName: string, properties: Record<string, unknown>, children: HNode[] = []): HNode => ({
  type: "element",
  tagName,
  properties,
  children,
});

const svgBase = {
  viewBox: "0 0 24 24",
  width: "16",
  height: "16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: ["callout-icon"],
  "aria-hidden": "true",
};

const path = (d: string): HNode => el("path", { d });
const line = (x1: number, y1: number, x2: number, y2: number): HNode =>
  el("line", { x1, y1, x2, y2 });
const circle = (cx: number, cy: number, r: number): HNode => el("circle", { cx, cy, r });

// Dot trick: a zero-length line with a round cap renders as a dot.
const dot = (x: number, y: number): HNode => line(x, y, x + 0.01, y);

function icon(type: CalloutType): HNode {
  switch (type) {
    case "tip":
      return el("svg", svgBase, [path("M12 3l1.9 5.8L19.8 10l-5.9 1.2L12 17l-1.9-5.8L4.2 10l5.9-1.2z")]);
    case "warning":
      return el("svg", svgBase, [
        path("M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"),
        line(12, 9, 12, 13),
        dot(12, 17),
      ]);
    case "caution":
      return el("svg", svgBase, [circle(12, 12, 10), line(12, 8, 12, 12), dot(12, 16)]);
    case "note":
    case "important":
    default:
      return el("svg", svgBase, [circle(12, 12, 10), line(12, 16, 12, 12), dot(12, 8)]);
  }
}

const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/i;

function transformBlockquote(bq: HNode): void {
  const children = bq.children ?? [];
  const firstEl = children.find((c) => c.type === "element");
  if (!firstEl || firstEl.tagName !== "p") return;

  const firstText = (firstEl.children ?? [])[0];
  if (!firstText || firstText.type !== "text" || typeof firstText.value !== "string") return;

  const match = firstText.value.match(MARKER);
  if (!match) return;

  const type = match[1].toLowerCase() as CalloutType;

  // Strip the marker; drop the lead paragraph entirely if it held only the marker.
  firstText.value = firstText.value.slice(match[0].length).replace(/^\n+/, "");
  if (firstText.value === "" && (firstEl.children ?? []).length === 1) {
    bq.children = children.filter((c) => c !== firstEl);
  }

  bq.properties = {
    ...(bq.properties ?? {}),
    className: ["callout", `callout-${type}`],
    "data-callout": type,
  };

  const title = el("div", { className: ["callout-title"] }, [
    icon(type),
    el("span", { className: ["callout-label"] }, [{ type: "text", value: LABELS[type] }]),
  ]);

  bq.children = [title, ...(bq.children ?? [])];
}

function walk(node: HNode): void {
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) {
    if (child.type === "element" && child.tagName === "blockquote") {
      transformBlockquote(child);
    }
    walk(child);
  }
}

export function rehypeCallouts() {
  return (tree: unknown): void => {
    walk(tree as HNode);
  };
}
