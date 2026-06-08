"use client";

import { useState } from "react";
import { Toc } from "./Toc";
import { MobileToc } from "./MobileToc";
import type { TocItem } from "../lib/posts";

interface ArticleLayoutProps {
  tocItems: TocItem[];
  children: React.ReactNode;
  backLink?: React.ReactNode;
}

export function ArticleLayout({ tocItems, children, backLink }: ArticleLayoutProps) {
  const [tocCollapsed, setTocCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("blog-toc-collapsed") === "true";
  });

  const handleToggle = (collapsed: boolean) => {
    setTocCollapsed(collapsed);
    localStorage.setItem("blog-toc-collapsed", String(collapsed));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
      {/* Sidebar TOC */}
      <aside className={`hidden lg:block transition-all duration-300 ${
        tocCollapsed ? "lg:col-span-1" : "lg:col-span-3"
      }`}>
        <div className="relative">
          {/* Back link placed in sidebar, above TOC */}
          {backLink && <div className="mb-3">{backLink}</div>}
          <Toc items={tocItems} collapsed={tocCollapsed} onToggle={handleToggle} />
        </div>
      </aside>

      {/* Main Content */}
      <article className={`transition-all duration-300 ${
        tocCollapsed ? "lg:col-span-11" : "lg:col-span-9"
      }`}>
        <MobileToc items={tocItems} />
        {children}
      </article>
    </div>
  );
}
