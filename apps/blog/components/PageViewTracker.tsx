"use client";

import { usePathname } from "next/navigation";
import { usePageView } from "../hooks/usePageView";

export function PageViewTracker() {
  const pathname = usePathname();

  // HomeClient on "/" handles its own POST (record + display atomically)
  // Skip tracking on home page to avoid double counting
  if (pathname === "/") return null;

  return <TrackingEnabled />;
}

function TrackingEnabled() {
  usePageView();
  return null;
}
