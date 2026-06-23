"use client";

import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { BlogPost } from "../lib/posts";
import { formatDate } from "../lib/utils";
import { getCategoryStyle } from "../lib/category-style";
import { ArrowRight, Calendar, Clock, FileText } from "lucide-react";

interface BlogCardProps {
  post: BlogPost;
}

/**
 * 博客卡片 —— 整卡为 `<Link>`，让搜索引擎可跟踪、Next.js 可 prefetch、
 * 屏幕阅读器可识别为链接。
 *
 * 内部的标签 / 分类链接通过 `pointer-events-auto` + 更高的 z-index
 * 覆盖在整卡链接之上，点击时由自己的 `<a>` 接管，不会冒泡到卡片导航。
 */
export function BlogCard({ post }: BlogCardProps) {
  const style = getCategoryStyle(post.category);

  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{
        "--cat": style.accent,
        "--card-accent": style.gradient[0],
        "--card-accent-2": style.gradient[1],
      } as CSSProperties}
      className="card-premium surface-card group relative block cursor-pointer overflow-hidden rounded-xl p-6 pl-7 no-underline active:scale-[0.99]"
    >
      {/* Category accent spine — 悬停时扩展 */}
      <div
        className="absolute inset-y-0 left-0 w-1 opacity-60 transition-all duration-400 group-hover:w-1.5 group-hover:opacity-100"
        style={{ background: `linear-gradient(180deg, ${style.gradient[0]}, ${style.gradient[1]})` }}
      />

      {/* Hover gradient wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 0% 50%, ${style.gradient[0]}12, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        {/* Cover image */}
        {post.cover && (
          <div className="relative mb-4 -mx-6 -mt-6 h-48 overflow-hidden rounded-t-xl">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            {/* Cover overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-semibold mb-3 text-[var(--foreground)] group-hover:text-[var(--cat)] transition-colors duration-300 flex items-start justify-between gap-2">
          <span className="flex-1 line-clamp-2">{post.title}</span>
          <ArrowRight className="w-5 h-5 mt-0.5 shrink-0 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[var(--cat)]" />
        </h2>

        {/* Summary */}
        <p className="text-[var(--muted)] text-sm mb-4 line-clamp-2 leading-relaxed">
          {post.summary}
        </p>

        {/* Tags */}
        <div className="relative z-20 flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 4).map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="tag-float inline-flex items-center gap-1 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-2.5 py-0.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/18"
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-[var(--muted)] flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 transition-colors group-hover:text-[var(--cat)]" />
            {formatDate(post.date)}
          </span>
          {post.category && (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium bg-[var(--cat)]/8 text-[var(--cat)] border-[var(--cat)]/20"
            >
              {post.category}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 transition-colors group-hover:text-[var(--cat)]" />
            {post.readingTime}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 transition-colors group-hover:text-[var(--cat)]" />
            {post.wordCount} 字
          </span>
        </div>
      </div>

      {/* Bottom shimmer line on hover */}
      <div
        className="absolute inset-x-6 bottom-0 h-px opacity-0 transition-opacity duration-400 group-hover:opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${style.gradient[0]}, ${style.gradient[1]}, transparent)`,
        }}
      />
    </Link>
  );
}
