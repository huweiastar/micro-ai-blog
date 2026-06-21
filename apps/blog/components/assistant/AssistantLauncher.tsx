"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Bot, Loader2, X } from "lucide-react";
import { AssistantProvider, useAssistantContext } from "./AssistantContext";

// 聊天面板是助手的重头（消息渲染/markdown/请求逻辑），仅在用户打开时才加载，
// 从首屏 bundle 中剔除；浮窗按钮本身保持静态以便立即可见。
const AssistantPanel = dynamic(
  () => import("./AssistantPanel").then((m) => m.AssistantPanel),
  { ssr: false },
);

function AssistantWidget() {
  const { isOpen, open, close, isLoading } = useAssistantContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isOpen) return;
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, close]);

  return (
    <div className="fixed top-1/2 right-6 -translate-y-1/2 z-[100] flex flex-col items-end gap-3">
      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="w-[420px] max-w-[calc(100vw-3rem)] h-[620px] max-h-[85vh] animate-slide-up"
        >
          <AssistantPanel />
        </div>
      )}

      {/* Launcher Button */}
      <button
        ref={buttonRef}
        onClick={() => (isOpen ? close() : open())}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--primary)]/40 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white shadow-lg shadow-[var(--primary)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--primary)]/30"
        aria-label={isOpen ? "关闭助手" : "打开AI助手"}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Status dot */}
      {!isOpen && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-[var(--background)]" />
      )}
    </div>
  );
}

export function AssistantLauncher() {
  return (
    <AssistantProvider>
      <AssistantWidget />
    </AssistantProvider>
  );
}
