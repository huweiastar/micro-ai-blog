"use client";

import { useState } from "react";

const escapeHtmlAttr = (s: string): string =>
  s.replace(/&/g, "&amp;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#39;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;");

const escapeHtmlText = (s: string): string =>
  s.replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;");

type ImageSize = "small" | "medium" | "full" | "custom";
type ImageLayout = "single" | "double";

interface ImageDialogProps {
  open: boolean;
  onClose: () => void;
  /** First-image URL (or only URL for single layout). */
  primaryUrl: string;
  /** Returns the markdown/HTML to insert at the cursor. */
  onConfirm: (markdown: string) => void;
}

const SIZE_STYLE: Record<ImageSize, (custom?: number) => string> = {
  small: () => `width="33%"`,
  medium: () => `width="66%"`,
  full: () => `width="100%"`,
  custom: (w = 400) => `width="${w}px"`,
};

export function ImageDialog({ open, onClose, primaryUrl, onConfirm }: ImageDialogProps) {
  const [alt, setAlt] = useState("");
  const [size, setSize] = useState<ImageSize>("full");
  const [customWidth, setCustomWidth] = useState(400);
  const [layout, setLayout] = useState<ImageLayout>("single");
  const [secondUrl, setSecondUrl] = useState("");
  if (!open) return null;

  const handleInsert = () => {
    const sa = SIZE_STYLE[size](customWidth);
    const cap = escapeHtmlText(alt || "在此输入图片描述...");
    const altText = escapeHtmlAttr(alt || "图片");
    let md = "";
    if (layout === "double" && secondUrl) {
      md = `\n<div class="flex gap-4">\n<figure class="image-block flex-1"><img src="${escapeHtmlAttr(primaryUrl)}" alt="图片1" ${sa} /><figcaption class="image-caption">${cap}</figcaption></figure>\n<figure class="image-block flex-1"><img src="${escapeHtmlAttr(secondUrl)}" alt="${altText}" ${sa} /><figcaption class="image-caption">${cap}</figcaption></figure>\n</div>\n`;
    } else {
      md = `\n<figure class="image-block">\n  <img src="${escapeHtmlAttr(primaryUrl)}" alt="${altText}" ${sa} />\n  <figcaption class="image-caption">${cap}</figcaption>\n</figure>\n`;
    }
    onConfirm(md);
    onClose();
  };

  return (
    <div className="absolute z-40 top-full left-0 mt-1 p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-80">
      <p className="text-sm font-medium text-[var(--foreground)] mb-3">图片设置</p>
      <div className="mb-3">
        <label className="text-xs text-[var(--muted)] block mb-1">图片描述</label>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="图片描述..."
          className="w-full px-2 py-1.5 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
        />
      </div>
      <div className="mb-3">
        <label className="text-xs text-[var(--muted)] block mb-1">图片大小</label>
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {([
            { key: "small", label: "小", sub: "33%" },
            { key: "medium", label: "中", sub: "66%" },
            { key: "full", label: "大", sub: "100%" },
            { key: "custom", label: "自定义", sub: "" },
          ] as const).map((s) => (
            <button
              key={s.key}
              onClick={() => setSize(s.key)}
              className={`text-xs px-2 py-1.5 rounded transition-colors text-center ${size === s.key ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}
            >
              {s.label}
              {s.sub && <span className="block text-[10px] opacity-60">{s.sub}</span>}
            </button>
          ))}
        </div>
        {size === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={50}
              max={2000}
              value={customWidth}
              onChange={(e) => setCustomWidth(Number(e.target.value))}
              className="w-20 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
            />
            <span className="text-xs text-[var(--muted)]">px</span>
          </div>
        )}
      </div>
      <div className="mb-4">
        <label className="text-xs text-[var(--muted)] block mb-1">排版</label>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { key: "single", label: "单图" },
            { key: "double", label: "双栏并排" },
          ] as const).map((l) => (
            <button
              key={l.key}
              onClick={() => setLayout(l.key)}
              className={`text-xs px-2 py-2 rounded transition-colors text-center ${layout === l.key ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        {layout === "double" && (
          <div className="mt-2">
            <label className="text-xs text-[var(--muted)] block mb-1">第二张图片 URL</label>
            <input
              type="text"
              value={secondUrl}
              onChange={(e) => setSecondUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-2 py-1.5 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
            />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleInsert}
          disabled={layout === "double" && !secondUrl.trim()}
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
