"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// 模块级去重：记录每个路径最近一次上报时间。跨组件卸载/重挂存活，
// 因此能挡住 React StrictMode（dev）的 effect 双调用、以及快速重挂导致的重复上报。
// 超过窗口的真实再访问仍会重新计数。
const recentlyTracked = new Map<string, number>();
const DEDUP_WINDOW_MS = 4000;

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("_blog_visitor_id");
  if (!id) {
    id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("_blog_visitor_id", id);
  }
  return id;
}

export function usePageView(onUpdate?: (stats: { pv: number; uv: number; pathPv?: number }) => void) {
  const pathname = usePathname();
  const lastPathnameRef = useRef("");

  useEffect(() => {
    if (pathname === lastPathnameRef.current) return;
    lastPathnameRef.current = pathname;

    const now = Date.now();
    const last = recentlyTracked.get(pathname) ?? 0;
    if (now - last < DEDUP_WINDOW_MS) return; // 窗口内重复上报（含 StrictMode 双调用）直接跳过
    recentlyTracked.set(pathname, now);

    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, path: pathname }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) =>
        onUpdate?.({
          pv: data.global?.pv ?? 0,
          uv: data.global?.uv ?? 0,
          pathPv: data.path?.pv,
        })
      )
      .catch(() => {});
  }, [pathname, onUpdate]);
}
