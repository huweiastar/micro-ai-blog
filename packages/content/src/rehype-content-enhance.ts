/**
 * rehype 插件：增强正文内容元素。纯手写 hast 遍历，无额外依赖
 * （与 rehype-callouts / rehype-mark 同风格）。
 *
 *  - <img>：注入 loading="lazy" + decoding="async"（懒加载、不阻塞解析）；
 *           外层无固定容器时由 CSS aspect-ratio 兜底，配合前端 lightbox 放大。
 *  - 外链 <a>（http/https 绝对地址）：加 target="_blank" + rel="noopener noreferrer"
 *           + class external-link（CSS 据此追加外链图标）。站内相对链接与锚点不变。
 */

interface HNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

function pushClass(props: Record<string, unknown>, cls: string): void {
  const existing = props.className;
  if (Array.isArray(existing)) {
    if (!existing.includes(cls)) existing.push(cls);
  } else if (typeof existing === "string") {
    props.className = existing.split(/\s+/).filter(Boolean).concat(cls);
  } else {
    props.className = [cls];
  }
}

function enhanceImg(node: HNode): void {
  node.properties = node.properties ?? {};
  if (node.properties.loading === undefined) node.properties.loading = "lazy";
  if (node.properties.decoding === undefined) node.properties.decoding = "async";
}

function enhanceAnchor(node: HNode): void {
  const props = (node.properties = node.properties ?? {});
  const href = typeof props.href === "string" ? props.href : "";
  if (!/^https?:\/\//i.test(href)) return; // 仅处理外部绝对链接
  // 已是 heading-anchor（autolink）等内部锚点不会进这里（href 以 # 开头）
  props.target = "_blank";
  props.rel = "noopener noreferrer";
  pushClass(props, "external-link");
}

function walk(node: HNode): void {
  if (node.type === "element") {
    if (node.tagName === "img") enhanceImg(node);
    else if (node.tagName === "a") enhanceAnchor(node);
  }
  if (node.children) {
    for (const child of node.children) walk(child);
  }
}

export function rehypeContentEnhance() {
  return (tree: unknown): void => {
    walk(tree as HNode);
  };
}
