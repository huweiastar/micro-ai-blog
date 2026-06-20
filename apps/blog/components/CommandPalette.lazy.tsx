"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { COMMAND_PALETTE_OPEN_EVENT } from "./command-palette-bus";

// 命令面板内含 fuse.js + 搜索逻辑，是不小的一块。这里用一个零成本的门控：
// 首屏只挂一个轻量键盘/事件监听器，直到用户首次按下 ⌘K/Ctrl+K 或点击搜索，
// 才动态加载并挂载真正的命令面板，从而把它彻底移出首屏 bundle。
const CommandPalette = dynamic(
  () => import("./CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

export function CommandPaletteLazy() {
  const [mounted, setMounted] = useState(false);

  // 未挂载前：轻量监听首次触发。一旦挂载即移除这些监听，交给命令面板自身处理。
  useEffect(() => {
    if (mounted) return;
    const activate = () => setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        activate();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, activate);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, activate);
    };
  }, [mounted]);

  if (!mounted) return null;
  // autoOpen：组件异步加载完成挂载后自行打开这一次触发，避免补发事件的竞态。
  return <CommandPalette autoOpen />;
}
