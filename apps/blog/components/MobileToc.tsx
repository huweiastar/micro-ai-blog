"use client";

import { useState } from "react";
import Link from "next/link";
import { ListTree, ChevronDown } from "lucide-react";
import type { TocItem } from "../lib/posts";

/**
 * 移动端 / 平板（<lg）文章内目录：可折叠卡片，点击条目跳转后自动收起。
 * 桌面端由侧栏 <Toc> 承担，故此组件用 lg:hidden 仅在窄屏显示。
 */
export function MobileToc({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="lg:hidden mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)]/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)]"
      >
        <span className="inline-flex items-center gap-2">
          <ListTree className="w-4 h-4 text-[var(--primary)]" />
          目录
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <nav className="border-t border-[var(--card-border)] px-2 py-2 space-y-0.5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setOpen(false)}
              className={`block text-sm py-1.5 rounded-md text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors ${
                item.level === 3 ? "pl-7" : "pl-3"
              }`}
            >
              {item.text}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
