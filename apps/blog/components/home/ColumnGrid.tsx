"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { getCategoryStyle } from "../../lib/category-style";

interface ColumnTheme {
  name: string;
  desc: string;
  background?: string;
  bgOpacity?: number;
}

/** 专栏主题网格 —— 首页内容区顶部展示，引导用户进入各分类。 */
export function ColumnGrid({ columns }: { columns: ColumnTheme[] }) {
  const ref = useRef<HTMLDivElement>(null);

  // 交错入场动画
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const items = el.querySelectorAll<HTMLElement>(":scope > a");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    items.forEach((item, i) => {
      item.style.transitionDelay = `${i * 80}ms`;
      item.classList.add("reveal");
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  if (columns.length === 0) return null;

  return (
    <div ref={ref} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {columns.map((theme) => {
        const style = getCategoryStyle(theme.name);
        const Icon = style.icon;
        const grad = `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`;

        return (
          <Link
            key={theme.name}
            href={`/categories/${encodeURIComponent(theme.name)}`}
            style={{
              "--cat": style.gradient[0],
              "--card-accent": style.gradient[0],
              "--card-accent-2": style.gradient[1],
            } as React.CSSProperties}
            className="card-premium surface-card group relative flex flex-col overflow-hidden rounded-xl p-5"
          >
            {/* 顶部渐变线 — 悬停时扩展 */}
            <div
              className="absolute inset-x-0 top-0 h-0.5 transition-all duration-400 group-hover:h-1"
              style={{ background: grad }}
            />

            {/* 悬停光晕 — 从图标位置扩散 */}
            <div
              className="pointer-events-none absolute -left-4 -top-4 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-400 group-hover:opacity-15"
              style={{ background: style.gradient[0] }}
            />

            <div className="relative z-10 flex items-start gap-3">
              {/* Icon container */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
                style={{ background: grad }}
              >
                <Icon className="h-5 w-5 text-white transition-transform duration-300 group-hover:scale-110" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--foreground)] transition-colors duration-300 group-hover:text-[var(--cat)]">
                  {theme.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)] line-clamp-2">
                  {theme.desc}
                </p>
              </div>

              {/* Arrow indicator — 悬停时显现 */}
              <div className="shrink-0 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-60 group-hover:translate-x-0">
                <svg
                  className="w-4 h-4 text-[var(--cat)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
