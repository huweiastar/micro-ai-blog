"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { BlogPost } from "../lib/posts";
import { formatDate } from "../lib/utils";
import { getCategoryStyle } from "../lib/category-style";
import { ArrowRight, Calendar, Clock, FileText } from "lucide-react";
import { CategoryBadge } from "./blog/CategoryBadge";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const router = useRouter();
  const style = getCategoryStyle(post.category);

  return (
    <div
      style={{ "--cat": style.accent } as CSSProperties}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 pl-7 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--cat)]/40 hover:shadow-[var(--shadow-glow)] active:scale-[0.99]"
      onClick={() => router.push(`/blog/${post.slug}`)}
    >
      {/* Category accent spine */}
      <div
        className="absolute inset-y-0 left-0 w-1 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(180deg, ${style.gradient[0]}, ${style.gradient[1]})` }}
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
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-semibold mb-3 text-[var(--foreground)] group-hover:text-[var(--cat)] transition-colors duration-300 flex items-start justify-between gap-2">
          <span className="flex-1 line-clamp-2">{post.title}</span>
          <ArrowRight className="w-5 h-5 mt-0.5 shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[var(--cat)]" />
        </h2>

        {/* Summary */}
        <p className="text-[var(--muted)] text-sm mb-4 line-clamp-2 leading-relaxed">
          {post.summary}
        </p>

        {/* Tags — each tag is its own standalone link, stops card click */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 4).map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-[var(--muted)] flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.date)}
          </span>
          {post.category && (
            <span onClick={(e) => e.stopPropagation()}>
              <CategoryBadge name={post.category} />
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readingTime}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {post.wordCount} 字
          </span>
        </div>
      </div>
      {/* hover 渐变扫光线 */}
      <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--neon-purple)] to-[var(--neon-cyan)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}
