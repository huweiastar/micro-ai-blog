"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = totalHeight > 0 ? Math.min(100, (scrollY / totalHeight) * 100) : 0;

      setVisible(scrollY > 400);
      setProgress(currentProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  const radius = 24;
  const dashOffset = 100 - progress;

  return (
    <button
      onClick={scrollToTop}
      className="animate-slide-in-scale fixed bottom-8 right-8 z-50 inline-flex items-center justify-center"
      aria-label="返回顶部"
    >
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth="2"
          pathLength="100"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="url(#back-to-top-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-150 ease-out"
        />
        <defs>
          <linearGradient id="back-to-top-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] text-[var(--primary)] shadow-md transition-all duration-300 hover:bg-[var(--primary)] hover:text-white hover:shadow-[var(--shadow-glow)] active:scale-95 border border-[var(--card-border)]">
        <ArrowUp className="h-4 w-4" />
      </span>
    </button>
  );
}
