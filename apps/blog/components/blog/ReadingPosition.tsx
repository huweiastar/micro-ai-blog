"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, X } from "lucide-react";

interface ReadingPositionProps {
  slug: string;
}

const KEY = (slug: string) => `blog-readpos:${slug}`;
const MIN_RESTORE = 0.06; // 低于此进度不提示
const MAX_RESTORE = 0.92; // 接近读完则不提示
const PROMPT_TIMEOUT = 9000;

function scrollableHeight() {
  return document.documentElement.scrollHeight - window.innerHeight;
}

/**
 * 阅读位置记忆：滚动时按比例持久化当前文章的阅读进度，
 * 再次进入时若有未读完的进度，浮出"继续上次阅读"提示。
 */
export function ReadingPosition({ slug }: ReadingPositionProps) {
  const [saved, setSaved] = useState<number | null>(null);
  const dismissedRef = useRef(false);

  // 进入时读取上次进度，决定是否提示。
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(slug));
      if (!raw) return;
      const p = Number(raw);
      if (Number.isFinite(p) && p > MIN_RESTORE && p < MAX_RESTORE) {
        setSaved(p);
        const t = setTimeout(() => setSaved(null), PROMPT_TIMEOUT);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [slug]);

  // 滚动时（rAF 节流）持久化进度；读完则清除。
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const max = scrollableHeight();
        if (max <= 0) return;
        const p = window.scrollY / max;
        try {
          if (p >= MAX_RESTORE) localStorage.removeItem(KEY(slug));
          else if (p > MIN_RESTORE) localStorage.setItem(KEY(slug), p.toFixed(4));
        } catch {
          /* ignore */
        }
        // 用户主动滚动后收起提示（避免干扰）。
        if (!dismissedRef.current && saved !== null) {
          dismissedRef.current = true;
          setSaved(null);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug, saved]);

  const restore = () => {
    if (saved === null) return;
    window.scrollTo({ top: saved * scrollableHeight(), behavior: "smooth" });
    dismissedRef.current = true;
    setSaved(null);
  };

  if (saved === null) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 animate-slide-up sm:bottom-6 sm:left-6 sm:translate-x-0">
      <div className="flex items-center gap-3 rounded-full border border-[var(--card-border)] bg-[var(--card)] py-2 pl-3 pr-2 shadow-2xl">
        <BookOpen className="h-4 w-4 shrink-0 text-[var(--primary)]" />
        <button
          onClick={restore}
          className="text-sm text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
        >
          继续上次阅读 ·{" "}
          <span className="font-mono tabular-nums text-[var(--primary)]">
            {Math.round(saved * 100)}%
          </span>
        </button>
        <button
          onClick={() => setSaved(null)}
          aria-label="关闭"
          className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--card-border)]/40 hover:text-[var(--foreground)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
