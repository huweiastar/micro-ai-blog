"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ListTree } from "lucide-react";
import type { TocItem } from "../lib/posts";

interface TocProps {
  items: TocItem[];
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export function Toc({ items, collapsed, onToggle }: TocProps) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -70% 0%" }
    );

    // Only observe headings within the article content, not the entire page
    const article = document.querySelector("article, .prose-custom, [data-article-content]");
    const headings = article
      ? article.querySelectorAll("h2, h3")
      : document.querySelectorAll("h2, h3");
    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-20 space-y-0.5">
      {/* Header row with title and collapse button */}
      <div className="flex items-center justify-between mb-3">
        {!collapsed && (
          <h3 className="font-semibold text-xs text-[var(--muted)] uppercase tracking-wider">
            目录
          </h3>
        )}
        <button
          onClick={() => onToggle(!collapsed)}
          className={`flex items-center justify-center rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors shadow-sm ${
            collapsed
              ? "w-8 h-8"
              : "w-6 h-6"
          } bg-[var(--card)]`}
          title={collapsed ? "展开目录" : "收起目录"}
        >
          {collapsed ? (
            <ListTree className={collapsed ? "w-4 h-4" : "w-3.5 h-3.5"} />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* TOC items */}
      {!collapsed &&
        items.map((item) => (
          <Link
            key={item.id}
            href={`#${item.id}`}
            className={`block text-sm py-1.5 transition-all duration-200 border-l-2 ${
              activeId === item.id
                ? "text-[var(--primary)] border-[var(--primary)] font-medium"
                : "text-[var(--muted)] border-transparent hover:text-[var(--foreground)] hover:border-[var(--card-border)]"
            } ${item.level === 3 ? "pl-6" : "pl-3"}`}
          >
            {item.text}
          </Link>
        ))}
    </nav>
  );
}
