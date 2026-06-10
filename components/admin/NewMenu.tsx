// components/admin/NewMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, ChevronDown, FileText, FolderOpen, Rocket } from "lucide-react";

export function NewMenu({ onPicked }: { onPicked?: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const item = (href: string, label: string, Icon: typeof FileText) => (
    <Link
      href={href}
      onClick={() => {
        setOpen(false);
        onPicked?.();
      }}
      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> 新建</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-lg overflow-hidden">
          {item("/admin/articles/edit?new=1", "新文章", FileText)}
          {item("/admin/projects/edit?new=1", "新项目", Rocket)}
          {item("/admin/categories/edit?new=1", "新专栏", FolderOpen)}
        </div>
      )}
    </div>
  );
}
