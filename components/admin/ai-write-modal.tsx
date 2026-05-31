"use client";

import { useState, useRef, useCallback } from "react";
import { X, Sparkles, Loader2, Square, RefreshCw, FileText } from "lucide-react";

interface AiWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (result: {
    title: string;
    summary: string;
    tags: string;
    category: string;
    content: string;
  }) => void;
}

type GenerationStatus = "idle" | "generating" | "done" | "error";

export function AiWriteModal({ isOpen, onClose, onInsert }: AiWriteModalProps) {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("technical");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [rawOutput, setRawOutput] = useState("");
  const rawOutputRef = useRef("");
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (rawOutputRef.current) {
      setStatus("done");
    } else {
      setStatus("idle");
    }
  }, []);

  const startGeneration = useCallback(async () => {
    if (!topic.trim()) return;

    setStatus("generating");
    setRawOutput("");
    rawOutputRef.current = "";
    setErrorMsg("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/assistant/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          topic: topic.trim(),
          style,
          tags: tags.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "请求失败");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
              setRawOutput((prev) => prev + event.content);
              rawOutputRef.current += event.content;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      setStatus("done");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        if (rawOutputRef.current) {
          setStatus("done");
        }
        return;
      }
      setErrorMsg((error as Error).message || "生成失败");
      setStatus("error");
    } finally {
      abortRef.current = null;
    }
  }, [topic, style, tags]);

  const handleInsert = useCallback(() => {
    // Parse the raw output into structured fields
    const parsed = parseArticleOutput(rawOutputRef.current);
    if (!parsed.title && !parsed.content) {
      setErrorMsg("未能解析出有效的文章内容");
      return;
    }
    onInsert(parsed);
    // Reset and close
    setTopic("");
    setStyle("technical");
    setTags("");
    setRawOutput("");
    rawOutputRef.current = "";
    setStatus("idle");
    setErrorMsg("");
    onClose();
  }, [onInsert, onClose]);

  const handleRegenerate = useCallback(() => {
    setRawOutput("");
    startGeneration();
  }, [startGeneration]);

  const resetForm = useCallback(() => {
    setTopic("");
    setStyle("technical");
    setTags("");
    setRawOutput("");
    setStatus("idle");
    setErrorMsg("");
    onClose();
  }, [onClose]);

  const getStatusText = () => {
    if (rawOutput.length === 0) return "正在检索参考资料...";
    if (rawOutput.length < 50) return "正在生成标题和摘要...";
    if (rawOutput.includes("---CONTENT---")) return "正在撰写正文...";
    return "正在生成中...";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="glass rounded-2xl mx-4 w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            AI 帮写
          </h3>
          <button onClick={resetForm} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Input Section */}
          {status === "idle" && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  文章主题 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如：如何用 Rust 写一个异步 HTTP 客户端"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && topic.trim() && startGeneration()}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">写作风格</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
                  >
                    <option value="technical">技术解析</option>
                    <option value="tutorial">教程指南</option>
                    <option value="opinion">观点评论</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">标签提示（可选）</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Rust, 异步, HTTP"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={startGeneration}
                disabled={!topic.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                开始生成
              </button>
            </div>
          )}

          {/* Generating / Done Section */}
          {(status === "generating" || status === "done") && (
            <div className="p-6 space-y-4">
              {/* Status bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  {status === "generating" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {getStatusText()}
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-green-400" />
                      生成完成
                    </>
                  )}
                </div>
                {status === "generating" && (
                  <button
                    onClick={stopGeneration}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Square className="w-3 h-3" />
                    停止
                  </button>
                )}
              </div>

              {/* Preview */}
              <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4 min-h-[300px] max-h-[50vh] overflow-y-auto">
                {rawOutput ? (
                  <pre className="whitespace-pre-wrap text-sm text-[var(--foreground)] font-mono leading-relaxed">
                    {rawOutput}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-48 text-[var(--muted)] text-sm">
                    等待 AI 生成内容...
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {status === "done" && (
                <div className="flex gap-3">
                  <button
                    onClick={handleInsert}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    插入编辑器
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重新生成
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="p-6 space-y-4">
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-sm text-red-400 mb-4">{errorMsg || "生成失败，请重试"}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setErrorMsg(""); setRawOutput(""); setStatus("idle"); }}
                    className="px-5 py-2.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    返回修改
                  </button>
                  <button
                    onClick={startGeneration}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重试
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Parse raw AI output into structured article fields.
 * Same logic as parseArticleOutput in article-writer.ts (client-side fallback).
 */
function parseArticleOutput(raw: string): {
  title: string;
  summary: string;
  tags: string;
  category: string;
  content: string;
} {
  const extract = (startMarker: string, endMarker: string): string => {
    const startIdx = raw.indexOf(startMarker);
    if (startIdx === -1) return "";
    const contentStart = startIdx + startMarker.length;
    const endIdx = endMarker ? raw.indexOf(endMarker, contentStart) : -1;
    return raw
      .substring(contentStart, endIdx === -1 ? undefined : endIdx)
      .trim();
  };

  return {
    title: extract("---TITLE---", "---SUMMARY---"),
    summary: extract("---SUMMARY---", "---TAGS---"),
    tags: extract("---TAGS---", "---CATEGORY---"),
    category: extract("---CATEGORY---", "---CONTENT---"),
    content: extract("---CONTENT---", ""),
  };
}
