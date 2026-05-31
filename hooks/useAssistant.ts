"use client";

import { useState, useCallback, useRef } from "react";
import type { SourceReference } from "../lib/assistant/types";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  followUps?: string[];
  confidence?: "high" | "medium" | "low";
  timestamp: number;
};

export type AssistantMode = "all" | "blog" | "project" | "code";

export interface UseAssistantReturn {
  isOpen: boolean;
  messages: Message[];
  mode: AssistantMode;
  isLoading: boolean;
  statusMessage: string;
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (content: string) => Promise<void>;
  stopMessage: () => void;
  setMode: (mode: AssistantMode) => void;
  clearMessages: () => void;
}

type StreamEvent = {
  type: "start" | "chunk" | "done";
  content?: string;
  sources?: SourceReference[];
  followUps?: string[];
};

export function useAssistant(): UseAssistantReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<AssistantMode>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const stopMessage = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStatusMessage("正在理解问题");

    const controller = new AbortController();
    abortRef.current = controller;

    // Create a placeholder assistant message that will be progressively filled
    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: Date.now() },
    ]);

    try {
      setStatusMessage("正在检索相关内容");

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: content,
          mode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "请求失败");
      }

      setStatusMessage("正在整理答案");

      // Consume the SSE stream progressively
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let sources: SourceReference[] = [];
      let followUps: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          try {
            const event: StreamEvent = JSON.parse(trimmed.slice(5).trim());

            if (event.type === "start") {
              sources = event.sources || [];
            } else if (event.type === "chunk") {
              fullContent += event.content;
              // Update the message content progressively
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: fullContent } : msg
                )
              );
            } else if (event.type === "done") {
              followUps = event.followUps || [];
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Finalize the message with all metadata
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: fullContent, sources, followUps, confidence: sources.length > 0 ? "high" : "low" as const }
            : msg
        )
      );
      setStatusMessage("");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // User stopped — keep whatever partial content we have
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: msg.content || "已停止生成" }
              : msg
          )
        );
        setStatusMessage("");
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: "连接失败，请稍后重试。" }
            : msg
        )
      );
      setStatusMessage("");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [mode]);

  return {
    isOpen,
    messages,
    mode,
    isLoading,
    statusMessage,
    open,
    close,
    toggle,
    sendMessage,
    stopMessage,
    setMode,
    clearMessages,
  };
}
