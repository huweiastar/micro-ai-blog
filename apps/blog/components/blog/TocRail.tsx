"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TocItem } from "../../lib/posts";

interface TocRailProps {
  items: TocItem[];
}

/**
 * 右栏章节目录：带 IntersectionObserver 追踪当前章节高亮 + 阅读进度。
 */
export function TocRail({ items }: TocRailProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;

    // 追踪当前可见 heading
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    const article = document.querySelector("article, .prose-custom, [data-article-content]");
    const headings = article
      ? article.querySelectorAll("h2, h3")
      : document.querySelectorAll("h2, h3");
    headings.forEach((h) => observer.observe(h));

    // 计算目录阅读进度
    const handleScroll = () => {
      const articleEl = article as HTMLElement | null;
      if (!articleEl) return;
      const rect = articleEl.getBoundingClientRect();
      const total = rect.height;
      const scrolled = Math.max(0, -rect.top);
      const p = Math.min(100, (scrolled / total) * 100);
      setProgress(p);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [items]);

  if (items.length === 0) return null;

  // 找当前章节在目录中的索引（用于高亮）
  const activeIndex = items.findIndex((item) => item.id === activeId);

  return (
    <nav className="surface-card relative rounded-xl overflow-hidden">
      {/* 顶部渐变条（阅读进度可视化） */}
      <div className="relative h-1 w-full bg-[var(--card-border)]/50">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4">
        {/* 标题行 */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--primary)" }}
            />
            章节目录
          </h2>
          {activeIndex >= 0 && (
            <span className="text-[10px] tabular-nums text-[var(--muted)]">
              {activeIndex + 1} / {items.length}
            </span>
          )}
        </div>

        {/* 目录项 */}
        <div className="relative space-y-0.5">
          {/* 背景竖线（进度轨道） */}
          <div
            className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-[var(--card-border)]/60"
            aria-hidden="true"
          />
          {/* 进度竖线（高亮部分） */}
          {activeIndex >= 0 && (
            <div
              className="absolute left-[7px] top-0 w-0.5 bg-gradient-to-b from-[var(--primary)] to-[var(--accent)] transition-[height] duration-300"
              style={{
                height: `${((activeIndex + 1) / items.length) * 100}%`,
              }}
              aria-hidden="true"
            />
          )}

          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className={`group relative block py-1.5 text-sm leading-snug transition-colors ${
                  item.level === 3 ? "pl-7" : "pl-5"
                } ${
                  isActive
                    ? "font-medium text-[var(--primary)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {/* 圆点指示器 */}
                <span
                  className={`absolute left-[3px] top-1/2 -translate-y-1/2 h-[9px] w-[9px] rounded-full border-2 transition-all ${
                    isActive
                      ? "scale-110 border-[var(--primary)] bg-[var(--primary)]"
                      : "border-[var(--card-border)] bg-[var(--card)] group-hover:border-[var(--muted)]"
                  }`}
                  aria-hidden="true"
                />
                <span className="line-clamp-2">{item.text}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
