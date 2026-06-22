"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface InspectorSectionProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** 检视器内的可折叠分组，折叠态按 id 持久化到 localStorage。 */
export function InspectorSection({ id, title, icon, defaultOpen = true, children }: InspectorSectionProps) {
  const key = `admin:inspector:section:${id}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(key);
      if (v != null) setOpen(v === "1");
    } catch {
      /* ignore */
    }
  }, [key]);

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <section className="border-b border-[var(--card-border)] last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        {icon}
        {title}
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </section>
  );
}
