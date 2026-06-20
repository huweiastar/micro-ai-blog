"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useBookmarks, type BookmarkItem } from "../../hooks/useBookmarks";

type BookmarkButtonProps = Omit<BookmarkItem, "savedAt">;

/**
 * 文章收藏按钮：localStorage 持久化，点击切换收藏状态。
 */
export function BookmarkButton(props: BookmarkButtonProps) {
  const { isBookmarked, toggle, hydrated } = useBookmarks();
  const active = hydrated && isBookmarked(props.slug);

  return (
    <button
      type="button"
      onClick={() => toggle(props)}
      aria-pressed={active}
      aria-label={active ? "取消收藏" : "收藏文章"}
      title={active ? "取消收藏" : "收藏文章"}
      className={`group inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ${
        active
          ? "border-[var(--primary)]/50 bg-[var(--primary)]/10 text-[var(--primary)]"
          : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
      }`}
    >
      {active ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4 transition-transform group-hover:scale-110" />
      )}
      <span>{active ? "已收藏" : "收藏"}</span>
    </button>
  );
}
