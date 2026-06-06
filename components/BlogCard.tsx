"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BlogPost } from "../lib/posts";
import { formatDate } from "../lib/utils";
import { ArrowRight, Calendar, Clock, FileText } from "lucide-react";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const router = useRouter();

  return (
    <div
      className="relative glass rounded-xl p-6 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--primary)]/20 hover:-translate-y-2 active:scale-[0.98] cursor-pointer group"
      onClick={() => router.push(`/blog/${post.slug}`)}
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Corner decoration */}
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-700" />
      <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--primary)]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-700" />

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--primary)]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

      <div className="relative z-10">
        {/* Cover image */}
        {post.cover && (
          <div className="mb-4 -mx-6 -mt-6 overflow-hidden rounded-t-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover}
              alt={post.title}
              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-semibold mb-3 text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300 flex items-center justify-between">
          <span className="flex-1">{post.title}</span>
          <ArrowRight className="w-5 h-5 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[var(--primary)]" />
        </h2>

        {/* Summary */}
        <p className="text-[var(--muted)] text-sm mb-4 line-clamp-2 leading-relaxed group-hover:text-[var(--foreground)] transition-colors duration-300">
          {post.summary}
        </p>

        {/* Tags — each tag is its own standalone link, stops card click */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 4).map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors hover:scale-110"
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
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--accent)]/10 to-[var(--primary)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              {post.category}
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

      {/* Bottom border glow */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  );
}
