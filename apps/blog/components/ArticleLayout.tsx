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

  const hasToc = tocItems.length > 0;

  // 三栏列宽：左右辅助栏使用固定舒适宽度，剩余空间全部给正文。
  const gridColumns = hasToc
    ? rail
      ? tocCollapsed
        ? "lg:grid-cols-[3.5rem_minmax(0,1fr)_10rem] xl:grid-cols-[3.5rem_minmax(0,1fr)_11rem]"
        : "lg:grid-cols-[12rem_minmax(0,1fr)_10rem] xl:grid-cols-[14rem_minmax(0,1fr)_11rem]"
      : tocCollapsed
        ? "lg:grid-cols-[3.5rem_minmax(0,1fr)]"
        : "lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)]"
    : rail
      ? "lg:grid-cols-[minmax(0,1fr)_10rem] xl:grid-cols-[minmax(0,1fr)_11rem]"
      : "";

  return (
    <div className={`grid grid-cols-1 gap-8 lg:gap-10 ${gridColumns}`}>
      {/* Sidebar TOC */}
      {hasToc && (
        <aside className="hidden min-w-0 transition-all duration-300 lg:block">
          <div className="relative">
            {/* Back link placed in sidebar, above TOC */}
            {backLink && <div className="mb-3">{backLink}</div>}
            <Toc items={tocItems} collapsed={tocCollapsed} onToggle={handleToggle} />
          </div>
        </aside>
      )}

      {/* Main Content */}
      <article className="min-w-0 transition-all duration-300">
        {hasToc && <MobileToc items={tocItems} />}
        {!hasToc && backLink && <div className="mb-6">{backLink}</div>}
        {children}
      </article>

      {/* Right rail — reading aids (lg+) */}
      {rail && (
        <aside className="hidden min-w-0 lg:block">{rail}</aside>
      )}
    </div>
  );
}
