"use client";

import { useEffect, useState } from "react";

export type ViewMode = "edit" | "split" | "preview";

const KEY = "admin:editor:layout";

type Layout = { viewMode: ViewMode; inspectorOpen: boolean };

function read(): Layout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Layout>;
    const viewMode: ViewMode =
      v.viewMode === "edit" || v.viewMode === "split" || v.viewMode === "preview"
        ? v.viewMode
        : "split";
    // 检视器默认收起（避免在含后台侧栏的窄屏上挤压写作区），仅当用户显式开过才展开。
    return { viewMode, inspectorOpen: v.inspectorOpen === true };
  } catch {
    return null;
  }
}

/** 记忆编辑器视图模式与检视器开合，跨文章共享，存 localStorage。 */
export function useEditorLayout() {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [inspectorOpen, setInspectorOpen] = useState(false);

  useEffect(() => {
    const saved = read();
    if (saved) {
      setViewMode(saved.viewMode);
      setInspectorOpen(saved.inspectorOpen);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ viewMode, inspectorOpen }));
    } catch {
      /* 忽略写入失败 */
    }
  }, [viewMode, inspectorOpen]);

  return { viewMode, setViewMode, inspectorOpen, setInspectorOpen };
}
