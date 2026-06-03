"use client";

import { useState } from "react";

interface LinkDialogProps {
  open: boolean;
  onClose: () => void;
  /** Returns the markdown to insert. */
  onConfirm: (text: string, url: string) => void;
}

export function LinkDialog({ open, onClose, onConfirm }: LinkDialogProps) {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  if (!open) return null;
  return (
    <div className="absolute z-40 top-full left-0 mt-1 p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-72">
      <p className="text-sm text-[var(--foreground)] mb-3">插入链接</p>
      <div className="space-y-2 mb-3">
        <div>
          <label className="text-xs text-[var(--muted)]">显示文字</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="链接显示的文字"
            className="w-full px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className="w-full px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            onConfirm(text || url, url);
            onClose();
          }}
          disabled={!url.trim()}
          className="flex-1 text-xs px-3 py-1.5 rounded bg-[var(--primary)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          插入
        </button>
        <button
          onClick={onClose}
          className="flex-1 text-xs px-3 py-1.5 rounded border border-[var(--card-border)] text-[var(--muted)]"
        >
          取消
        </button>
      </div>
    </div>
  );
}
