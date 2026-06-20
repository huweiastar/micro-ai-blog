"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { TECH_ICON_KEYS, TechIcon, isPresetIcon } from "../../lib/tech-icons";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

/**
 * 技术栈图标选择器：可视化网格 + 搜索，并支持填入自定义 emoji / 文字。
 */
export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState(isPreset(value) ? "" : value);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const filtered = query.trim()
    ? TECH_ICON_KEYS.filter((k) => k.includes(query.trim().toLowerCase()))
    : TECH_ICON_KEYS;

  const pick = (icon: string) => {
    onChange(icon);
    setOpen(false);
  };

  const applyCustom = () => {
    const v = custom.trim();
    if (v) pick(v);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] text-sm hover:border-[var(--primary)]/50 transition-colors"
        title="选择图标"
      >
        <TechIcon icon={value} className="w-4 h-4 text-[var(--primary)]" />
        <span className="text-xs text-[var(--muted)] max-w-[80px] truncate">{value}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-72 rounded-xl border border-[var(--card-border)] bg-[var(--background)] shadow-xl p-3 right-0">
          {/* 搜索 */}
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-[var(--muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索图标，如 brain / cloud"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              autoFocus
            />
          </div>

          {/* 图标网格 */}
          <div className="grid grid-cols-7 gap-1 max-h-52 overflow-y-auto pr-1">
            {filtered.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => pick(key)}
                title={key}
                className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                  value === key
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-transparent text-[var(--foreground)] hover:bg-[var(--card)] hover:border-[var(--card-border)]"
                }`}
              >
                <TechIcon icon={key} className="w-4 h-4" />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-7 text-center text-xs text-[var(--muted)] py-4">没有匹配的图标</p>
            )}
          </div>

          {/* 自定义 emoji / 文字 */}
          <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
            <p className="text-xs text-[var(--muted)] mb-1.5">或填入自定义 emoji / 文字</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCustom(); } }}
                placeholder="🐍 / 🔥 / Go"
                maxLength={4}
                className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
              <button
                type="button"
                onClick={applyCustom}
                className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                使用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isPreset(v: string): boolean {
  return isPresetIcon(v);
}
