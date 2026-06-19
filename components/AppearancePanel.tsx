"use client";

import { useEffect, useState } from "react";
import { X, Check, RotateCcw } from "lucide-react";
import {
  APPEARANCE_OPEN_EVENT,
  ACCENT_OPTIONS,
  DEFAULT_APPEARANCE,
  applyAppearance,
  readAppearance,
  type AppearancePrefs,
  type FontKey,
  type RadiusKey,
} from "./appearance-bus";

const FONT_OPTIONS: { key: FontKey; label: string }[] = [
  { key: "sans", label: "无衬线" },
  { key: "serif", label: "衬线" },
];
const RADIUS_OPTIONS: { key: RadiusKey; label: string }[] = [
  { key: "compact", label: "紧凑" },
  { key: "standard", label: "标准" },
  { key: "round", label: "圆润" },
];

export function AppearancePanel() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<AppearancePrefs>(DEFAULT_APPEARANCE);

  // 挂载后同步当前偏好（init 脚本已应用到 <html>，这里只为面板回显）
  useEffect(() => {
    setPrefs(readAppearance());
    const onOpen = () => setOpen(true);
    window.addEventListener(APPEARANCE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(APPEARANCE_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const update = (patch: Partial<AppearancePrefs>) => {
    // 函数式更新：避免同一 tick 内连续修改读到旧闭包 prefs 而互相覆盖
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      applyAppearance(next);
      return next;
    });
  };

  const reset = () => {
    setPrefs(DEFAULT_APPEARANCE);
    applyAppearance(DEFAULT_APPEARANCE);
  };

  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />
      {/* 抽屉 */}
      <aside
        role="dialog"
        aria-label="外观设置"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-[121] flex h-full w-80 max-w-[85vw] flex-col border-l border-[var(--card-border)] bg-[var(--card)] shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">外观设置</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="关闭"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
          {/* 强调色 */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              强调色
            </h3>
            <div className="flex flex-wrap gap-3">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => update({ accent: opt.key })}
                  title={opt.label}
                  aria-label={opt.label}
                  aria-pressed={prefs.accent === opt.key}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-[var(--card)] transition-all ${
                    prefs.accent === opt.key
                      ? "ring-[var(--foreground)]"
                      : "ring-transparent hover:ring-[var(--card-border)]"
                  }`}
                  style={{ background: opt.swatch }}
                >
                  {prefs.accent === opt.key && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* 正文字体 */}
          <Segmented
            title="正文字体"
            options={FONT_OPTIONS}
            value={prefs.font}
            onChange={(v) => update({ font: v })}
          />

          {/* 圆角 */}
          <Segmented
            title="圆角"
            options={RADIUS_OPTIONS}
            value={prefs.radius}
            onChange={(v) => update({ radius: v })}
          />
        </div>

        <footer className="border-t border-[var(--card-border)] px-5 py-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
          >
            <RotateCcw className="h-4 w-4" />
            恢复默认
          </button>
        </footer>
      </aside>
    </>
  );
}

function Segmented<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        {title}
      </h3>
      <div className="flex gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-1">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            aria-pressed={value === opt.key}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
              value === opt.key
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </section>
  );
}
