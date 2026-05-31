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

export function usePageView(onUpdate?: (stats: { pv: number; uv: number; pathPv?: number }) => void) {
  const pathname = usePathname();
  const lastPathnameRef = useRef("");

  useEffect(() => {
    if (pathname === lastPathnameRef.current) return;
    lastPathnameRef.current = pathname;

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
