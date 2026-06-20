"use client";

import { useEffect, useRef } from "react";
import { useAssistantContext } from "./AssistantContext";
import { AssistantMessage } from "./AssistantMessage";
import { AssistantEmptyState } from "./AssistantEmptyState";
import { AssistantTyping } from "./AssistantTyping";

export function AssistantMessageList() {
  const { messages, isLoading } = useAssistantContext();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <AssistantEmptyState />
      </div>
    );
  }

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => (
        <AssistantMessage key={msg.id} message={msg} />
      ))}
      {isLoading && <AssistantTyping />}
    </div>
  );
}
