"use client";

import { useState } from "react";

type FontMode = "family" | "size" | "color" | "lineHeight" | "spacing";

interface FontDialogProps {
  /** null = closed; otherwise open in this mode */
  mode: FontMode | null;
  onClose: () => void;
  /** Insert a wrapping `<span style="...">…</span>` snippet around the selection. */
  onConfirm: (openTag: string, closeTag: string) => void;
}

const FONTS = ["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "PingFang SC", "Microsoft YaHei"];
const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36];
const LINE_HEIGHTS = [1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6];
const SPACINGS = [4, 8, 12, 16, 20, 24, 32, 40, 48];
const COLORS = ["#1e293b", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#6b7280", "#94a3b8", "#000000"];

export function FontDialog({ mode, onClose, onConfirm }: FontDialogProps) {
  const [color, setColor] = useState("#6366f1");
  const [customSize, setCustomSize] = useState(16);
  const [customLineHeight, setCustomLineHeight] = useState(1.8);
  const [customSpacing, setCustomSpacing] = useState(8);
  if (mode === null) return null;

  const wrap = (decl: string) => onConfirm(`<span style="${decl}">`, `</span>`);
  const close = (decl: string) => {
    wrap(decl);
    onClose();
  };

  return (
    <div
      className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-72"
      onMouseLeave={onClose}
    >
      {mode === "family" && (
        <>
          <p className="text-xs text-[var(--muted)] mb-2 px-1">选择字体</p>
          <div className="grid grid-cols-2 gap-1.5">
            {FONTS.map((f) => (
              <button
                key={f}
                onClick={() => close(`font-family: '${f}'`)}
                className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left truncate"
                style={{ fontFamily: f }}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      )}

      {mode === "size" && (
        <>
          <p className="text-xs text-[var(--muted)] mb-2 px-1">字体大小 (px)</p>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => close(`font-size: ${s}px`)}
                className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center"
              >
                {s}px
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]">自定义</label>
            <input
              type="number"
              min={8}
              max={72}
              value={customSize}
              onChange={(e) => setCustomSize(Number(e.target.value))}
              className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
            />
            <button onClick={() => close(`font-size: ${customSize}px`)} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">
              应用
            </button>
          </div>
        </>
      )}

      {mode === "color" && (
        <>
          <p className="text-xs text-[var(--muted)] mb-2 px-1">选择颜色</p>
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => close(`color: ${c}`)}
                className="w-8 h-8 rounded-md border border-[var(--card-border)] hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <span className="text-xs text-[var(--muted)] font-mono">{color}</span>
            <button onClick={() => close(`color: ${color}`)} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white ml-auto">
              应用
            </button>
          </div>
        </>
      )}

      {mode === "lineHeight" && (
        <>
          <p className="text-xs text-[var(--muted)] mb-2 px-1">行间距</p>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {LINE_HEIGHTS.map((v) => (
              <button
                key={v}
                onClick={() => close(`line-height: ${v}`)}
                className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center"
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]">自定义</label>
            <input
              type="number"
              min={0.5}
              max={4}
              step={0.1}
              value={customLineHeight}
              onChange={(e) => setCustomLineHeight(Number(e.target.value))}
              className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
            />
            <button onClick={() => close(`line-height: ${customLineHeight}`)} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">
              应用
            </button>
          </div>
        </>
      )}

      {mode === "spacing" && (
        <>
          <p className="text-xs text-[var(--muted)] mb-2 px-1">段落间距 (px)</p>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {SPACINGS.map((v) => (
              <button
                key={v}
                onClick={() => close(`margin-bottom: ${v}px`)}
                className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center"
              >
                {v}px
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]">自定义</label>
            <input
              type="number"
              min={0}
              max={100}
              value={customSpacing}
              onChange={(e) => setCustomSpacing(Number(e.target.value))}
              className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
            />
            <button onClick={() => close(`margin-bottom: ${customSpacing}px`)} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">
              应用
            </button>
          </div>
        </>
      )}
    </div>
  );
}
