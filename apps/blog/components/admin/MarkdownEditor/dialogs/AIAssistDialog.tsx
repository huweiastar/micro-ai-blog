"use client";

import { useEffect, useRef, useState } from "react";
import { X, Sparkles, Loader2, Square, RefreshCw, Replace, Copy, Check } from "lucide-react";
import { useAssistStream } from "../../hooks/useAssistStream";
import type { AssistAction } from "../../../../lib/assistant/editor-assist";

const ACTION_LABELS: Record<AssistAction, string> = {
  polish: "润色",
  expand: "扩写",
  simplify: "通俗化",
  summarize: "生成摘要",
};

interface AIAssistDialogProps {
  action: AssistAction;
  /** 选中的原文。 */
  text: string;
  articleTitle?: string;
  onClose: () => void;
  /** 用生成结果替换选区。 */
  onReplace: (newText: string) => void;
}

export function AIAssistDialog({ action, text, articleTitle, onClose, onReplace }: AIAssistDialogProps) {
  const { status, output, error, start, stop, reset } = useAssistStream();
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);

  // 挂载即开始生成（仅一次；重新生成走按钮）。
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    start(action, text, articleTitle);
  }, [action, text, articleTitle, start]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="glass rounded-2xl mx-4 w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            AI {ACTION_LABELS[action]}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <div className="text-xs text-[var(--muted)] mb-1.5">原文</div>
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-3 max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs text-[var(--muted)] font-mono leading-relaxed">{text}</pre>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                {status === "generating" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    正在生成…
                  </>
                ) : status === "done" ? (
                  "生成结果"
                ) : (
                  "结果"
                )}
              </div>
              {status === "generating" && (
                <button
                  onClick={stop}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Square className="w-3 h-3" />
                  停止
                </button>
              )}
            </div>
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-3 min-h-[160px] max-h-[40vh] overflow-y-auto">
              {status === "error" ? (
                <p className="text-sm text-red-400">{error}</p>
              ) : output ? (
                <pre className="whitespace-pre-wrap text-sm text-[var(--foreground)] font-mono leading-relaxed">{output}</pre>
              ) : (
                <p className="text-sm text-[var(--muted)]">等待 AI 生成…</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {status === "done" && output && (
              <button
                onClick={() => {
                  onReplace(output);
                  handleClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Replace className="w-4 h-4" />
                替换选区
              </button>
            )}
            {(status === "done" || status === "error") && (
              <button
                onClick={() => start(action, text, articleTitle)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重新生成
              </button>
            )}
            {status === "done" && output && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "已复制" : "复制"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
