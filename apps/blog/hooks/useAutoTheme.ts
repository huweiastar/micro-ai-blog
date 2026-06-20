"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

const DAY_HOUR = 6;
const NIGHT_HOUR = 18;
const STORAGE_KEY = "theme:auto";
const CHECK_INTERVAL = 60_000; // 1 minute — balances responsiveness vs unnecessary re-renders

function isAutoEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const val = localStorage.getItem(STORAGE_KEY);
  return val !== "false";
}

function getTargetTheme(now: Date = new Date()): "light" | "dark" {
  const hour = now.getHours();
  return hour >= DAY_HOUR && hour < NIGHT_HOUR ? "light" : "dark";
}

export function useAutoTheme() {
  const { theme, setTheme } = useTheme();
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    if (!isAutoEnabled()) return;

    const target = getTargetTheme();
    if (themeRef.current !== target) {
      setTheme(target);
    }

    const interval = setInterval(() => {
      if (!isAutoEnabled()) return;
      const next = getTargetTheme();
      if (themeRef.current !== next) {
        setTheme(next);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [setTheme]);
}
