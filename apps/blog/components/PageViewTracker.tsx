"use client";

import { usePathname } from "next/navigation";
import { usePageView } from "../hooks/usePageView";

export function PageViewTracker() {
  const pathname = usePathname();

  // HomeClient on "/" handles its own POST (record + display atomically)
  // Skip tracking on home page to avoid double counting
  if (pathname === "/") return null;

  // 后台页面不计入站点访问统计：站长浏览 /admin 不应虚增 PV/UV。
  if (pathname?.startsWith("/admin")) return null;

  return <TrackingEnabled />;
}

function TrackingEnabled() {
  usePageView();
  return null;
}
