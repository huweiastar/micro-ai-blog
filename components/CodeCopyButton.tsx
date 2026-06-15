"use client";

import { useEffect } from "react";

const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

/**
 * 代码块工具条由服务端 rehype 插件（lib/rehype-code-header）预渲染，
 * 这里只用事件委托给「复制」按钮挂点击行为——避免客户端注入 DOM 造成水合不匹配。
 */
export function CodeCopyButton() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest<HTMLButtonElement>(".copy-code-btn");
      if (!btn) return;

      const pre = btn.closest("pre");
      const code = pre?.querySelector("code");
      if (!code) return;

      navigator.clipboard.writeText(code.textContent || "").then(() => {
        btn.innerHTML = CHECK_SVG;
        btn.classList.add("copied");
        btn.title = "已复制";
        setTimeout(() => {
          btn.innerHTML = COPY_SVG;
          btn.classList.remove("copied");
          btn.title = "复制代码";
        }, 2000);
      });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
