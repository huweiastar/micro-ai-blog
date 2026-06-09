"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "blog-bookmarks";
const CHANGE_EVENT = "bookmarks:changed";

export interface BookmarkItem {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  category?: string;
  /** 收藏时间戳（毫秒），用于排序。 */
  savedAt: number;
}

function read(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it): it is BookmarkItem =>
        typeof it === "object" &&
        it !== null &&
        typeof (it as { slug?: unknown }).slug === "string"
    );
  } catch {
    return [];
  }
}

function write(items: BookmarkItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    /* storage unavailable (private mode / quota) — ignore */
  }
}

/**
 * 基于 localStorage 的文章收藏管理。SSR 安全，支持同标签页与跨标签页同步。
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBookmarks(read());
    setHydrated(true);
    const sync = () => setBookmarks(read());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isBookmarked = useCallback(
    (slug: string) => bookmarks.some((b) => b.slug === slug),
    [bookmarks]
  );

  const toggle = useCallback((item: Omit<BookmarkItem, "savedAt">) => {
    const current = read();
    const exists = current.some((b) => b.slug === item.slug);
    const next = exists
      ? current.filter((b) => b.slug !== item.slug)
      : [{ ...item, savedAt: Date.now() }, ...current];
    write(next);
    setBookmarks(next);
    return !exists; // true = 已收藏
  }, []);

  const remove = useCallback((slug: string) => {
    const next = read().filter((b) => b.slug !== slug);
    write(next);
    setBookmarks(next);
  }, []);

  return { bookmarks, isBookmarked, toggle, remove, hydrated };
}
