"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, StickyNote, ChevronDown, ArrowRight } from "lucide-react";
import { Tag } from "../Tag";

export interface NoteCardProps {
  slug: string;
  date: string;
  dateLabel: string;
  tags: string[];
  /** 服务端渲染好的正文 HTML。 */
  html: string;
  /** giscus 已配置时展示评论入口。 */
  commentsEnabled: boolean;
}

// 卡片内正文超过此高度时折叠并渐隐
const COLLAPSE_HEIGHT = 300;

/**
 * 随手记卡片：整卡任意位置可点进详情（stretched-link），
 * 正文里的链接与标签仍可单独点击（z-index 抬升）。
 */
export function NoteCard({ slug, date, dateLabel, tags, html, commentsEnabled }: NoteCardProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [likes, setLikes] = useState<number | null>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (el) setOverflowing(el.scrollHeight > COLLAPSE_HEIGHT + 24);
  }, [html]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/likes?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && typeof d.count === "number") setLikes(d.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <article className="group relative glass overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/40 hover:shadow-[var(--shadow-lg)] active:scale-[0.99]">
      {/* 左侧天青色脊：与博客卡片的分类色脊同语言 */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-400 to-cyan-500 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* 整卡跳转的隐形链接层 */}
      <Link
        href={`/blog/${slug}`}
        aria-label="查看这条随手记"
        className="absolute inset-0 z-[1]"
      />

      <div className="p-5 pl-6 sm:p-6 sm:pl-7">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-500 dark:text-sky-400">
            <StickyNote className="h-3.5 w-3.5" />
            随手记
          </span>
          <time dateTime={date}>{dateLabel}</time>
          {tags.length > 0 && (
            <span className="relative z-[2] flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <Tag key={tag} name={tag} />
              ))}
            </span>
          )}
        </div>

        <div className="relative">
          <div
            ref={contentRef}
            className="note-card-content prose prose-sm sm:prose-base dark:prose-invert max-w-none overflow-hidden"
            style={overflowing ? { maxHeight: COLLAPSE_HEIGHT } : undefined}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {overflowing && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-[var(--card)] to-transparent"
            >
              <span className="mb-1 inline-flex items-center gap-1 text-xs text-sky-500 dark:text-sky-400">
                <ChevronDown className="h-3.5 w-3.5" />
                查看全文
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-[var(--card-border)] pt-3 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5" title="点赞数">
            <Heart className="h-4 w-4" />
            {likes ?? "–"}
          </span>
          {commentsEnabled && (
            <span className="inline-flex items-center gap-1.5" title="进入查看评论">
              <MessageCircle className="h-4 w-4" />
              评论
            </span>
          )}
          <span className="ml-auto inline-flex translate-x-1 items-center gap-1 text-xs opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-sky-500 dark:group-hover:text-sky-400">
            进入详情
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
