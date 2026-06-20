"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, MapPin, MessageCircle, Heart } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { MomentImages } from "./MomentImages";
import { Tag } from "../Tag";
import { timeAgo } from "../../lib/utils";

export interface MomentCardProps {
  slug: string;
  date: string;
  html: string;
  tags: string[];
  mood?: string;
  location?: string;
  images?: string[];
  authorName: string;
  avatar?: string;
  commentsEnabled: boolean;
}

export function MomentCard(props: MomentCardProps) {
  const { slug, date, html, tags, mood, location, images, authorName, avatar, commentsEnabled } = props;
  const [likes, setLikes] = useState<number | null>(null);

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
    <GlassCard as="article" radius="xl" hover className="group relative overflow-hidden p-5 sm:p-7">
      {/* 头部 */}
      <div className="mb-4 flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] shadow-md">
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={authorName} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold tracking-wide text-[var(--primary)]">{authorName}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
            <Clock className="h-3 w-3" />
            <time dateTime={date}>{timeAgo(date)}</time>
          </div>
        </div>
        {mood && (
          <span className="ml-auto shrink-0 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
            {mood}
          </span>
        )}
      </div>

      {/* 正文 */}
      <div
        className="note-card-content prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <MomentImages images={images} />

      {/* 底部 */}
      <div className="mt-5 flex items-center gap-4 text-sm text-[var(--muted)]">
        {location && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
            <MapPin className="h-3 w-3 shrink-0" />
            {location}
          </span>
        )}
        {tags.length > 0 && (
          <span className="flex flex-wrap items-center gap-2">
            {tags.map((t) => (
              <Tag key={t} name={t} />
            ))}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1.5" title="点赞数">
          <Heart className="h-4 w-4" />
          {likes ?? "–"}
        </span>
        {commentsEnabled && (
          <Link
            href={`/blog/${slug}`}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--primary)]"
            title="进入查看评论"
          >
            <MessageCircle className="h-4 w-4" />
            评论
          </Link>
        )}
      </div>
    </GlassCard>
  );
}
