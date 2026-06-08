"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BlogPost } from "../lib/posts";
import { formatDate } from "../lib/utils";
import { ArrowRight, Calendar, Clock, FileText } from "lucide-react";
import { Badge } from "./ui/Badge";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const router = useRouter();

  return (
    <div
      className="relative glass rounded-xl p-6 overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 active:scale-[0.99] cursor-pointer group"
      onClick={() => router.push(`/blog/${post.slug}`)}
    >
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
        <h2 className="text-xl font-semibold mb-3 text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300 flex items-start justify-between gap-2">
          <span className="flex-1 line-clamp-2">{post.title}</span>
          <ArrowRight className="w-5 h-5 mt-0.5 shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[var(--primary)]" />
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
          {post.category && <Badge tone="accent">{post.category}</Badge>}
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
    </div>
  );
}
