"use client";

import { useEffect, useRef } from "react";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("_blog_visitor_id");
  if (!id) {
    id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("_blog_visitor_id", id);
  }
  return id;
}

export function usePageView() {
  const trackedRef = useRef(false);

  useEffect(() => {
    // Prevent double counting in React.StrictMode (dev mode)
    if (trackedRef.current) return;
    trackedRef.current = true;

    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    // Use fetch to record page view
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
      keepalive: true,
    }).catch(() => {});
  }, []);
}
