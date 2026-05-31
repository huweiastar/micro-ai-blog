"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { useAssistantContext } from "./AssistantContext";

export function AssistantInput() {
  const { sendMessage, stopMessage, isLoading } = useAssistantContext();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="border-t border-[var(--card-border)] p-3 bg-[var(--card)]/50">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="问问博客、项目或代码实现..."
          rows={1}
          className="flex-1 resize-none px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder:text-[var(--muted)] max-h-[120px]"
          disabled={isLoading}
        />
        {isLoading ? (
          <button
            onClick={stopMessage}
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
            title="停止生成"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
