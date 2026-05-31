"use client";

import { Bot, X, Maximize2, Trash2 } from "lucide-react";
import { useAssistantContext } from "./AssistantContext";
import { usePageContext, getPageContextHint } from "../../hooks/usePageContext";

export function AssistantHeader() {
  const { close, clearMessages } = useAssistantContext();
  const pageCtx = usePageContext();
  const hint = getPageContextHint(pageCtx);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">微观AI 助手</h3>
          <p className="text-xs text-[var(--muted)]">{hint}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={clearMessages}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
          title="清空对话"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={close}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)]/20 transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
