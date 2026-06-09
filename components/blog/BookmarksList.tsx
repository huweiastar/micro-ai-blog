"use client";

import Link from "next/link";
import { BookmarkX, BookmarkPlus, ArrowUpRight } from "lucide-react";
import { useBookmarks } from "../../hooks/useBookmarks";
import { CategoryBadge } from "./CategoryBadge";
import { formatShortDate } from "../../lib/utils";

/**
 * 收藏列表（客户端，读取 localStorage）。空态引导回博客。
 */
export function BookmarksList() {
  const { bookmarks, remove, hydrated } = useBookmarks();

  if (!hydrated) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-[var(--card-border)] bg-[var(--card)]/50"
          />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--card-border)] py-20 text-center">
        <BookmarkPlus className="mb-4 h-10 w-10 text-[var(--muted)]" />
        <p className="text-[var(--foreground)]">还没有收藏任何文章</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          在文章页点击「收藏」，稍后可在这里快速回顾
        </p>
        <Link
          href="/blog"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
        >
          去博客逛逛
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {bookmarks.map((b) => (
        <div
          key={b.slug}
          className="group relative flex flex-col rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 transition-all duration-300 hover:border-[var(--primary)]/50 hover:shadow-[var(--shadow-md)]"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            {b.category ? <CategoryBadge name={b.category} /> : <span />}
            <button
              onClick={() => remove(b.slug)}
              aria-label="取消收藏"
              title="取消收藏"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] opacity-0 transition-all hover:bg-[var(--card-border)]/40 hover:text-[var(--primary)] focus:opacity-100 group-hover:opacity-100"
            >
              <BookmarkX className="h-4 w-4" />
            </button>
          </div>
          <Link href={`/blog/${b.slug}`} className="flex min-w-0 flex-1 flex-col">
            <h3 className="line-clamp-2 font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
              {b.title}
            </h3>
            {b.summary && (
              <p className="mt-1.5 line-clamp-2 text-sm text-[var(--muted)]">
                {b.summary}
              </p>
            )}
            <p className="mt-3 text-xs text-[var(--muted)]">
              {formatShortDate(b.date)}
            </p>
          </Link>
        </div>
      ))}
    </div>
  );
}
