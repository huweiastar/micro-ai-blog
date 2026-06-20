"use client";

import { useEffect, useState } from "react";
import { Clock, FileText } from "lucide-react";

interface ArticleRailProps {
  readingTime?: string;
  wordCount?: number;
}

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * 文章页右栏（lg+）：与左侧 TOC、居中正文形成三栏，填满原本空置的右侧空间（§2.3）。
 * 内容为「阅读辅助」——一枚跟随滚动的环形阅读进度 + 本文字数/时长，
 * 与顶部署名信息(byline)角色区分，移动端整列隐藏、回退到顶部进度条。
 */
export function ArticleRail({ readingTime, wordCount }: ArticleRailProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="sticky top-24 flex flex-col items-center gap-5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      {/* 环形阅读进度 */}
      <div className="relative h-[68px] w-[68px]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 68 68" aria-hidden>
          <circle
            cx="34"
            cy="34"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--card-border)"
            strokeWidth="4"
          />
          <circle
            cx="34"
            cy="34"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress / 100)}
            style={{ transition: "stroke-dashoffset 0.15s linear" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold tabular-nums text-[var(--foreground)]">
          {Math.round(progress)}%
        </span>
      </div>
      <span className="text-xs text-[var(--muted)]">阅读进度</span>

      {/* 本文信息 */}
      {(readingTime || typeof wordCount === "number") && (
        <div className="flex w-full flex-col gap-2 border-t border-[var(--card-border)] pt-4 text-xs text-[var(--muted)]">
          {readingTime && (
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              {readingTime}
            </span>
          )}
          {typeof wordCount === "number" && (
            <span className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              <span className="tabular-nums">{wordCount}</span> 字
            </span>
          )}
        </div>
      )}
    </div>
  );
}
