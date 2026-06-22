import Link from "next/link";
import { FileText, StickyNote } from "lucide-react";
import { formatShortDate } from "../lib/utils";

export interface ActivityItem {
  date: string;
  type: "article" | "note";
  title: string;
  href: string;
}

const TYPE_META = {
  article: {
    label: "文章",
    Icon: FileText,
    badge: "bg-[var(--primary)]/10 text-[var(--primary)]",
    dot: "bg-[var(--primary)]",
  },
  note: {
    label: "随手记",
    Icon: StickyNote,
    badge: "bg-sky-500/10 text-sky-500 dark:text-sky-400",
    dot: "bg-sky-400",
  },
} as const;

/**
 * 首页「最新动态」：文章 + 随手记按时间合并的紧凑时间线，
 * 把原本只在 /notes 才能看到的随手记带到首屏，提升信息密度。
 */
export function HomeActivity({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;

  return (
    <ol className="relative ml-2 space-y-4 border-l-2 border-[var(--card-border)] pl-6">
      {items.map((item, i) => {
        const meta = TYPE_META[item.type];
        return (
          <li key={item.href + i} className="relative">
            <span
              aria-hidden
              style={{ left: "-31px" }}
              className={`absolute top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--background)] ${meta.dot} ${i === 0 ? "dot-pulse" : ""}`}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}
              >
                <meta.Icon className="h-3 w-3" />
                {meta.label}
              </span>
              <Link
                href={item.href}
                className="flex-1 text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
              >
                {item.title}
              </Link>
              <span className="font-mono text-xs tabular-nums text-[var(--muted)]">
                {formatShortDate(item.date)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
