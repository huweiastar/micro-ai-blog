"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { getOrCreateVisitorId } from "../../lib/visitor";

interface LikeButtonProps {
  slug: string;
}

/**
 * 文章点赞：文件后端持久化（/api/likes），乐观更新 + 失败回滚。
 * 同一访客可点赞 / 取消，状态按 visitorId 记忆。
 */
export function LikeButton({ slug }: LikeButtonProps) {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(false);
  const pendingRef = useRef(false);

  // 加载初始计数与本访客点赞状态。
  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    fetch(`/api/likes?slug=${encodeURIComponent(slug)}&visitorId=${encodeURIComponent(visitorId)}`)
      .then((res) => res.json())
      .then((data: { count?: number; liked?: boolean }) => {
        setCount(data.count ?? 0);
        setLiked(Boolean(data.liked));
      })
      .catch(() => setCount(0));
  }, [slug]);

  const onClick = async () => {
    if (pendingRef.current || count === null) return;
    pendingRef.current = true;

    const nextLiked = !liked;
    // 乐观更新
    setLiked(nextLiked);
    setCount((c) => (c ?? 0) + (nextLiked ? 1 : -1));
    if (nextLiked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 500);
    }

    try {
      const visitorId = getOrCreateVisitorId();
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, visitorId }),
      });
      if (!res.ok) throw new Error("failed");
      const data: { count: number; liked: boolean } = await res.json();
      setCount(data.count);
      setLiked(data.liked);
    } catch {
      // 回滚
      setLiked(!nextLiked);
      setCount((c) => (c ?? 0) + (nextLiked ? -1 : 1));
    } finally {
      pendingRef.current = false;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "取消点赞" : "点赞"}
      className={`group relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ${
        liked
          ? "border-rose-500/50 bg-rose-500/10 text-rose-500"
          : "border-[var(--card-border)] text-[var(--muted)] hover:border-rose-500/40 hover:text-rose-500"
      }`}
    >
      <Heart
        className={`h-4 w-4 transition-transform duration-200 ${
          liked ? "fill-rose-500" : "group-hover:scale-110"
        } ${burst ? "scale-125" : ""}`}
      />
      <span className="font-mono tabular-nums">{count ?? "·"}</span>
      <span>赞</span>
    </button>
  );
}
