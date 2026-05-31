"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("_blog_visitor_id");
  if (!id) {
    id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("_blog_visitor_id", id);
  }
  return id;
}

export function usePageView(onUpdate?: (stats: { pv: number; uv: number }) => void) {
  const pathname = usePathname();
  // Track the last pathname we recorded to avoid duplicate PV on StrictMode remount
  const lastPathnameRef = useRef("");

  useEffect(() => {
    // Skip if pathname hasn't changed (handles React.StrictMode dev double-mount)
    if (pathname === lastPathnameRef.current) return;
    lastPathnameRef.current = pathname;

    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    // Record page view
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => onUpdate?.(data))
      .catch(() => {});
  }, [pathname, onUpdate]);
}
