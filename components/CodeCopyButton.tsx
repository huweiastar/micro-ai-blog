"use client";

import { useEffect } from "react";

/**
 * Injects a header bar (language label + copy button) into every code block.
 * Language label with dot indicator sits in the top-right, left of copy button.
 */
export function CodeCopyButton() {
  useEffect(() => {
    const injectHeaders = () => {
      const pres = document.querySelectorAll<HTMLElement>(".prose-custom pre[data-language]");

      pres.forEach((pre) => {
        if (pre.querySelector(".code-block-header")) return;

        const lang = pre.getAttribute("data-language") || "";

        const header = document.createElement("div");
        header.className = "code-block-header";
        header.innerHTML = `
          <div style="display:flex;align-items:center;gap:5px;">
            <span style="width:10px;height:10px;border-radius:50%;background:#ff5f57;display:inline-block;"></span>
            <span style="width:10px;height:10px;border-radius:50%;background:#febc2e;display:inline-block;"></span>
            <span style="width:10px;height:10px;border-radius:50%;background:#28c840;display:inline-block;"></span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="code-lang-label">${lang}</span>
            <button class="copy-code-btn" title="复制代码">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
        `;

        const btn = header.querySelector<HTMLButtonElement>(".copy-code-btn")!;
        btn.addEventListener("click", () => {
          const code = pre.querySelector("code");
          if (!code) return;

          const text = code.textContent || "";
          navigator.clipboard.writeText(text).then(() => {
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
            btn.classList.add("copied");
            btn.title = "已复制";
            setTimeout(() => {
              btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
              btn.classList.remove("copied");
              btn.title = "复制代码";
            }, 2000);
          });
        });

        pre.insertBefore(header, pre.firstChild);
      });
    };

    injectHeaders();

    const observer = new MutationObserver(injectHeaders);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
