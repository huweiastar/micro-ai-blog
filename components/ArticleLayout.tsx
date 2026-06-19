"use client";

import { useState } from "react";
import { Toc } from "./Toc";
import { MobileToc } from "./MobileToc";
import type { TocItem } from "../lib/posts";

interface ArticleLayoutProps {
  tocItems: TocItem[];
  children: React.ReactNode;
  backLink?: React.ReactNode;
  /** 右栏内容（lg+ 显示）：阅读进度 + 本文信息等阅读辅助（§2.3 三栏）。 */
  rail?: React.ReactNode;
}

export function ArticleLayout({
  tocItems,
  children,
  backLink,
  rail,
}: ArticleLayoutProps) {
  const [tocCollapsed, setTocCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("blog-toc-collapsed") === "true";
  });

  const handleToggle = (collapsed: boolean) => {
    setTocCollapsed(collapsed);
    localStorage.setItem("blog-toc-collapsed", String(collapsed));
  };

  // 三栏列宽：左 TOC（折叠时收窄）· 居中正文 · 右栏阅读辅助。
  // 折叠 TOC 时把空间让给正文，右栏宽度恒定。
  const tocSpan = tocCollapsed ? "lg:col-span-1" : "lg:col-span-3";
  const articleSpan = rail
    ? tocCollapsed
      ? "lg:col-span-8"
      : "lg:col-span-6"
    : tocCollapsed
      ? "lg:col-span-11"
      : "lg:col-span-9";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      {/* Sidebar TOC */}
      <aside className={`hidden transition-all duration-300 lg:block ${tocSpan}`}>
        <div className="relative">
          {/* Back link placed in sidebar, above TOC */}
          {backLink && <div className="mb-3">{backLink}</div>}
          <Toc items={tocItems} collapsed={tocCollapsed} onToggle={handleToggle} />
        </div>
      </aside>

      {/* Main Content */}
      <article className={`transition-all duration-300 ${articleSpan}`}>
        <MobileToc items={tocItems} />
        {children}
      </article>

      {/* Right rail — reading aids (lg+) */}
      {rail && (
        <aside className="hidden lg:col-span-3 lg:block">{rail}</aside>
      )}
    </div>
  );
}
