"use client";

import { MobileToc } from "./MobileToc";
import type { TocItem } from "../lib/posts";

interface ArticleLayoutProps {
  tocItems: TocItem[];
  children: React.ReactNode;
  backLink?: React.ReactNode;
  /** 左栏内容：文章列表等站内导航。 */
  leftRail?: React.ReactNode;
  /** 右栏内容：阅读进度、章节目录等阅读辅助。 */
  rail?: React.ReactNode;
}

export function ArticleLayout({
  tocItems,
  children,
  backLink,
  leftRail,
  rail,
}: ArticleLayoutProps) {
  const hasToc = tocItems.length > 0;
  const gridColumns = leftRail
    ? rail
      ? "lg:grid-cols-[minmax(0,1fr)_11rem] xl:grid-cols-[13rem_minmax(0,1fr)_12rem] 2xl:grid-cols-[14rem_minmax(0,1fr)_13rem]"
      : "xl:grid-cols-[13rem_minmax(0,1fr)] 2xl:grid-cols-[14rem_minmax(0,1fr)]"
    : rail
      ? "lg:grid-cols-[minmax(0,1fr)_11rem] xl:grid-cols-[minmax(0,1fr)_12rem] 2xl:grid-cols-[minmax(0,1fr)_13rem]"
      : "";

  return (
    <div className={`grid grid-cols-1 gap-8 lg:gap-10 xl:gap-12 ${gridColumns}`}>
      {leftRail && (
        <aside className="hidden min-w-0 xl:block">
          <div className="sticky top-24">{leftRail}</div>
        </aside>
      )}

      <article className="min-w-0 transition-all duration-300">
        {backLink && <div className="mb-5">{backLink}</div>}
        {hasToc && <MobileToc items={tocItems} />}
        {children}
      </article>

      {rail && (
        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-24 space-y-5">{rail}</div>
        </aside>
      )}
    </div>
  );
}
