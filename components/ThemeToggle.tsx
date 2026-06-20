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
      className="text-[var(--muted)] transition-all duration-300 hover:rotate-12 hover:text-[var(--primary)] active:scale-90"
      aria-label={isDark ? "切换到亮色" : "切换到暗色"}
      title={isDark ? "破晓 · 点亮纸页" : "入夜 · 流萤深空"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
