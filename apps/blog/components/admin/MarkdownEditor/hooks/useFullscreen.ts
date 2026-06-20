"use client";

import { RefObject, useCallback, useEffect, useState } from "react";

export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(async () => {
    const el = targetRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      try {
        await el.requestFullscreen();
      } catch {
        /* user gesture required, ignore */
      }
    }
  }, [targetRef]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return { isFullscreen, toggle };
}
