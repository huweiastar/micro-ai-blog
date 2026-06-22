"use client";

import { useEffect, useState } from "react";

export type ViewMode = "edit" | "split" | "preview";

// v2：检视器在桌面端改为默认展开（封面/摘要/发布设置藏在里面，
// 默认收起导致这些功能几乎不可发现）。升 key 让旧的自动持久化失效。
const KEY = "admin:editor:layout:v2";

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
    return { viewMode, inspectorOpen: v.inspectorOpen === true };
  } catch {
    // localStorage 数据损坏（用户手动改过、或旧版 schema）→ 当作未存过，回退到默认值
    return null;
  }
}

/** 桌面（xl 及以上，检视器为常驻侧栏）默认展开；窄屏是滑出抽屉，默认收起。 */
function defaultInspectorOpen(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 1280px)").matches;
}

/** 记忆编辑器视图模式与检视器开合，跨文章共享，存 localStorage。 */
export function useEditorLayout() {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = read();
    if (saved) {
      setViewMode(saved.viewMode);
      setInspectorOpen(saved.inspectorOpen);
    } else {
      setInspectorOpen(defaultInspectorOpen());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    // 初始化完成前不回写，避免把初始 false 覆盖成"用户选择"
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ viewMode, inspectorOpen }));
    } catch {
      /* 忽略写入失败 */
    }
  }, [viewMode, inspectorOpen, hydrated]);

  return { viewMode, setViewMode, inspectorOpen, setInspectorOpen };
}
