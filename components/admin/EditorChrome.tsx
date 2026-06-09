"use client";

import { PanelRight, X } from "lucide-react";

interface EditorChromeProps {
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  inspector: React.ReactNode;
  children: React.ReactNode; // 写作区
}

/**
 * 写作区 + 检视器的响应式两栏：
 * - xl 以上：检视器为右侧常驻栏，inspectorOpen=false 时宽度收 0。
 * - xl 以下：检视器为右侧滑出抽屉，inspectorOpen 控制显隐。
 * 「检视器」按钮固定在写作区右上角切换开合。
 */
export function EditorChrome({ inspectorOpen, onToggleInspector, inspector, children }: EditorChromeProps) {
  return (
    <div className="flex h-full min-h-0">
      {/* 写作区 */}
      <div className="relative flex-1 min-w-0 overflow-y-auto">
        <button
          type="button"
          onClick={onToggleInspector}
          aria-pressed={inspectorOpen}
          title="检视器"
          className={`absolute right-3 top-3 z-30 inline-flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1 text-xs transition-colors ${
            inspectorOpen ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--primary)]"
          }`}
        >
          <PanelRight className="h-3.5 w-3.5" />
          检视器
        </button>
        {children}
      </div>

      {/* xl 常驻栏（可收起宽度） */}
      <aside
        className={`hidden shrink-0 overflow-y-auto border-l border-[var(--card-border)] bg-[var(--card)]/40 backdrop-blur transition-[width] xl:block ${
          inspectorOpen ? "w-[300px]" : "w-0"
        }`}
      >
        {inspectorOpen && inspector}
      </aside>

      {/* < xl 抽屉 */}
      <div className="xl:hidden">
        <div
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
            inspectorOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={onToggleInspector}
        />
        <aside
          className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] overflow-y-auto border-l border-[var(--card-border)] bg-[var(--card)] transition-transform duration-200 ${
            inspectorOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-11 items-center justify-between border-b border-[var(--card-border)] px-3">
            <span className="text-sm font-semibold">文章设置</span>
            <button
              onClick={onToggleInspector}
              aria-label="关闭"
              className="p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {inspector}
        </aside>
      </div>
    </div>
  );
}
