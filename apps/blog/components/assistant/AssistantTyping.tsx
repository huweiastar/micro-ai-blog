"use client";

import { Bot, Loader2 } from "lucide-react";
import { useAssistantContext } from "./AssistantContext";

export function AssistantTyping() {
  const { statusMessage } = useAssistantContext();

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin" />
      </div>
      <div className="flex-1">
        <div className="rounded-xl px-4 py-3 bg-[var(--card)] border border-[var(--card-border)]">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Bot className="w-4 h-4" />
            {statusMessage || "思考中..."}
          </div>
        </div>
      </div>
    </div>
  );
}
