"use client";

import { useCallback, useRef, useState } from "react";
import type { AssistAction } from "../../../lib/assistant/editor-assist";

export type AssistStatus = "idle" | "generating" | "done" | "error";

/** 消费 /api/assistant/assist 的 SSE 流，管理生成状态与输出。 */
export function useAssistStream() {
  const [status, setStatus] = useState<AssistStatus>("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const outputRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus(outputRef.current ? "done" : "idle");
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    outputRef.current = "";
    setOutput("");
    setError("");
    setStatus("idle");
  }, []);

  const start = useCallback(async (action: AssistAction, text: string, title?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("generating");
    setOutput("");
    setError("");
    outputRef.current = "";

    try {
      const response = await fetch("/api/assistant/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ action, text, title }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "请求失败");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamError = "";

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
            const event = JSON.parse(trimmed.slice(5).trim());
            if (event.type === "chunk" && event.content) {
              outputRef.current += event.content;
              setOutput(outputRef.current);
            } else if (event.type === "error") {
              streamError = event.error || "生成中断";
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      if (streamError && !outputRef.current) {
        throw new Error(streamError);
      }
      setStatus("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return;
      }
      setError((err as Error).message || "生成失败");
      setStatus("error");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  return { status, output, error, start, stop, reset };
}
