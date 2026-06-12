// components/admin/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FolderOpen, Rocket, User, Palette, Stethoscope, StickyNote } from "lucide-react";
import { NewMenu } from "./NewMenu";

type BadgeKey = "drafts" | "healthIssues";

const groups: {
  label: string;
  items: { href: string; label: string; Icon: typeof FileText; badge?: BadgeKey; badgeTone?: string }[];
}[] = [
  {
    label: "内容",
    items: [
      { href: "/admin/articles", label: "文章", Icon: FileText, badge: "drafts", badgeTone: "bg-fuchsia-500/15 text-fuchsia-400" },
      { href: "/admin/categories", label: "专栏", Icon: FolderOpen },
      { href: "/admin/projects", label: "项目", Icon: Rocket },
      { href: "/admin/notes", label: "随手记", Icon: StickyNote },
    ],
  },
  {
    label: "站点",
    items: [
      { href: "/admin/about", label: "关于我", Icon: User },
      { href: "/admin/theme", label: "主题与媒体", Icon: Palette },
      { href: "/admin/content-health", label: "内容体检", Icon: Stethoscope, badge: "healthIssues", badgeTone: "bg-red-500/15 text-red-400" },
    ],
  },
];

type Counts = { drafts: number; scheduled: number; healthIssues: number };

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts | null>(null);

  // 路由变化时刷新徽标（保存/发布后回到列表即更新）。
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/overview")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Counts | null) => {
        if (alive && d) setCounts(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);
  return (
    <aside className="w-full h-full border-r border-[var(--card-border)] bg-[var(--card)]/30 backdrop-blur flex flex-col">
      <div className="p-4 border-b border-[var(--card-border)]">
        <Link href="/admin" className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)]" onClick={onNavigate}>
          后台管理
        </Link>
      </div>
      <div className="p-3 border-b border-[var(--card-border)]">
        <NewMenu onPicked={onNavigate} />
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-2 mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">{g.label}</div>
            <ul className="space-y-1">
              {g.items.map(({ href, label, Icon, badge, badgeTone }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                const count = badge && counts ? counts[badge] : 0;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "text-[var(--foreground)] hover:bg-[var(--card)]/60"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--primary)]" />}
                      <Icon className="w-4 h-4" />
                      {label}
                      {count > 0 && (
                        <span className={`ml-auto text-[10px] leading-none px-1.5 py-0.5 rounded-full tabular-nums ${badgeTone ?? "bg-[var(--primary)]/15 text-[var(--primary)]"}`}>
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
