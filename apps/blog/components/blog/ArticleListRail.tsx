"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { BlogPost } from "../../lib/posts";
import { getCategoryStyle } from "../../lib/category-style";

interface ArticleListRailProps {
  articles: BlogPost[];
  currentSlug: string;
}

interface GroupedArticles {
  category: string;
  posts: BlogPost[];
}

/**
 * 左栏文章列表：按专栏（category）分组展示。
 * - 当前文章所在专栏默认展开，其他折叠
 * - 每个专栏标题带分类图标与配色
 * - 当前文章高亮
 */
export function ArticleListRail({ articles, currentSlug }: ArticleListRailProps) {
  // 找到当前文章所属分类
  const currentPost = articles.find((a) => a.slug === currentSlug);
  const currentCategory = currentPost?.category ?? "";

  // 按专栏分组（保留顺序）
  const grouped = useMemo<GroupedArticles[]>(() => {
    const map = new Map<string, BlogPost[]>();
    for (const post of articles) {
      const cat = post.category || "未分类";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(post);
    }
    return Array.from(map.entries()).map(([category, posts]) => ({ category, posts }));
  }, [articles]);

  // 默认展开当前文章所在专栏
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(currentCategory ? [currentCategory] : [])
  );

  const toggle = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <nav className="surface-card rounded-xl overflow-hidden">
      {/* 顶部渐变装饰条 */}
      <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] opacity-60" />

      <div className="p-3">
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
          文章专栏
        </h2>

        <div className="space-y-1">
          {grouped.map(({ category, posts }) => {
            const style = getCategoryStyle(category);
            const Icon = style.icon;
            const isExpanded = expanded.has(category);
            const hasCurrent = posts.some((p) => p.slug === currentSlug);

            return (
              <div key={category} className="group/section">
                {/* 分类标题行 */}
                <button
                  type="button"
                  onClick={() => toggle(category)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${
                    hasCurrent
                      ? "bg-[var(--primary)]/[0.06]"
                      : "hover:bg-[var(--foreground)]/[0.03]"
                  }`}
                >
                  {/* 分类图标 */}
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`,
                    }}
                  >
                    <Icon className="h-3 w-3" />
                  </span>

                  {/* 分类名 */}
                  <span className="flex-1 truncate text-xs font-semibold text-[var(--foreground)]">
                    {category}
                  </span>

                  {/* 文章计数 */}
                  <span className="text-[10px] tabular-nums text-[var(--muted)]">
                    {posts.length}
                  </span>

                  {/* 折叠箭头 */}
                  <ChevronDown
                    className={`h-3 w-3 text-[var(--muted)] transition-transform duration-200 ${
                      isExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                {/* 分类下的文章列表 */}
                {isExpanded && (
                  <div className="ml-2 mt-0.5 space-y-0.5 border-l-2 border-[var(--card-border)] pl-2">
                    {posts.map((item) => {
                      const active = item.slug === currentSlug;
                      return (
                        <Link
                          key={item.slug}
                          href={`/blog/${item.slug}`}
                          className={`block rounded-md px-2.5 py-1.5 text-[13px] leading-snug transition-all ${
                            active
                              ? "font-medium text-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/20"
                              : "text-[var(--muted)] hover:bg-[var(--foreground)]/[0.04] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <span className="line-clamp-2">{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
