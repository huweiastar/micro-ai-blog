/**
 * rehype 插件：为每个代码块（rehype-pretty-code 产出的 <pre data-language>）
 * 在服务端预渲染顶部工具条（红黄绿圆点 + 语言标签 + 复制按钮）。
 *
 * 为什么放服务端：此前工具条由 CodeCopyButton 在客户端 useEffect/MutationObserver
 * 里注入，会在 React 水合窗口内改动 DOM，导致 dangerouslySetInnerHTML 节点
 * 出现 hydration mismatch（Server 带工具条 / Client 不带）。改为服务端渲染后
 * SSR HTML 与最终 DOM 一致，CodeCopyButton 退化为纯复制点击委托。
 *
 * 纯手写 hast 遍历，无额外依赖（与 rehype-callouts 同风格）。
 */

interface HNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

const el = (
  tagName: string,
  properties: Record<string, unknown>,
  children: HNode[] = []
): HNode => ({ type: "element", tagName, properties, children });

const dot = (bg: string): HNode =>
  el("span", {
    style: `width:10px;height:10px;border-radius:50%;background:${bg};display:inline-block;`,
  });

const copyIcon = (): HNode =>
  el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
    },
    [
      el("rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }),
      el("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }),
    ]
  );

function header(lang: string): HNode {
  return el("div", { className: ["code-block-header"] }, [
    el("div", { style: "display:flex;align-items:center;gap:5px;" }, [
      dot("#ff5f57"),
      dot("#febc2e"),
      dot("#28c840"),
    ]),
    el("div", { style: "display:flex;align-items:center;gap:6px;" }, [
      el("span", { className: ["code-lang-label"] }, [{ type: "text", value: lang }]),
      el("button", { type: "button", className: ["copy-code-btn"], title: "复制代码" }, [
        copyIcon(),
      ]),
    ]),
  ]);
}

function getLang(props: Record<string, unknown>): string | null {
  const raw = props["data-language"] ?? props.dataLanguage;
  return typeof raw === "string" && raw ? raw : null;
}

function alreadyHasHeader(node: HNode): boolean {
  return (node.children ?? []).some((c) => {
    const cls = c.properties?.className;
    return (
      c.type === "element" &&
      c.tagName === "div" &&
      Array.isArray(cls) &&
      cls.includes("code-block-header")
    );
  });
}

function walk(node: HNode): void {
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) {
    if (child.type === "element" && child.tagName === "pre") {
      const lang = getLang(child.properties ?? {});
      if (lang && !alreadyHasHeader(child)) {
        child.children = [header(lang), ...(child.children ?? [])];
      }
    }
    walk(child);
  }
}

export function rehypeCodeHeader() {
  return (tree: unknown): void => {
    walk(tree as HNode);
  };
}
