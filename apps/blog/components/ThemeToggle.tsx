"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  const toggle = () => {
    localStorage.setItem("theme:auto", "false");
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      className="relative inline-flex h-9 w-[58px] items-center rounded-full border border-[var(--card-border)] bg-[var(--card)]/75 p-1 text-[var(--muted)] shadow-sm backdrop-blur transition-all duration-300 hover:border-[var(--primary)]/45 hover:text-[var(--primary)] hover:shadow-[var(--shadow-glow)] active:scale-95"
      aria-label={isDark ? "切换到亮色" : "切换到暗色"}
      title={isDark ? "破晓 · 点亮纸页" : "入夜 · 流萤深空"}
    >
      <span
        className={`absolute top-1 h-7 w-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] shadow-md transition-transform duration-300 ${isDark ? "translate-x-6" : "translate-x-0"}`}
        aria-hidden
      />
      <span className="relative z-10 flex w-full items-center justify-between px-1">
        <Sun className={`h-3.5 w-3.5 transition-colors ${isDark ? "text-[var(--muted)]" : "text-white"}`} />
        <Moon className={`h-3.5 w-3.5 transition-colors ${isDark ? "text-white" : "text-[var(--muted)]"}`} />
      </span>
    </button>
  );
}
