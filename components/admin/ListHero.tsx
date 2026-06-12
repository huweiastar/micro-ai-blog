"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type AdminHue = "indigo" | "violet" | "teal" | "amber";

// Tailwind 需要静态类名，按色调枚举映射
const HUE: Record<
  AdminHue,
  { tile: string; glow: string; ring: string; chip: string }
> = {
  indigo: {
    tile: "from-indigo-500 to-blue-500 shadow-indigo-500/30",
    glow: "from-indigo-500/15",
    ring: "ring-indigo-500/20",
    chip: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-300",
  },
  violet: {
    tile: "from-violet-500 to-fuchsia-500 shadow-violet-500/30",
    glow: "from-violet-500/15",
    ring: "ring-violet-500/20",
    chip: "bg-violet-500/10 text-violet-500 dark:text-violet-300",
  },
  teal: {
    tile: "from-teal-500 to-emerald-500 shadow-teal-500/30",
    glow: "from-teal-500/15",
    ring: "ring-teal-500/20",
    chip: "bg-teal-500/10 text-teal-600 dark:text-teal-300",
  },
  amber: {
    tile: "from-amber-400 to-orange-500 shadow-amber-500/30",
    glow: "from-amber-500/15",
    ring: "ring-amber-500/20",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
};

export interface ListHeroProps {
  icon: LucideIcon;
  hue: AdminHue;
  title: string;
  description?: string;
  /** 统计胶囊，如 [{label:"已发布", value:12}] */
  stats?: { label: string; value: number | string }[];
  /** 右侧动作区（新建按钮等） */
  action?: ReactNode;
}

/** 后台列表页统一页头：渐变徽块 + 氛围光晕 + 统计胶囊。 */
export function ListHero({ icon: Icon, hue, title, description, stats, action }: ListHeroProps) {
  const h = HUE[hue];
  return (
    <header className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 sm:p-6">
      {/* 氛围光晕 */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-gradient-radial ${h.glow} to-transparent blur-2xl`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute -bottom-32 -left-10 h-48 w-48 rounded-full bg-gradient-radial ${h.glow} to-transparent blur-3xl opacity-60`}
      />
      <div className="relative flex flex-wrap items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ring-1 ${h.tile} ${h.ring}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-[var(--muted)]">{description}</p>}
        </div>
        {action}
      </div>
      {stats && stats.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-2">
          {stats.map((s) => (
            <span
              key={s.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${h.chip}`}
            >
              <span className="font-semibold tabular-nums">{s.value}</span>
              {s.label}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
